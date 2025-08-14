const express = require('express');
const EnvironmentProfile = require('../models/EnvironmentProfile');
const { authenticate } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/environment-profiles
// @desc    Get user's environment profiles
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const profiles = await EnvironmentProfile.find({ 
      createdBy: req.user._id,
      isActive: true 
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const formattedProfiles = profiles.map(profile => ({
      id: profile._id,
      name: profile.name,
      clientId: profile.clientId,
      url: profile.url,
      createdAt: profile.createdAt,
      createdBy: profile.createdBy.email
    }));

    res.json({
      profiles: formattedProfiles
    });
  } catch (error) {
    console.error('Get environment profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/environment-profiles
// @desc    Create new environment profile
// @access  Private
router.post('/', authenticate, validateRequest(schemas.createEnvironmentProfile), async (req, res) => {
  try {
    const { name, clientId, url } = req.body;

    // Check if profile with same name already exists for this user
    const existingProfile = await EnvironmentProfile.findOne({
      name,
      createdBy: req.user._id,
      isActive: true
    });

    if (existingProfile) {
      return res.status(400).json({ 
        message: 'Environment profile with this name already exists' 
      });
    }

    // Create new environment profile
    const profile = new EnvironmentProfile({
      name,
      clientId,
      url,
      createdBy: req.user._id
    });

    await profile.save();
    await profile.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Environment profile created successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        clientId: profile.clientId,
        url: profile.url,
        createdAt: profile.createdAt,
        createdBy: profile.createdBy.email
      }
    });
  } catch (error) {
    console.error('Create environment profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/environment-profiles/:id
// @desc    Update environment profile
// @access  Private
router.put('/:id', authenticate, validateRequest(schemas.updateEnvironmentProfile), async (req, res) => {
  try {
    const { name, clientId, url } = req.body;
    
    const profile = await EnvironmentProfile.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Environment profile not found' });
    }

    // Check if name is being changed and already exists
    if (name && name !== profile.name) {
      const existingProfile = await EnvironmentProfile.findOne({
        name,
        createdBy: req.user._id,
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingProfile) {
        return res.status(400).json({ 
          message: 'Environment profile with this name already exists' 
        });
      }
    }

    // Update profile
    if (name) profile.name = name;
    if (clientId) profile.clientId = clientId;
    if (url) profile.url = url;

    await profile.save();
    await profile.populate('createdBy', 'name email');

    res.json({
      message: 'Environment profile updated successfully',
      profile: {
        id: profile._id,
        name: profile.name,
        clientId: profile.clientId,
        url: profile.url,
        createdAt: profile.createdAt,
        createdBy: profile.createdBy.email
      }
    });
  } catch (error) {
    console.error('Update environment profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/environment-profiles/:id
// @desc    Delete environment profile (soft delete)
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const profile = await EnvironmentProfile.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({ message: 'Environment profile not found' });
    }

    // Soft delete
    profile.isActive = false;
    await profile.save();

    res.json({ message: 'Environment profile deleted successfully' });
  } catch (error) {
    console.error('Delete environment profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;