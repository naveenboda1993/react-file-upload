const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const { authenticate, authorize } = require('../middleware/auth');
const azureBlobService = require('../services/azureBlobService');
const sAPAuthService = require('../services/sapAuth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'xlsx', 'xls', 'ppt', 'pptx'
    ];
    
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} is not allowed`), false);
    }
  }
});

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    await sAPAuthService.fetchAndSaveSAPAuth(req.user._id)
      .then(() => {
        console.log('SAP Auth token fetched and saved successfully');
      })
      .catch((error) => {
        console.error('Error fetching SAP Auth token:', error);
        return res.status(500).json({ message: 'Failed to fetch SAP Auth token' });
      });

    // Upload to Azure Blob Storage
    //const uploadResult = await azureBlobService.uploadFile(req.file, req.user._id);

    // Always generate a unique blobName
    const blobName = uuidv4();

    // Save document metadata to database
    const document = new Document({
      name: req.file.originalname,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedBy: req.user._id,
      blobName, // Always set this!
      // downloadUrl: uploadResult.downloadUrl (if available)
    });

    await document.save();
    await document.populate('uploadedBy', 'name email');

    res.status(201).json({
      message: 'File uploaded successfully',
      document: {
        id: document._id,
        name: document.name,
        size: document.size,
        type: document.type,
        uploadedBy: document.uploadedBy.email,
        uploadedAt: document.createdAt,
        isShared: document.isShared,
        shareLink: document.shareLink,
        downloadUrl: document.downloadUrl
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: error.message || 'File upload failed' });
  }
});

// @route   GET /api/files/my-files
// @desc    Get user's uploaded files
// @access  Private
router.get('/my-files', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const documents = await Document.find({ uploadedBy: req.user._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments({ uploadedBy: req.user._id });

    const formattedDocuments = documents.map(doc => ({
      id: doc._id,
      name: doc.name,
      size: doc.size,
      type: doc.type,
      uploadedBy: doc.uploadedBy.email,
      uploadedAt: doc.createdAt,
      isShared: doc.isShared,
      shareLink: doc.shareLink,
      downloadUrl: doc.downloadUrl
    }));

    res.json({
      documents: formattedDocuments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get my files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/files/team-files
// @desc    Get team shared files
// @access  Private
router.get('/team-files', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const documents = await Document.find({ isTeamShared: true })
      .populate('uploadedBy', 'name email')
      .populate('teamSharedBy', 'name email')
      .sort({ teamSharedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments({ isTeamShared: true });

    const formattedDocuments = documents.map(doc => ({
      id: doc._id,
      name: doc.name,
      size: doc.size,
      type: doc.type,
      uploadedBy: doc.uploadedBy.email,
      uploadedAt: doc.createdAt,
      isShared: doc.isShared,
      downloadUrl: doc.downloadUrl
    }));

    res.json({
      documents: formattedDocuments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get team files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/files/:id/share
// @desc    Generate share link for a file
// @access  Private
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user owns the document
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate share token and link
    const shareToken = uuidv4();
    const shareLink = `${process.env.FRONTEND_URL}/shared/${shareToken}`;

    document.isShared = true;
    document.shareToken = shareToken;
    document.shareLink = shareLink;
    document.sharedAt = new Date();

    await document.save();

    res.json({
      message: 'Share link generated successfully',
      shareLink
    });
  } catch (error) {
    console.error('Share file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/files/:id/share-team
// @desc    Share file with team (Admin only)
// @access  Private/Admin
router.post('/:id/share-team', authenticate, authorize('admin'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.isTeamShared = true;
    document.teamSharedBy = req.user._id;
    document.teamSharedAt = new Date();

    await document.save();

    res.json({
      message: 'File shared with team successfully'
    });
  } catch (error) {
    console.error('Share team file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions: owner can delete their files, admin can delete any file
    const canDelete = document.uploadedBy.toString() === req.user._id.toString() || 
                     req.user.role === 'admin';
    
    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete from Azure Blob Storage
    // await azureBlobService.deleteFile(document.blobName);

    // Delete from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/files/download/:blobName
// @desc    Download a file (for development mock)
// @access  Public (in development)
router.get('/download/:blobName', async (req, res) => {
  try {
    const blobName = decodeURIComponent(req.params.blobName);
    
    // In development, serve from mock storage
    if (process.env.NODE_ENV === 'development') {
      const mockFile = azureBlobService.getMockFile(blobName);
      if (!mockFile) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.set({
        'Content-Type': mockFile.mimetype,
        'Content-Disposition': `attachment; filename="${mockFile.originalname}"`,
        'Content-Length': mockFile.size
      });

      return res.send(mockFile.buffer);
    }

    // In production, redirect to Azure Blob Storage URL
    const downloadUrl = await azureBlobService.generateDownloadUrl(blobName);
    res.redirect(downloadUrl);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// @route   GET /api/files/shared/:token
// @desc    Access shared file by token
// @access  Public
router.get('/shared/:token', async (req, res) => {
  try {
    const document = await Document.findOne({ 
      shareToken: req.params.token,
      isShared: true 
    }).populate('uploadedBy', 'name email');
    
    if (!document) {
      return res.status(404).json({ message: 'Shared file not found or link expired' });
    }

    res.json({
      document: {
        id: document._id,
        name: document.name,
        size: document.size,
        type: document.type,
        uploadedBy: document.uploadedBy.name,
        uploadedAt: document.createdAt,
        downloadUrl: document.downloadUrl
      }
    });
  } catch (error) {
    console.error('Get shared file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;