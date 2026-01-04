# ABBYY Document AI - Quick Start Guide

## 5-Minute Setup

### Step 1: Get ABBYY API Key
1. Visit https://www.abbyy.com/cloud-ocr-api/
2. Create account or login
3. Get your API key from dashboard

### Step 2: Configure Environment
```bash
# In backend/.env
ABBYY_ENABLED=true
ABBYY_API_KEY=your_key_here
ABBYY_API_URL=https://api.abbyy.com/v2
```

### Step 3: Start Server
```bash
cd backend
npm install  # if not already done
npm start
```

### Step 4: Upload Document
```bash
curl -X POST http://localhost:8080/api/abbyy/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf"
```

Response:
```json
{
  "message": "File uploaded successfully to ABBYY",
  "taskId": "task-id-here",
  "credits": 2.0
}
```

### Step 5: Check Status
```bash
curl http://localhost:8080/api/abbyy/status/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Implemented Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/abbyy/upload` | Upload document for OCR |
| GET | `/api/abbyy/status/:taskId` | Check processing status |
| GET | `/api/abbyy/result/:taskId` | Get extracted data |
| GET | `/api/abbyy/documents/:id/status` | Get document status from DB |
| POST | `/api/abbyy/documents/:id/retry` | Retry failed document |

## Service Files

```
backend/
├── services/
│   ├── abbyyDocumentService.js      (API integration)
│   ├── abbyyPollingService.js       (Async polling)
│   └── documentProcessingService.js (Orchestration)
├── routes/
│   └── abbyyFiles.js                (Express endpoints)
├── ABBYY_INTEGRATION.md             (Full documentation)
├── ABBYY_EXAMPLES.md                (Code examples)
└── ABBYY_IMPLEMENTATION_SUMMARY.md  (Implementation details)
```

## Key Features

✅ Async document processing
✅ Automatic polling with DB updates
✅ Fallback to SAP when ABBYY disabled
✅ JWT authentication
✅ Error handling and retries
✅ JSON/XML/PDF export formats
✅ Structured data extraction

## Processing Statuses

- `Queued` - Waiting to process
- `InProgress` - Currently processing
- `Completed` - Done, results available
- `ProcessingFailed` - Failed (see error)
- `NotEnoughCredits` - Need credits

## Response Format

```json
{
  "extraction": {
    "headerFields": [
      {
        "name": "invoice_number",
        "label": "Invoice #",
        "value": "INV-001",
        "confidence": 95.5,
        "page": 1
      }
    ],
    "lineItems": [
      [
        {"label": "Item", "value": "Widget"},
        {"label": "Qty", "value": "5"}
      ]
    ]
  }
}
```

## Enable Without API Key (Use SAP)

```bash
ABBYY_ENABLED=false  # or omit API_KEY
# System will fallback to SAP automatically
```

## Disable ABBYY Temporarily

```bash
ABBYY_ENABLED=false
# All endpoints still work, use SAP instead
```

## Common Errors

| Error | Solution |
|-------|----------|
| "ABBYY service is not enabled" | Set `ABBYY_ENABLED=true` |
| "ABBYY API key is not configured" | Set `ABBYY_API_KEY` |
| "NotEnoughCredits" | Top up ABBYY account credits |
| "ProcessingFailed" | Check document quality/format |
| Timeout | Document taking longer, polling continues in background |

## Production Checklist

- [ ] ABBYY_ENABLED=true
- [ ] ABBYY_API_KEY set with real key
- [ ] ABBYY_API_URL configured
- [ ] JWT tokens validated
- [ ] MongoDB indexes created
- [ ] Logging configured
- [ ] Error monitoring setup
- [ ] Load testing done
- [ ] Backup plan for ABBYY downtime

## Monitoring

Watch server logs for:
```
ABBYY Task {id} status: InProgress
ABBYY Task {id} status: Completed
ABBYY polling error: {error}
```

## Useful Commands

```bash
# Check if ABBYY is enabled
curl http://localhost:8080/api/health

# Check available endpoints
curl -X OPTIONS http://localhost:8080/api/abbyy/upload

# Syntax check
node -c services/abbyyDocumentService.js
```

## File Upload Limits

- **Max file size**: 100MB (configurable)
- **Supported types**: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, XLS, XLSX
- **Timeout**: 30 seconds per upload

## Processing Timeout

- **Default polling**: 60 attempts × 2 seconds = 2 minutes
- **Adjustable in**: `abbyyPollingService.js`
- **Background**: Non-blocking, returns immediately

## Database Fields

Documents stored with:
```javascript
{
  processingService: 'abbyy',
  serviceTaskId: 'task-id',
  status: 'DONE|FAILED|uploading',
  extraction: {...},
  errorMessage: 'if failed'
}
```

## Testing Locally

```javascript
// Test file
const { uploadToABBYY } = require('./services/abbyyDocumentService');

// With mock
process.env.ABBYY_ENABLED = 'false'; // Falls back to SAP

// Or use SAP for testing
const result = await processDocument(buffer, 'test.pdf', 'application/pdf', sapToken, 'sap');
```

## Next Steps

1. Read full docs: `ABBYY_INTEGRATION.md`
2. Review examples: `ABBYY_EXAMPLES.md`
3. Check implementation: `ABBYY_IMPLEMENTATION_SUMMARY.md`
4. Test endpoints with provided cURL examples
5. Integrate frontend if needed
6. Deploy to production

## Support Files

| File | Purpose |
|------|---------|
| `ABBYY_INTEGRATION.md` | Complete API reference |
| `ABBYY_EXAMPLES.md` | 10 code examples |
| `ABBYY_IMPLEMENTATION_SUMMARY.md` | Architecture & details |
| `QUICK_START_ABBYY.md` | This file |

## Troubleshooting

See `ABBYY_INTEGRATION.md` section "Troubleshooting" for detailed solutions.

---

**Ready to use!** Set your API key and start uploading documents.
