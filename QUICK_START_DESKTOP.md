# Quick Start: Desktop App

## Setup in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run electron:dev
```

The app will:
- Start the Vite dev server
- Launch the Electron desktop app
- Open with DevTools

### 3. Start Using

**File Browser** (Left Panel)
- Click folders to navigate
- Select files with checkboxes
- Click "Add Files" to queue

**Upload Queue** (Right Panel)
- Shows all files to upload
- Click "Start Upload" to begin
- Monitor progress in real-time

## Processing Services

Choose which service processes your documents:

| Service | Use Case | Speed | Accuracy |
|---------|----------|-------|----------|
| Auto Select | Default choice | Fast | Good |
| Google Document AI | Forms, structured docs | Medium | Excellent |
| ABBYY Cloud OCR | Scanned images, OCR | Medium | Very Good |
| SAP Extraction | Enterprise documents | Fast | Good |

## Common Tasks

### Upload Files from a Folder

1. Navigate to the folder in left panel
2. Click "Select All" or check individual files
3. Click "Add Files"
4. Choose processing service (top)
5. Click "Start Upload"

### Upload Multiple Times

The app queues files, so you can:
1. Add files from folder A
2. Add files from folder B
3. Choose service
4. Click "Start Upload" once

All will upload in sequence.

### Check Upload Status

Watch the progress bar and status indicators:
- ⏳ Pending
- ⬆️ Uploading with %
- ✅ Success
- ❌ Failed (with error message)

### Retry Failed Uploads

1. Click X to remove failed file
2. Navigate back to original folder
3. Reselect the file
4. Start upload again

## Configuration

### Change API URL

Edit localStorage in DevTools:

```javascript
localStorage.setItem('apiUrl', 'http://your-api.com/api');
```

Or set environment variable:

```bash
export DOCUMENT_PROCESSOR_API_URL=http://your-api.com/api
npm run electron:dev
```

### Login with API Key

If backend requires authentication:

```javascript
localStorage.setItem('authToken', 'your-jwt-token');
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+I | Open DevTools |
| Ctrl+R | Reload app |
| Ctrl+Q | Quit app |

## File Size Limits

Default: **100MB per file**

To upload larger files, contact your backend admin.

## Supported File Types

- **Documents**: PDF, DOC, DOCX, TXT
- **Spreadsheets**: XLS, XLSX
- **Images**: JPG, JPEG, PNG, GIF

## Troubleshooting

### App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run electron:dev
```

### Upload Fails
1. Check API URL is correct
2. Verify backend is running
3. Check internet connection
4. Try with smaller batch

### Files Not Showing
- Check folder permissions
- Try different folder
- Restart app

## Next Steps

1. **Configure Backend**: Set correct API URL
2. **Set Processing Service**: Choose based on document type
3. **Test Upload**: Upload a single file first
4. **Batch Upload**: Upload multiple files

## Get Help

Check logs in DevTools Console:
- `Ctrl+Shift+I` (Windows/Linux)
- `Cmd+Option+I` (macOS)

Look for error messages and share them if contacting support.

## Build for Distribution

When ready to release:

```bash
# Build installers for your OS
npm run electron:build

# Installers are in dist/ folder
```

## More Information

- Full guide: See `DESKTOP_APP_GUIDE.md`
- Backend setup: See `backend/README.md`
- Web app: See web UI documentation
