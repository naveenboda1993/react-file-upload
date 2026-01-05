# Google Document AI Integration Guide

This document describes the Google Document AI integration for the document processing backend.

## Overview

Google Document AI provides advanced document processing and data extraction capabilities. This integration allows documents to be processed with automatic field extraction, table recognition, and entity detection.

## Setup Instructions

### 1. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Document AI API for your project
4. Create a Document AI processor:
   - Navigate to Document AI in the console
   - Click "Create Processor"
   - Choose a processor type (e.g., Invoice Parser, Form Parser, OCR)
   - Note the Processor ID and Location

### 2. Create API Credentials

1. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Optionally restrict the API key to Document AI API only

### 3. Configure Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_DOC_AI_ENABLED=true
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us
GOOGLE_PROCESSOR_ID=your-processor-id
GOOGLE_API_KEY=your-api-key
```

## API Endpoints

### Upload Document for Processing

**Endpoint:** `POST /api/google-doc-ai/upload`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <binary_file_data>
```

**Response:**
```json
{
  "message": "File uploaded successfully to Google Document AI",
  "document": {
    "_id": "document_id",
    "name": "document.pdf",
    "status": "DONE",
    "processingService": "google",
    "serviceTaskId": "task_id",
    "operationName": "operation_name",
    "extraction": {...}
  },
  "operationName": "operation_name",
  "processingAsync": false
}
```

### Check Processing Status

**Endpoint:** `GET /api/google-doc-ai/status/:operationName`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "operationName": "operation_name",
  "status": "DONE",
  "done": true,
  "error": null
}
```

### Get Processing Result

**Endpoint:** `GET /api/google-doc-ai/result/:operationName`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "operationName": "operation_name",
  "extraction": {
    "headerFields": [...],
    "lineItems": [...],
    "raw": {...}
  }
}
```

### Get Document Status from Database

**Endpoint:** `GET /api/google-doc-ai/documents/:documentId/status`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "documentId": "document_id",
  "status": "DONE",
  "processingService": "google",
  "serviceTaskId": "task_id",
  "operationName": "operation_name",
  "extraction": {...},
  "errorMessage": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

### Retry Failed Document Processing

**Endpoint:** `POST /api/google-doc-ai/documents/:documentId/retry`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "message": "Document processing completed",
  "document": {...}
}
```

## Service Architecture

### Core Components

#### 1. **googleDocumentAIService.js**
Handles direct Google Document AI API communication:
- `uploadToGoogleDocAI()` - Submits documents to Google Document AI
- `checkGoogleDocAIStatus()` - Checks operation processing status
- `getGoogleDocAIResult()` - Retrieves processing results
- `parseGoogleDocAIResponse()` - Converts Google response to structured format

#### 2. **googleDocAIPollingService.js**
Manages asynchronous operation monitoring:
- `pollGoogleDocAITask()` - Polls Google Document AI until completion
- `startBackgroundPolling()` - Initiates background polling

#### 3. **documentProcessingService.js**
Integration service that manages SAP, ABBYY, and Google Document AI:
- `processDocument()` - Routes to appropriate service (SAP, ABBYY, or Google)
- `initializeAsyncProcessing()` - Manages async workflows

#### 4. **googleDocAIFiles.js**
Express routes for Google Document AI endpoints

### Processing Flow

```
User Upload → Google API Validation → API Submit → Response/Background Polling → DB Update → Extraction Stored
```

## Frontend Integration

### Service Selector Component

The `ProcessingServiceSelector` component allows users to choose between different document processing services:

```typescript
import { ProcessingServiceSelector } from '../components/files/ProcessingServiceSelector';

<ProcessingServiceSelector
  selectedService={selectedService}
  onServiceChange={setSelectedService}
/>
```

### File Upload with Service Selection

```typescript
import { FileUpload } from '../components/files/FileUpload';

<FileUpload
  onUploadComplete={fetchFiles}
  processingService={selectedService}
/>
```

## Response Data Format

### Extraction Structure

```javascript
{
  headerFields: [
    {
      name: "field_name",
      label: "Field Label",
      value: "extracted_value",
      rawValue: "raw_text",
      type: "string|number|date",
      confidence: 95,
      page: 1,
      coordinates: {
        x: 100,
        y: 200,
        w: 150,
        h: 30
      }
    }
  ],
  lineItems: [
    [
      {
        name: "cell_field",
        label: "Cell 1",
        value: "Product Name",
        confidence: 92,
        page: 1
      }
    ]
  ],
  raw: {...}
}
```

## Error Handling

### Common Status Values

- `PROCESSING` - Currently being processed
- `DONE` - Successfully processed
- `FAILED` - Processing failed

### Error Response

```json
{
  "message": "Google Document AI processing failed: error details",
  "error": "Detailed error message"
}
```

## Integration with Existing System

### Using Multiple Services

Set `processingService` when uploading:

```javascript
const result = await fileService.uploadFile(
  file,
  'google'  // or 'sap' or 'abbyy' or 'auto'
);
```

### Auto-selection

When `processingService` is `'auto'`:
- Uses Google Document AI if enabled
- Falls back to ABBYY if Google is disabled
- Falls back to SAP if both Google and ABBYY are disabled

### Document Schema Updates

The Document model includes new fields:

```javascript
processingService: String,      // 'sap', 'abbyy', or 'google'
serviceTaskId: String,          // Google document ID
operationName: String,          // Google operation name
errorMessage: String,           // Error details if failed
extraction: Mixed,              // Extracted data
```

## Testing

### Manual Test with cURL

```bash
# Upload document
curl -X POST http://localhost:8080/api/google-doc-ai/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf"

# Check status
curl -X GET http://localhost:8080/api/google-doc-ai/status/OPERATION_NAME \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get results
curl -X GET http://localhost:8080/api/google-doc-ai/result/OPERATION_NAME \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Best Practices

1. **Enable only when configured**: Only set `GOOGLE_DOC_AI_ENABLED=true` when you have valid credentials
2. **Monitor usage**: Keep track of Google Cloud API usage and quotas
3. **Document quality**: Ensure document images are clear for better results
4. **Error handling**: Implement retry logic on the client side for failed documents
5. **Logging**: Enable detailed logging in development for debugging

## Security

- API keys are kept in `.env` and never logged
- Authentication required for all Google Document AI endpoints
- User can only access their own documents
- Bearer token authentication for Google API calls

## Performance Considerations

- Synchronous processing for simple documents
- Background polling for long-running operations
- Uses Node.js event loop for async operations
- Database saves only occur on completion
- Memory-efficient streaming for file handling

## Troubleshooting

### Issue: "Google Document AI service is not enabled"
**Solution:** Set `GOOGLE_DOC_AI_ENABLED=true` in `.env`

### Issue: "Google Document AI credentials are not configured"
**Solution:** Ensure all required environment variables are set:
- `GOOGLE_PROJECT_ID`
- `GOOGLE_PROCESSOR_ID`
- `GOOGLE_API_KEY`

### Issue: Document stuck in "uploading" status
**Solution:** Check logs for polling errors. Verify processor ID and API key are correct.

### Issue: Extraction results are incomplete
**Solution:** Verify the document format is supported by your processor type. Consider using a different processor type for your document category.

## Supported Document Types

Google Document AI supports various document types depending on the processor:
- Invoices
- Receipts
- Forms
- Identity documents
- Contracts
- Bank statements
- And many more

Choose the appropriate processor type when setting up your Google Cloud project.

## Pricing

Google Document AI pricing is based on:
- Number of pages processed
- Processor type used
- Additional features enabled

Refer to [Google Cloud Pricing](https://cloud.google.com/document-ai/pricing) for current rates.

## Additional Resources

- [Google Document AI Documentation](https://cloud.google.com/document-ai/docs)
- [Processor Types](https://cloud.google.com/document-ai/docs/processors-list)
- [API Reference](https://cloud.google.com/document-ai/docs/reference/rest)
- [Quotas and Limits](https://cloud.google.com/document-ai/quotas)
