const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [255, 'Document name cannot exceed 255 characters']
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'Document size is required'],
    min: [1, 'Document size must be greater than 0']
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  blobName: {
    type: String,
    required: false,
    unique: true
  },
  downloadUrl: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: false
  },
   created: {
    type: String,
    required: false
  },
   finished: {
    type: String,
    required: false
  },
   clientId: {
    type: String,
    required: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  shareLink: {
    type: String,
    sparse: true
  },
  shareToken: {
    type: String,
    sparse: true
  },
  sharedAt: {
    type: Date
  },
  isTeamShared: {
    type: Boolean,
    default: false
  },
  teamSharedAt: {
    type: Date
  },
  teamSharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ isTeamShared: 1, createdAt: -1 });
documentSchema.index({ shareToken: 1 });

module.exports = mongoose.model('Document', documentSchema);