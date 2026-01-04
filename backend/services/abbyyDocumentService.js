const axios = require('axios');
const FormData = require('form-data');

const ABBYY_API_KEY = process.env.ABBYY_API_KEY;
const ABBYY_API_URL = process.env.ABBYY_API_URL || 'https://api.abbyy.com/v2';
const ABBYY_ENABLED = process.env.ABBYY_ENABLED === 'true';

if (ABBYY_ENABLED && !ABBYY_API_KEY) {
  console.warn('ABBYY_ENABLED is true but ABBYY_API_KEY is not set');
}

/**
 * Uploads a document to ABBYY Cloud OCR API for processing
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalname - The original file name
 * @param {string} mimetype - The file MIME type
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - ABBYY response with task ID
 */
async function uploadToABBYY(fileBuffer, originalname, mimetype, options = {}) {
  try {
    if (!ABBYY_ENABLED) {
      throw new Error('ABBYY service is not enabled');
    }

    if (!ABBYY_API_KEY) {
      throw new Error('ABBYY API key is not configured');
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: originalname,
      contentType: mimetype
    });

    const processingOptions = {
      language: options.language || 'English',
      exportFormat: options.exportFormat || 'json',
      textType: options.textType || 'auto',
      imageSource: options.imageSource || 'auto',
      ...options
    };

    const queryString = new URLSearchParams(processingOptions).toString();
    const url = `${ABBYY_API_URL}/submitImage?${queryString}`;

    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Basic ${Buffer.from(`${ABBYY_API_KEY}:`).toString('base64')}`
      },
      timeout: 30000,
      maxBodyLength: Infinity
    });

    return {
      taskId: response.data.taskId,
      status: response.data.status,
      credits: response.data.credits,
      description: response.data.description
    };
  } catch (error) {
    console.error('ABBYY uploadToABBYY error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error(error.response?.data?.errorDescription || error.message || 'ABBYY file upload failed');
  }
}

/**
 * Gets the processing result from ABBYY for a submitted task
 * @param {string} taskId - The ABBYY task ID
 * @param {string} format - Export format (json, xml, pdf, etc.)
 * @returns {Promise<Object>} - Extraction results
 */
async function getABBYYResult(taskId, format = 'json') {
  try {
    if (!ABBYY_ENABLED) {
      throw new Error('ABBYY service is not enabled');
    }

    if (!ABBYY_API_KEY) {
      throw new Error('ABBYY API key is not configured');
    }

    const url = `${ABBYY_API_URL}/getResult?taskId=${taskId}&format=${format}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ABBYY_API_KEY}:`).toString('base64')}`
      },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error('ABBYY getABBYYResult error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error(error.response?.data?.errorDescription || error.message || 'Failed to fetch ABBYY result');
  }
}

/**
 * Checks the processing status of an ABBYY task
 * @param {string} taskId - The ABBYY task ID
 * @returns {Promise<Object>} - Task status information
 */
async function checkABBYYStatus(taskId) {
  try {
    if (!ABBYY_ENABLED) {
      throw new Error('ABBYY service is not enabled');
    }

    if (!ABBYY_API_KEY) {
      throw new Error('ABBYY API key is not configured');
    }

    const url = `${ABBYY_API_URL}/getTaskStatus?taskId=${taskId}`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ABBYY_API_KEY}:`).toString('base64')}`
      },
      timeout: 10000
    });

    const data = response.data;

    return {
      taskId: data.taskId,
      status: data.status,
      estimatedProcessingTime: data.estimatedProcessingTime,
      resultUrl: data.resultUrl,
      pagesProcessed: data.pagesProcessed,
      error: data.error,
      description: data.description
    };
  } catch (error) {
    console.error('ABBYY checkABBYYStatus error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error(error.response?.data?.errorDescription || error.message || 'Failed to check ABBYY status');
  }
}

/**
 * Parses ABBYY JSON response and extracts structured data
 * @param {Object} abbyyResponse - Raw ABBYY API response
 * @returns {Object} - Structured extraction data
 */
function parseABBYYResponse(abbyyResponse) {
  try {
    const extraction = {
      headerFields: [],
      lineItems: [],
      raw: abbyyResponse
    };

    if (abbyyResponse.document) {
      const doc = abbyyResponse.document;

      if (doc.occrmdDocument) {
        const occrmd = doc.occrmdDocument;

        // Extract header-level fields
        if (occrmd.field) {
          const fields = Array.isArray(occrmd.field) ? occrmd.field : [occrmd.field];
          fields.forEach(field => {
            if (field && field.name && field.value) {
              extraction.headerFields.push({
                name: field.name,
                label: field.name,
                value: field.value.text || field.value,
                rawValue: field.value.text || field.value,
                type: 'string',
                confidence: field.confidence ? field.confidence * 100 : 100,
                page: field.pageIndex || 1,
                coordinates: {
                  x: field.boundingBox?.left || 0,
                  y: field.boundingBox?.top || 0,
                  w: field.boundingBox?.right - field.boundingBox?.left || 0,
                  h: field.boundingBox?.bottom - field.boundingBox?.top || 0
                }
              });
            }
          });
        }

        // Extract table/line item data
        if (occrmd.table) {
          const tables = Array.isArray(occrmd.table) ? occrmd.table : [occrmd.table];
          tables.forEach((table, tableIdx) => {
            if (table.row) {
              const rows = Array.isArray(table.row) ? table.row : [table.row];
              rows.forEach((row, rowIdx) => {
                const lineItem = [];
                if (row.cell) {
                  const cells = Array.isArray(row.cell) ? row.cell : [row.cell];
                  cells.forEach((cell, cellIdx) => {
                    const cellText = cell.text || '';
                    lineItem.push({
                      name: `cell_${tableIdx}_${rowIdx}_${cellIdx}`,
                      label: cellText.substring(0, 50),
                      value: cellText,
                      rawValue: cellText,
                      type: 'string',
                      confidence: cell.confidence ? cell.confidence * 100 : 100,
                      page: cell.pageIndex || 1,
                      coordinates: {
                        x: cell.boundingBox?.left || 0,
                        y: cell.boundingBox?.top || 0,
                        w: cell.boundingBox?.right - cell.boundingBox?.left || 0,
                        h: cell.boundingBox?.bottom - cell.boundingBox?.top || 0
                      }
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
      }
    }

    return extraction;
  } catch (error) {
    console.error('Error parsing ABBYY response:', error);
    return {
      headerFields: [],
      lineItems: [],
      raw: abbyyResponse,
      parseError: error.message
    };
  }
}

module.exports = {
  uploadToABBYY,
  getABBYYResult,
  checkABBYYStatus,
  parseABBYYResponse,
  isABBYYEnabled: () => ABBYY_ENABLED
};
