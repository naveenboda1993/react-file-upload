const axios = require('axios');
const FormData = require('form-data');

const GOOGLE_DOC_AI_ENABLED = process.env.GOOGLE_DOC_AI_ENABLED === 'true';
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_LOCATION = process.env.GOOGLE_LOCATION || 'us';
const GOOGLE_PROCESSOR_ID = process.env.GOOGLE_PROCESSOR_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (GOOGLE_DOC_AI_ENABLED && (!GOOGLE_PROJECT_ID || !GOOGLE_PROCESSOR_ID)) {
  console.warn('GOOGLE_DOC_AI_ENABLED is true but required credentials are not set');
}

/**
 * Uploads a document to Google Document AI for processing
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalname - The original file name
 * @param {string} mimetype - The file MIME type
 * @returns {Promise<Object>} - Google Document AI response
 */
async function uploadToGoogleDocAI(fileBuffer, originalname, mimetype) {
  try {
    if (!GOOGLE_DOC_AI_ENABLED) {
      throw new Error('Google Document AI service is not enabled');
    }

    if (!GOOGLE_PROJECT_ID || !GOOGLE_PROCESSOR_ID || !GOOGLE_API_KEY) {
      throw new Error('Google Document AI credentials are not configured');
    }

    const processorName = `projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/processors/${GOOGLE_PROCESSOR_ID}`;
    const url = `https://${GOOGLE_LOCATION}-documentai.googleapis.com/v1/${processorName}:process`;

    const base64Content = fileBuffer.toString('base64');

    const requestBody = {
      rawDocument: {
        content: base64Content,
        mimeType: mimetype
      }
    };

    const response = await axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${GOOGLE_API_KEY}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': GOOGLE_PROJECT_ID
      },
      timeout: 60000,
      maxBodyLength: Infinity
    });

    const operationName = response.data.name;
    const documentId = operationName ? operationName.split('/').pop() : `google-${Date.now()}`;

    return {
      operationName: operationName,
      documentId: documentId,
      status: 'PROCESSING',
      result: response.data.document || null,
      processorName: processorName
    };
  } catch (error) {
    console.error('Google Document AI upload error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error(error.response?.data?.error?.message || error.message || 'Google Document AI upload failed');
  }
}

/**
 * Gets the processing result from Google Document AI
 * @param {string} operationName - The operation name
 * @returns {Promise<Object>} - Processing result
 */
async function getGoogleDocAIResult(operationName) {
  try {
    if (!GOOGLE_DOC_AI_ENABLED) {
      throw new Error('Google Document AI service is not enabled');
    }

    if (!GOOGLE_API_KEY) {
      throw new Error('Google Document AI credentials are not configured');
    }

    const url = `https://${GOOGLE_LOCATION}-documentai.googleapis.com/v1/${operationName}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${GOOGLE_API_KEY}`,
        'x-goog-user-project': GOOGLE_PROJECT_ID
      },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error('Google Document AI result fetch error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error(error.response?.data?.error?.message || error.message || 'Failed to fetch Google Document AI result');
  }
}

/**
 * Checks the processing status of a Google Document AI operation
 * @param {string} operationName - The operation name
 * @returns {Promise<Object>} - Operation status
 */
async function checkGoogleDocAIStatus(operationName) {
  try {
    if (!operationName) {
      return {
        status: 'DONE',
        done: true
      };
    }

    const result = await getGoogleDocAIResult(operationName);

    return {
      operationName: operationName,
      status: result.done ? 'DONE' : 'PROCESSING',
      done: result.done || false,
      error: result.error || null,
      result: result.response || null
    };
  } catch (error) {
    console.error('Google Document AI status check error:', error.message);
    throw error;
  }
}

/**
 * Parses Google Document AI response and extracts structured data
 * @param {Object} googleResponse - Raw Google Document AI response
 * @returns {Object} - Structured extraction data
 */
function parseGoogleDocAIResponse(googleResponse) {
  try {
    const extraction = {
      headerFields: [],
      lineItems: [],
      raw: googleResponse
    };

    if (!googleResponse || !googleResponse.document) {
      return extraction;
    }

    const document = googleResponse.document;

    if (document.entities) {
      document.entities.forEach(entity => {
        const field = {
          name: entity.type || 'unknown',
          label: entity.type || 'Unknown Field',
          value: entity.mentionText || entity.normalizedValue?.text || '',
          rawValue: entity.mentionText || '',
          type: entity.normalizedValue ? 'normalized' : 'string',
          confidence: entity.confidence ? Math.round(entity.confidence * 100) : 0,
          page: entity.pageAnchor?.pageRefs?.[0]?.page || 1
        };

        if (entity.pageAnchor?.pageRefs?.[0]?.boundingPoly) {
          const boundingPoly = entity.pageAnchor.pageRefs[0].boundingPoly;
          const vertices = boundingPoly.normalizedVertices || boundingPoly.vertices || [];

          if (vertices.length >= 2) {
            field.coordinates = {
              x: vertices[0].x || 0,
              y: vertices[0].y || 0,
              w: Math.abs((vertices[2]?.x || 0) - (vertices[0]?.x || 0)),
              h: Math.abs((vertices[2]?.y || 0) - (vertices[0]?.y || 0))
            };
          }
        }

        extraction.headerFields.push(field);
      });
    }

    if (document.pages) {
      document.pages.forEach((page, pageIdx) => {
        if (page.tables) {
          page.tables.forEach((table, tableIdx) => {
            if (table.bodyRows) {
              table.bodyRows.forEach((row, rowIdx) => {
                const lineItem = [];

                if (row.cells) {
                  row.cells.forEach((cell, cellIdx) => {
                    const cellText = cell.layout?.textAnchor?.content || '';

                    lineItem.push({
                      name: `table_${tableIdx}_row_${rowIdx}_cell_${cellIdx}`,
                      label: `Cell ${cellIdx + 1}`,
                      value: cellText.trim(),
                      rawValue: cellText,
                      type: 'string',
                      confidence: cell.layout?.confidence ? Math.round(cell.layout.confidence * 100) : 0,
                      page: pageIdx + 1
                    });
                  });
                }

                if (lineItem.length > 0) {
                  extraction.lineItems.push(lineItem);
                }
              });
            }
          });
        }
      });
    }

    return extraction;
  } catch (error) {
    console.error('Error parsing Google Document AI response:', error);
    return {
      headerFields: [],
      lineItems: [],
      raw: googleResponse,
      parseError: error.message
    };
  }
}

module.exports = {
  uploadToGoogleDocAI,
  getGoogleDocAIResult,
  checkGoogleDocAIStatus,
  parseGoogleDocAIResponse,
  isGoogleDocAIEnabled: () => GOOGLE_DOC_AI_ENABLED
};
