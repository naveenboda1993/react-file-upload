# ABBYY Integration Examples

Quick examples for using the ABBYY Document AI service in your backend.

## Example 1: Direct Service Usage

```javascript
const {
  uploadToABBYY,
  checkABBYYStatus,
  getABBYYResult,
  parseABBYYResponse
} = require('./abbyyDocumentService');

async function processDocumentManually() {
  try {
    // Step 1: Upload document
    const response = await uploadToABBYY(
      fileBuffer,
      'invoice.pdf',
      'application/pdf',
      {
        language: 'English',
        exportFormat: 'json'
      }
    );

    console.log('Task ID:', response.taskId);

    // Step 2: Check status (periodically)
    const status = await checkABBYYStatus(response.taskId);
    console.log('Status:', status.status);

    // Step 3: Get results when complete
    const result = await getABBYYResult(response.taskId);

    // Step 4: Parse results
    const extraction = parseABBYYResponse(result);
    console.log('Extracted data:', extraction);

  } catch (error) {
    console.error('Processing failed:', error.message);
  }
}
```

## Example 2: Using Document Processing Service

```javascript
const { processDocument } = require('./documentProcessingService');
const { fetchSAPAccessToken } = require('./sapAuthService');

async function uploadWithAutoService(userId, fileBuffer, filename, mimetype) {
  try {
    const sapToken = await fetchSAPAccessToken(userId);

    // Auto-selects ABBYY if enabled, falls back to SAP
    const result = await processDocument(
      fileBuffer,
      filename,
      mimetype,
      sapToken,
      'auto'  // or 'abbyy' or 'sap'
    );

    console.log('Processing with:', result.service);
    console.log('Task ID:', result.taskId);

    return result;
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
}
```

## Example 3: Background Polling

```javascript
const { startBackgroundPolling } = require('./abbyyPollingService');

async function uploadAndStartPolling(fileBuffer, filename, mimetype, documentId) {
  try {
    const response = await uploadToABBYY(fileBuffer, filename, mimetype);

    // Start background polling - will update DB when complete
    startBackgroundPolling(response.taskId, documentId);

    return {
      taskId: response.taskId,
      message: 'Processing started in background'
    };
  } catch (error) {
    console.error('Failed to start processing:', error.message);
  }
}
```

## Example 4: Express Endpoint Handler

```javascript
const express = require('express');
const { uploadToABBYY } = require('./abbyyDocumentService');
const { startBackgroundPolling } = require('./abbyyPollingService');

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    // Upload to ABBYY
    const abbyyResponse = await uploadToABBYY(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Save document metadata
    const document = new Document({
      name: req.file.originalname,
      uploadedBy: req.user._id,
      status: 'uploading',
      processingService: 'abbyy',
      serviceTaskId: abbyyResponse.taskId
    });
    await document.save();

    // Start background processing
    startBackgroundPolling(abbyyResponse.taskId, document._id);

    res.json({
      message: 'Document uploaded successfully',
      documentId: document._id,
      taskId: abbyyResponse.taskId
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

## Example 5: Polling Status Manually

```javascript
const { checkABBYYStatus } = require('./abbyyDocumentService');

async function pollWithCustomLogic(taskId, maxAttempts = 30) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const status = await checkABBYYStatus(taskId);

      console.log(`Attempt ${attempts + 1}: ${status.status}`);

      if (status.status === 'Completed') {
        console.log('Processing complete!');
        return { success: true, taskId };
      }

      if (status.status === 'ProcessingFailed') {
        console.log('Processing failed:', status.error);
        return { success: false, error: status.error };
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

    } catch (error) {
      console.error('Polling error:', error.message);
      attempts++;
    }
  }

  return { success: false, error: 'Max attempts exceeded' };
}
```

## Example 6: Processing with Error Handling

```javascript
async function processWithRetry(fileBuffer, filename, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${maxRetries}`);

      const response = await uploadToABBYY(fileBuffer, filename, 'application/pdf');
      return response;

    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error.message);

      if (i < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, i) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Example 7: Handling Different Document Types

```javascript
const { uploadToABBYY } = require('./abbyyDocumentService');

async function uploadWithDocumentType(fileBuffer, filename, mimetype, documentType) {
  const options = {
    language: 'English',
    exportFormat: 'json'
  };

  // Customize options based on document type
  switch (documentType) {
    case 'invoice':
      options.recognitionLanguage = 'English';
      break;
    case 'receipt':
      options.textType = 'handprint';
      break;
    case 'form':
      options.textType = 'auto';
      break;
    default:
      options.textType = 'auto';
  }

  return await uploadToABBYY(fileBuffer, filename, mimetype, options);
}
```

## Example 8: Parsing and Filtering Results

```javascript
const { parseABBYYResponse } = require('./abbyyDocumentService');

function extractHighConfidenceFields(abbyyResponse, minConfidence = 90) {
  const extraction = parseABBYYResponse(abbyyResponse);

  const filtered = {
    headerFields: extraction.headerFields.filter(f => f.confidence >= minConfidence),
    lineItems: extraction.lineItems.map(items =>
      items.filter(item => item.confidence >= minConfidence)
    )
  };

  return filtered;
}

// Usage
const extraction = extractHighConfidenceFields(abbyyResponse, 85);
console.log('High confidence fields:', extraction.headerFields);
```

## Example 9: Client-Side Integration (Frontend)

```javascript
// Frontend service to interact with ABBYY endpoints

async function uploadDocumentToABBYY(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/abbyy/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  return response.json();
}

async function getDocumentStatus(documentId) {
  const response = await fetch(`/api/abbyy/documents/${documentId}/status`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  return response.json();
}

async function pollDocumentStatus(documentId, interval = 2000, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const data = await getDocumentStatus(documentId);

    if (data.status === 'DONE') {
      return { success: true, extraction: data.extraction };
    }

    if (data.status === 'FAILED') {
      return { success: false, error: data.errorMessage };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return { success: false, error: 'Timeout waiting for processing' };
}
```

## Example 10: Docker Configuration

```dockerfile
# In Dockerfile, ensure these are set as build args or environment variables
FROM node:18-alpine

ENV ABBYY_ENABLED=false
ENV ABBYY_API_KEY=""
ENV ABBYY_API_URL="https://api.abbyy.com/v2"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
```

Set actual values at runtime:
```bash
docker run \
  -e ABBYY_ENABLED=true \
  -e ABBYY_API_KEY=your_api_key \
  your-app-image
```

## Common Patterns

### Pattern 1: Fire and Forget with Background Polling
```javascript
// Upload document and let it process in background
const result = await uploadToABBYY(buffer, name, type);
startBackgroundPolling(result.taskId, documentId);
// Return immediately - client can poll for status
```

### Pattern 2: Synchronous Wait (not recommended for large files)
```javascript
// Wait for completion before returning
const result = await uploadToABBYY(buffer, name, type);
const finalResult = await pollABBYYTask(result.taskId, documentId);
return finalResult.extraction;
```

### Pattern 3: Webhook-like Pattern (future enhancement)
```javascript
// Process and notify when complete
const result = await uploadToABBYY(buffer, name, type);
startBackgroundPolling(result.taskId, documentId);
// When complete, trigger notification/webhook
```

## Testing Without ABBYY API Key

```javascript
// In development without ABBYY:
// Set ABBYY_ENABLED=false or ABBYY_API_KEY=""
// The service will use SAP by default

const { processDocument } = require('./documentProcessingService');

const result = await processDocument(
  buffer,
  filename,
  mimetype,
  sapToken,
  'auto'  // Will use SAP when ABBYY is disabled
);
```
