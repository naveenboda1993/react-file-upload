const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');

// Get insights stats
router.get('/stats', auth, async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const totalSharedDocuments = await Document.countDocuments({ isShared: true });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get processing statistics
    const documents = await Document.find().select('status');
    const processingSuccess = documents.filter(d => d.status === 'completed').length;
    const processingFailed = documents.filter(d => d.status === 'failed').length;

    // Calculate average processing time
    const completedDocs = await Document.find({ status: 'completed' }).select('created finished');
    let averageProcessingTime = 0;
    
    if (completedDocs.length > 0) {
      const totalTime = completedDocs.reduce((sum, doc) => {
        if (doc.created && doc.finished) {
          const created = new Date(doc.created).getTime();
          const finished = new Date(doc.finished).getTime();
          return sum + (finished - created);
        }
        return sum;
      }, 0);
      averageProcessingTime = Math.round(totalTime / completedDocs.length / 1000); // in seconds
    }

    res.json({
      totalDocuments,
      totalSharedDocuments,
      activeUsers,
      processingSuccess,
      processingFailed,
      averageProcessingTime,
    });
  } catch (error) {
    console.error('Error fetching insights stats:', error);
    res.status(500).json({ message: 'Failed to fetch insights stats' });
  }
});

// Get Power BI configuration
router.get('/config', auth, async (req, res) => {
  try {
    const config = {
      embedUrl: process.env.POWERBI_EMBED_URL,
      reportId: process.env.POWERBI_REPORT_ID,
      groupId: process.env.POWERBI_GROUP_ID,
    };

    if (!config.embedUrl || !config.reportId || !config.groupId) {
      return res.status(400).json({ message: 'Power BI configuration is incomplete' });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching Power BI config:', error);
    res.status(500).json({ message: 'Failed to fetch Power BI configuration' });
  }
});

// Get Power BI embed token
router.post('/powerbi-token', auth, async (req, res) => {
  try {
    const powerBIConfig = {
      embedUrl: process.env.POWERBI_EMBED_URL,
      reportId: process.env.POWERBI_REPORT_ID,
      groupId: process.env.POWERBI_GROUP_ID,
      accessToken: process.env.POWERBI_ACCESS_TOKEN,
      userName: req.user.name,
      userId: req.user._id,
    };

    if (!powerBIConfig.accessToken) {
      return res.status(400).json({ message: 'Power BI access token not configured' });
    }

    res.json(powerBIConfig);
  } catch (error) {
    console.error('Error generating Power BI token:', error);
    res.status(500).json({ message: 'Failed to generate Power BI token' });
  }
});

module.exports = router;