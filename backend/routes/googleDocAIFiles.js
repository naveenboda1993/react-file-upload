const express = require('express');
const multer = require('multer');
const Document = require('../models/Document');
const { authenticate } = require('../middleware/auth');
const { uploadToGoogleDocAI, checkGoogleDocAIStatus, getGoogleDocAIResult, parseGoogleDocAIResponse } = require('../services/googleDocumentAIService');
const { startBackgroundPolling } = require('../services/googleDocAIPollingService');

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

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(`Uploading file to Google Document AI: ${req.file.originalname}`);

    const googleResponse = await uploadToGoogleDocAI(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const document = new Document({
      name: req.file.originalname,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedBy: req.user._id,
      status: googleResponse.operationName ? 'uploading' : 'DONE',
      blobName: googleResponse.documentId,
      processingService: 'google',
      serviceTaskId: googleResponse.documentId,
      operationName: googleResponse.operationName
    });

    if (googleResponse.result) {
      const extraction = parseGoogleDocAIResponse(googleResponse);
      document.extraction = extraction;
      document.status = 'DONE';
      document.sapFinishedAt = new Date();
    }

    await document.save();
    await document.populate('uploadedBy', 'name email');

    if (googleResponse.operationName) {
      startBackgroundPolling(googleResponse.operationName, document._id);
    }

    res.status(201).json({
      message: 'File uploaded successfully to Google Document AI',
      document,
      operationName: googleResponse.operationName,
      processingAsync: !!googleResponse.operationName
    });
  } catch (error) {
    console.error('Google Document AI upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/status/:operationName', authenticate, async (req, res) => {
  try {
    const { operationName } = req.params;

    const status = await checkGoogleDocAIStatus(operationName);

    res.json({
      operationName,
      status: status.status,
      done: status.done,
      error: status.error
    });
  } catch (error) {
    console.error('Google Document AI status check error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/result/:operationName', authenticate, async (req, res) => {
  try {
    const { operationName } = req.params;

    const result = await getGoogleDocAIResult(operationName);
    const extraction = parseGoogleDocAIResponse(result);

    res.json({
      operationName,
      extraction,
      rawResult: process.env.NODE_ENV === 'development' ? result : undefined
    });
  } catch (error) {
    console.error('Google Document AI result fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

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

    if (document.processingService !== 'google') {
      return res.status(400).json({ message: 'Document was not processed with Google Document AI' });
    }

    res.json({
      documentId: document._id,
      status: document.status,
      processingService: document.processingService,
      serviceTaskId: document.serviceTaskId,
      operationName: document.operationName,
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

    if (!document.operationName) {
      return res.status(400).json({ message: 'No operation name found for this document' });
    }

    const newStatus = await checkGoogleDocAIStatus(document.operationName);

    if (newStatus.done) {
      const result = await getGoogleDocAIResult(document.operationName);
      const extraction = parseGoogleDocAIResponse(result);

      document.status = 'DONE';
      document.extraction = extraction;
      document.errorMessage = null;
      document.sapFinishedAt = new Date();
      await document.save();

      return res.json({
        message: 'Document processing completed',
        document
      });
    } else if (newStatus.error) {
      return res.status(400).json({
        message: `Google Document AI processing failed: ${newStatus.error.message}`,
        error: newStatus.error
      });
    } else {
      return res.json({
        message: 'Document is still processing',
        status: newStatus.status
      });
    }
  } catch (error) {
    console.error('Document retry error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
