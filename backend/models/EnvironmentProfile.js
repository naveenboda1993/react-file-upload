const mongoose = require('mongoose');

const environmentProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Environment name is required'],
    trim: true,
    maxlength: [100, 'Environment name cannot exceed 100 characters']
  },
  clientId: {
    type: String,
    required: [true, 'Client ID is required'],
    trim: true,
    maxlength: [255, 'Client ID cannot exceed 255 characters']
  },
  url: {
    type: String,
    required: [true, 'Environment URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please enter a valid URL'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator information is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
environmentProfileSchema.index({ createdBy: 1, createdAt: -1 });
environmentProfileSchema.index({ name: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model('EnvironmentProfile', environmentProfileSchema);