const { uploadToSAP } = require('./sapDocumentService');
const { uploadToABBYY, isABBYYEnabled } = require('./abbyyDocumentService');
const { startBackgroundPolling } = require('./abbyyPollingService');

/**
 * Determines which OCR service to use and processes the document
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalname - Original filename
 * @param {string} mimetype - MIME type
 * @param {string} sapAccessToken - SAP OAuth token
 * @param {string} preferredService - 'sap', 'abbyy', or 'auto'
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

    let processingService = preferredService;

    if (processingService === 'auto') {
      processingService = abbyyEnabled ? 'abbyy' : 'sap';
    }

    console.log(`Processing document with ${processingService} service`);

    if (processingService === 'abbyy' && abbyyEnabled) {
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
 * Initializes polling for async services like ABBYY
 * @param {string} service - Service name ('sap', 'abbyy')
 * @param {string} taskId - Task ID from the service
 * @param {string} documentId - MongoDB document ID
 */
async function initializeAsyncProcessing(service, taskId, documentId) {
  if (service === 'abbyy') {
    startBackgroundPolling(taskId, documentId);
  }
}

module.exports = {
  processDocument,
  initializeAsyncProcessing
};
