const Document = require('../models/Document');
const { checkABBYYStatus, getABBYYResult, parseABBYYResponse } = require('./abbyyDocumentService');

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2000;

/**
 * Polls ABBYY for task completion
 * @param {string} taskId - ABBYY task ID
 * @param {string} documentId - MongoDB document ID
 * @param {number} attemptCount - Current attempt count
 * @returns {Promise<Object>} - Final result
 */
async function pollABBYYTask(taskId, documentId, attemptCount = 0) {
  try {
    const status = await checkABBYYStatus(taskId);

    console.log(`ABBYY Task ${taskId} status: ${status.status} (Attempt ${attemptCount + 1})`);

    if (status.status === 'Completed') {
      const result = await getABBYYResult(taskId);
      const extraction = parseABBYYResponse(result);

      const document = await Document.findById(documentId);
      if (document) {
        document.status = 'DONE';
        document.extraction = extraction;
        document.sapFinishedAt = new Date();
        await document.save();
      }

      return {
        status: 'Completed',
        extraction,
        taskId
      };
    } else if (status.status === 'ProcessingFailed' || status.status === 'NotEnoughCredits') {
      const errorMsg = `ABBYY processing failed: ${status.status}`;

      const document = await Document.findById(documentId);
      if (document) {
        document.status = 'FAILED';
        document.errorMessage = status.error || errorMsg;
        await document.save();
      }

      throw new Error(errorMsg);
    } else if (attemptCount < MAX_POLL_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      return pollABBYYTask(taskId, documentId, attemptCount + 1);
    } else {
      throw new Error('ABBYY task polling timeout');
    }
  } catch (error) {
    console.error('ABBYY polling error:', error);

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
 * Starts async polling of ABBYY task in the background
 * @param {string} taskId - ABBYY task ID
 * @param {string} documentId - MongoDB document ID
 */
function startBackgroundPolling(taskId, documentId) {
  setImmediate(async () => {
    try {
      await pollABBYYTask(taskId, documentId);
    } catch (error) {
      console.error(`Background polling failed for task ${taskId}:`, error);
    }
  });
}

module.exports = {
  pollABBYYTask,
  startBackgroundPolling
};
