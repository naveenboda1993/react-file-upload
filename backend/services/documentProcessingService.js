const { uploadToSAP } = require('./sapDocumentService');
const { uploadToABBYY, isABBYYEnabled } = require('./abbyyDocumentService');
const { startBackgroundPolling: startABBYYPolling } = require('./abbyyPollingService');
const { uploadToGoogleDocAI, isGoogleDocAIEnabled } = require('./googleDocumentAIService');
const { startBackgroundPolling: startGooglePolling } = require('./googleDocAIPollingService');

/**
 * Determines which OCR service to use and processes the document
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalname - Original filename
 * @param {string} mimetype - MIME type
 * @param {string} sapAccessToken - SAP OAuth token
 * @param {string} preferredService - 'sap', 'abbyy', 'google', or 'auto'
 * @returns {Promise<Object>} - Processing result with service info
 */
async function processDocument(
  fileBuffer,
  originalname,
  mimetype,
  sapAccessToken,
  preferredService = 'auto'
) {
  try {
    const abbyyEnabled = isABBYYEnabled();
    const googleEnabled = isGoogleDocAIEnabled();

    let processingService = preferredService;

    if (processingService === 'auto') {
      if (googleEnabled) {
        processingService = 'google';
      } else if (abbyyEnabled) {
        processingService = 'abbyy';
      } else {
        processingService = 'sap';
      }
    }

    console.log(`Processing document with ${processingService} service`);

    if (processingService === 'google' && googleEnabled) {
      const result = await uploadToGoogleDocAI(fileBuffer, originalname, mimetype);

      return {
        service: 'google',
        taskId: result.documentId,
        operationName: result.operationName,
        status: result.status,
        blobName: result.documentId,
        processingAsync: result.operationName ? true : false,
        extraction: result.result ? result.result : null
      };
    } else if (processingService === 'abbyy' && abbyyEnabled) {
      const result = await uploadToABBYY(fileBuffer, originalname, mimetype, {
        language: 'English',
        exportFormat: 'json',
        recognitionLanguage: 'English'
      });

      return {
        service: 'abbyy',
        taskId: result.taskId,
        status: result.status,
        blobName: result.taskId,
        processingAsync: true,
        credits: result.credits
      };
    } else {
      const result = await uploadToSAP(fileBuffer, originalname, mimetype, sapAccessToken);

      return {
        service: 'sap',
        taskId: result.id,
        status: result.status,
        blobName: result.id,
        processingAsync: false
      };
    }
  } catch (error) {
    console.error('Document processing error:', error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
}

/**
 * Initializes polling for async services like ABBYY and Google
 * @param {string} service - Service name ('sap', 'abbyy', 'google')
 * @param {string} taskId - Task ID from the service
 * @param {string} documentId - MongoDB document ID
 * @param {string} operationName - Optional operation name for Google Document AI
 */
async function initializeAsyncProcessing(service, taskId, documentId, operationName = null) {
  if (service === 'abbyy') {
    startABBYYPolling(taskId, documentId);
  } else if (service === 'google' && operationName) {
    startGooglePolling(operationName, documentId);
  }
}

module.exports = {
  processDocument,
  initializeAsyncProcessing
};
