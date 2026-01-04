# ABBYY Document AI Integration Guide

This document describes the ABBYY Cloud OCR/Document Processing API integration for the document processing backend.

## Overview

ABBYY Cloud OCR API provides advanced optical character recognition (OCR) and document processing capabilities. This integration allows documents to be processed asynchronously with automatic polling for completion.

## Setup Instructions

### 1. Get ABBYY API Credentials

1. Go to [ABBYY Cloud OCR API](https://www.abbyy.com/cloud-ocr-api/)
2. Sign up for an account or log in
3. Navigate to your account settings/API keys
4. Generate an API key

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
ABBYY_ENABLED=true
ABBYY_API_KEY=your_api_key_here
ABBYY_API_URL=https://api.abbyy.com/v2
```

### 3. Install Dependencies

Required dependencies are already included:
- `axios` - HTTP client
- `form-data` - Multipart form data handling

## API Endpoints

### Upload Document for OCR

**Endpoint:** `POST /api/abbyy/upload`

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
  "message": "File uploaded successfully to ABBYY",
  "document": {
    "_id": "document_id",
    "name": "document.pdf",
    "status": "uploading",
    "processingService": "abbyy",
    "serviceTaskId": "task_id"
  },
  "taskId": "task_id",
  "credits": 2.0
}
```

### Check Processing Status

**Endpoint:** `GET /api/abbyy/status/:taskId`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "taskId": "task_id",
  "status": "InProgress|Completed|ProcessingFailed|NotEnoughCredits",
  "estimatedProcessingTime": 10,
  "pagesProcessed": 0,
  "error": null
}
```

### Get Processing Result

**Endpoint:** `GET /api/abbyy/result/:taskId?format=json`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `format` (optional): `json`, `xml`, `pdf` (default: `json`)

**Response:**
```json
{
  "taskId": "task_id",
  "format": "json",
  "extraction": {
    "headerFields": [
      {
        "name": "invoice_number",
        "label": "Invoice Number",
        "value": "INV-2024-001",
        "confidence": 95.5,
        "page": 1
      }
    ],
    "lineItems": [
      [
        {
          "label": "Item",
          "value": "Product A",
          "confidence": 92.3
        }
      ]
    ]
  }
}
```

### Get Document Processing Status from Database

**Endpoint:** `GET /api/abbyy/documents/:documentId/status`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "documentId": "document_id",
  "status": "uploading|DONE|FAILED",
  "processingService": "abbyy",
  "serviceTaskId": "task_id",
  "extraction": {...},
  "errorMessage": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

### Retry Failed Document Processing

**Endpoint:** `POST /api/abbyy/documents/:documentId/retry`

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

#### 1. **abbyyDocumentService.js**
Handles direct ABBYY API communication:
- `uploadToABBYY()` - Submits documents to ABBYY
- `checkABBYYStatus()` - Checks task processing status
- `getABBYYResult()` - Retrieves processing results
- `parseABBYYResponse()` - Converts ABBYY response to structured format

#### 2. **abbyyPollingService.js**
Manages asynchronous task monitoring:
- `pollABBYYTask()` - Polls ABBYY until completion
- `startBackgroundPolling()` - Initiates background polling

#### 3. **documentProcessingService.js**
Integration service that manages both SAP and ABBYY:
- `processDocument()` - Routes to appropriate service (SAP or ABBYY)
- `initializeAsyncProcessing()` - Manages async workflows

#### 4. **abbyyFiles.js**
Express routes for ABBYY endpoints

### Processing Flow

```
User Upload → ABBYY Validation → API Submit → Background Polling → DB Update → Extraction Stored
```

## Async Processing

ABBYY processing is asynchronous. The system handles this automatically:

1. Document is uploaded to ABBYY
2. Task ID is returned immediately
3. Background polling starts in the Node.js event loop
4. When complete, results are fetched and stored in MongoDB
5. Document status is updated to `DONE` or `FAILED`

Maximum polling attempts: 60 (with 2-second intervals = ~2 minutes timeout)

## Response Data Format

### Extraction Structure

```javascript
{
  headerFields: [
    {
      name: "field_name",           // Field identifier
      label: "Field Label",          // Human-readable label
      value: "extracted_value",      // Extracted text/value
      rawValue: "raw_text",          // Raw OCR output
      type: "string|number|date",    // Data type
      confidence: 95.5,              // Confidence percentage
      page: 1,                       // Page number
      coordinates: {
        x: 100,                      // X position
        y: 200,                      // Y position
        w: 150,                      // Width
        h: 30                        // Height
      }
    }
  ],
  lineItems: [
    [
      {
        name: "item_field",
        label: "Item Description",
        value: "Product Name",
        confidence: 92.0,
        page: 1
      }
    ]
  ],
  raw: {...}                        // Original ABBYY response
}
```

## Error Handling

### Common Status Values

- `Queued` - Task queued for processing
- `InProgress` - Currently being processed
- `Completed` - Successfully processed
- `ProcessingFailed` - OCR processing failed
- `NotEnoughCredits` - Insufficient account credits
- `UnknownError` - Unknown error occurred

### Error Response

```json
{
  "message": "ABBYY processing failed: ProcessingFailed",
  "error": "Detailed error message from ABBYY"
}
```

## Integration with Existing System

### Using Both SAP and ABBYY

Set `preferredService` when processing:

```javascript
const result = await processDocument(
  fileBuffer,
  filename,
  mimetype,
  sapToken,
  'abbyy'  // or 'sap' or 'auto'
);
```

### Auto-selection

When `preferredService` is `'auto'`:
- Uses ABBYY if enabled
- Falls back to SAP if ABBYY is disabled

### Document Schema Updates

The Document model includes new fields:

```javascript
processingService: String,      // 'sap' or 'abbyy'
serviceTaskId: String,          // ABBYY task ID or SAP job ID
errorMessage: String,           // Error details if failed
```

## Testing

### Manual Test with cURL

```bash
# Upload document
curl -X POST http://localhost:8080/api/abbyy/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf"

# Check status
curl -X GET http://localhost:8080/api/abbyy/status/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get results
curl -X GET http://localhost:8080/api/abbyy/result/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Environment Variable Check

```bash
# Verify ABBYY is enabled
curl http://localhost:8080/api/health
```

## Configuration Options

### ABBYY Processing Options

When uploading, pass options to customize processing:

```javascript
{
  language: 'English',
  exportFormat: 'json',
  textType: 'auto',
  imageSource: 'auto',
  recognitionLanguage: 'English'
}
```

### Polling Configuration

In `abbyyPollingService.js`:

```javascript
const MAX_POLL_ATTEMPTS = 60;      // Maximum polling attempts
const POLL_INTERVAL_MS = 2000;     // 2 seconds between polls
```

Adjust these values based on your requirements and document complexity.

## Troubleshooting

### Issue: "ABBYY service is not enabled"
**Solution:** Set `ABBYY_ENABLED=true` in `.env`

### Issue: "ABBYY API key is not configured"
**Solution:** Set `ABBYY_API_KEY` with a valid key in `.env`

### Issue: Document stuck in "uploading" status
**Solution:** Check logs for polling errors. May need to increase `MAX_POLL_ATTEMPTS` or `POLL_INTERVAL_MS`

### Issue: NotEnoughCredits error
**Solution:** Check ABBYY account credits. Process failed due to insufficient credits.

### Issue: Extraction results are incomplete
**Solution:** ABBYY's response parsing may need adjustment. Verify the document format is supported and image quality is good.

## Best Practices

1. **Enable only when configured**: Only set `ABBYY_ENABLED=true` when you have valid credentials
2. **Monitor credits**: Keep track of ABBYY account credits
3. **Document quality**: Ensure document images are clear for better OCR results
4. **Error handling**: Implement retry logic on the client side for failed documents
5. **Timeout handling**: Configure appropriate timeouts for your use case
6. **Logging**: Enable detailed logging in development for debugging

## Rate Limiting

API routes inherit the global rate limiter:
- 100 requests per 15 minutes per IP
- Consider adjusting for high-volume processing scenarios

## Security

- API keys are kept in `.env` and never logged
- Authentication required for all ABBYY endpoints
- User can only access their own documents
- Basic Auth headers properly constructed for ABBYY API calls

## Performance Considerations

- Background polling doesn't block other requests
- Uses Node.js event loop for async operations
- Database saves only occur on completion
- Memory-efficient streaming for file handling

## Future Enhancements

1. Webhook support for ABBYY completion notifications
2. Batch processing support
3. Custom template configuration
4. Advanced confidence filtering
5. Multi-language support enhancement
6. Caching of processing results
7. Document classification
8. Field validation and correction workflows
