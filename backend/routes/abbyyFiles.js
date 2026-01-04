const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const { authenticate } = require('../middleware/auth');
const { uploadToABBYY, checkABBYYStatus, getABBYYResult, parseABBYYResponse } = require('../services/abbyyDocumentService');
const { startBackgroundPolling } = require('../services/abbyyPollingService');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'xlsx', 'xls'
    ];

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} is not allowed`), false);
    }
  }
});

/**
 * @route   POST /api/abbyy/upload
 * @desc    Upload a file to ABBYY for OCR processing
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(`Uploading file to ABBYY: ${req.file.originalname}`);

    const abbyyResponse = await uploadToABBYY(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      {
        language: 'English',
        exportFormat: 'json',
        recognitionLanguage: 'English'
      }
    );

    const document = new Document({
      name: req.file.originalname,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedBy: req.user._id,
      status: 'uploading',
      blobName: abbyyResponse.taskId,
      processingService: 'abbyy',
      serviceTaskId: abbyyResponse.taskId
    });

    await document.save();
    await document.populate('uploadedBy', 'name email');

    startBackgroundPolling(abbyyResponse.taskId, document._id);

    res.status(201).json({
      message: 'File uploaded successfully to ABBYY',
      document,
      taskId: abbyyResponse.taskId,
      credits: abbyyResponse.credits
    });
  } catch (error) {
    console.error('ABBYY upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/abbyy/status/:taskId
 * @desc    Check ABBYY task processing status
 * @access  Private
 */
router.get('/status/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    const status = await checkABBYYStatus(taskId);

    res.json({
      taskId,
      status: status.status,
      estimatedProcessingTime: status.estimatedProcessingTime,
      pagesProcessed: status.pagesProcessed,
      error: status.error
    });
  } catch (error) {
    console.error('ABBYY status check error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/abbyy/result/:taskId
 * @desc    Get ABBYY processing result
 * @access  Private
 */
router.get('/result/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { format = 'json' } = req.query;

    const result = await getABBYYResult(taskId, format);
    const extraction = parseABBYYResponse(result);

    res.json({
      taskId,
      format,
      extraction,
      rawResult: process.env.NODE_ENV === 'development' ? result : undefined
    });
  } catch (error) {
    console.error('ABBYY result fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/abbyy/documents/:documentId/status
 * @desc    Get ABBYY document processing status from database
 * @access  Private
 */
router.get('/documents/:documentId/status', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this document' });
    }

    if (document.processingService !== 'abbyy') {
      return res.status(400).json({ message: 'Document was not processed with ABBYY' });
    }

    res.json({
      documentId: document._id,
      status: document.status,
      processingService: document.processingService,
      serviceTaskId: document.serviceTaskId,
      extraction: document.extraction,
      errorMessage: document.errorMessage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    });
  } catch (error) {
    console.error('Document status fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/abbyy/documents/:documentId/retry
 * @desc    Retry ABBYY processing for a failed document
 * @access  Private
 */
router.post('/documents/:documentId/retry', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this document' });
    }

    if (document.status !== 'FAILED') {
      return res.status(400).json({ message: 'Only failed documents can be retried' });
    }

    const newStatus = await checkABBYYStatus(document.serviceTaskId);

    if (newStatus.status === 'Completed') {
      const result = await getABBYYResult(document.serviceTaskId);
      const extraction = parseABBYYResponse(result);

      document.status = 'DONE';
      document.extraction = extraction;
      document.errorMessage = null;
      document.sapFinishedAt = new Date();
      await document.save();

      return res.json({
        message: 'Document processing completed',
        document
      });
    } else if (newStatus.status === 'ProcessingFailed' || newStatus.status === 'NotEnoughCredits') {
      return res.status(400).json({
        message: `ABBYY processing failed: ${newStatus.status}`,
        error: newStatus.error
      });
    } else {
      return res.json({
        message: 'Document is still processing',
        status: newStatus.status,
        estimatedTime: newStatus.estimatedProcessingTime
      });
    }
  } catch (error) {
    console.error('Document retry error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
