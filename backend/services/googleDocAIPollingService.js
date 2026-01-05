const Document = require('../models/Document');
const { checkGoogleDocAIStatus, getGoogleDocAIResult, parseGoogleDocAIResponse } = require('./googleDocumentAIService');

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2000;

/**
 * Polls Google Document AI for operation completion
 * @param {string} operationName - Google Document AI operation name
 * @param {string} documentId - MongoDB document ID
 * @param {number} attemptCount - Current attempt count
 * @returns {Promise<Object>} - Final result
 */
async function pollGoogleDocAITask(operationName, documentId, attemptCount = 0) {
  try {
    if (!operationName) {
      const document = await Document.findById(documentId);
      if (document && document.extraction) {
        document.status = 'DONE';
        await document.save();
        return {
          status: 'DONE',
          extraction: document.extraction
        };
      }
    }

    const status = await checkGoogleDocAIStatus(operationName);

    console.log(`Google Document AI Operation ${operationName} status: ${status.status} (Attempt ${attemptCount + 1})`);

    if (status.done || status.status === 'DONE') {
      const result = status.result || await getGoogleDocAIResult(operationName);
      const extraction = parseGoogleDocAIResponse(result);

      const document = await Document.findById(documentId);
      if (document) {
        document.status = 'DONE';
        document.extraction = extraction;
        document.sapFinishedAt = new Date();
        await document.save();
      }

      return {
        status: 'DONE',
        extraction,
        operationName
      };
    } else if (status.error) {
      const errorMsg = `Google Document AI processing failed: ${status.error.message || 'Unknown error'}`;

      const document = await Document.findById(documentId);
      if (document) {
        document.status = 'FAILED';
        document.errorMessage = status.error.message || errorMsg;
        await document.save();
      }

      throw new Error(errorMsg);
    } else if (attemptCount < MAX_POLL_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      return pollGoogleDocAITask(operationName, documentId, attemptCount + 1);
    } else {
      throw new Error('Google Document AI operation polling timeout');
    }
  } catch (error) {
    console.error('Google Document AI polling error:', error);

    const document = await Document.findById(documentId);
    if (document) {
      document.status = 'FAILED';
      document.errorMessage = error.message;
      await document.save();
    }

    throw error;
  }
}

/**
 * Starts async polling of Google Document AI operation in the background
 * @param {string} operationName - Google Document AI operation name
 * @param {string} documentId - MongoDB document ID
 */
function startBackgroundPolling(operationName, documentId) {
  setImmediate(async () => {
    try {
      await pollGoogleDocAITask(operationName, documentId);
    } catch (error) {
      console.error(`Background polling failed for operation ${operationName}:`, error);
    }
  });
}

module.exports = {
  pollGoogleDocAITask,
  startBackgroundPolling
};
