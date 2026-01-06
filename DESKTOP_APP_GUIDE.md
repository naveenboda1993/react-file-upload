# Document Processor Desktop App Guide

This guide provides instructions for building and running the Electron-based desktop application for batch file uploads to the Document Processor backend.

## Overview

The Document Processor Desktop App is a cross-platform Electron application that allows users to:

- Browse system folders and select files
- Batch upload multiple files to the backend
- Choose between different document processing services (Google Document AI, ABBYY, SAP)
- Monitor real-time upload progress
- Track upload statistics

## System Requirements

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **OS**: Windows, macOS, or Linux
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: 500MB for application and dependencies

## Project Structure

```
project/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # IPC bridge and security layer
├── desktop/
│   ├── index.tsx        # Desktop app entry point
│   ├── App.tsx          # Main app component
│   ├── pages/
│   │   └── HomePage.tsx # Main page with file browser and upload manager
│   ├── components/
│   │   ├── FolderBrowser.tsx    # File system browser
│   │   └── UploadManager.tsx    # Upload queue manager
│   ├── services/
│   │   └── desktopFileService.ts # API service layer
│   └── types/
│       └── index.ts     # TypeScript type definitions
├── src/                 # Web application (React)
├── index.html           # Shared HTML entry point
├── package.json         # Project dependencies and scripts
└── electron-builder.json # Build configuration
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including Electron and related tools.

### 2. Development Setup

To run the desktop app in development mode:

```bash
npm run electron:dev
```

This command:
- Starts the Vite development server on `http://localhost:5173`
- Waits for the server to be ready
- Launches the Electron application
- Opens DevTools for debugging

### 3. Building for Production

To build the Electron application:

```bash
npm run electron:build
```

This will:
- Build the web assets with Vite
- Package the Electron application
- Generate installers for your OS:
  - **Windows**: NSIS installer and portable EXE
  - **macOS**: DMG and ZIP packages
  - **Linux**: AppImage and DEB packages

Built files will be in the `dist` folder.

## Features

### File Browser

The file browser allows you to:

- **Navigate** through your file system
- **View** file details (name, size, modification date)
- **Select** multiple files at once
- **Search** for files (coming soon)
- **Sort** files by name, size, or date
- **Quick actions** like "Select All" and "Deselect All"

#### Navigation

- Click on folders to open them
- Use breadcrumb navigation at the top to jump to parent folders
- Click "Home" to go to your user home directory

### Upload Manager

The upload manager displays:

- **Upload Queue**: All files waiting to be uploaded
- **Progress Tracking**: Real-time upload progress per file
- **Status Indicators**:
  - ⏳ Pending: File waiting to upload
  - ⬆️ Uploading: File currently uploading
  - ✅ Success: File uploaded successfully
  - ❌ Error: Upload failed

#### Upload Statistics

- **Total**: Total number of files in queue
- **Successful**: Successfully uploaded files
- **Failed**: Files that failed to upload
- **Pending**: Files waiting to upload

### Processing Service Selection

Choose how documents are processed:

1. **Auto Select** (Default)
   - Automatically selects the best available service
   - Priority: Google Document AI > ABBYY > SAP

2. **Google Document AI**
   - Advanced document understanding
   - Extracts fields, tables, and entities
   - Requires Google Cloud configuration

3. **ABBYY Cloud OCR**
   - OCR and document recognition
   - Multilingual support
   - Requires ABBYY API credentials

4. **SAP Document Extraction**
   - Enterprise document processing
   - Financial document support
   - Requires SAP credentials

## Usage Workflow

### Basic Upload Process

1. **Start the Application**
   ```bash
   npm run electron:dev
   ```

2. **Configure API Connection**
   - Open Settings (gear icon)
   - Enter your backend API URL (default: `http://localhost:8080/api`)
   - Click "Save"

3. **Select Processing Service**
   - Choose your preferred service from the selector
   - Default is "Auto Select"

4. **Browse and Select Files**
   - Use the left panel to navigate folders
   - Select files you want to upload
   - Click "Add [N] Files" to add to upload queue

5. **Start Upload**
   - Review files in the right panel
   - Click "Start Upload" button
   - Monitor progress in real-time

6. **Review Results**
   - Check upload statistics
   - Failed uploads can be retried
   - View error messages for debugging

### Advanced Usage

#### Batch Processing

Upload multiple folders at once:

```bash
# Command (planned feature)
electron-app upload-folder ~/Documents/invoices
```

#### Settings Configuration

Edit `~/.DocumentProcessor/config.json`:

```json
{
  "apiUrl": "http://localhost:8080/api",
  "processingService": "google",
  "autoRetry": true,
  "maxRetries": 3,
  "uploadTimeout": 30000
}
```

#### Environment Variables

```bash
# Set custom API URL
export DOCUMENT_PROCESSOR_API_URL=http://api.example.com/api

# Run app with custom API
npm run electron:dev
```

## API Configuration

### Setting API URL

The desktop app needs to know where your backend is running:

1. Click the Settings icon (⚙️) in the top-right corner
2. Enter your API URL (e.g., `http://localhost:8080/api` for local development)
3. Click "Save"

### Authentication

The app stores authentication tokens locally:

- Token is stored in browser's localStorage
- Token is sent with every API request
- Token expires based on backend configuration

To login:

1. Click "Login" in the top-right corner
2. Enter your credentials
3. Token is automatically stored

## Building and Distribution

### Build Configuration

The build is configured in `package.json` under the `build` section:

```json
{
  "appId": "com.documentprocessor.desktop",
  "productName": "Document Processor Desktop",
  "win": { "target": ["nsis", "portable"] },
  "mac": { "target": ["dmg", "zip"] },
  "linux": { "target": ["AppImage", "deb"] }
}
```

### Building Installers

```bash
# Build for current OS
npm run electron:build

# Build for Windows only
electron-builder --win

# Build for macOS only
electron-builder --mac

# Build for Linux only
electron-builder --linux

# Build for all platforms
electron-builder --win --mac --linux
```

### Distribution

After building, installers are in the `dist` folder:

- **Windows**: `Document Processor Desktop Setup X.X.X.exe`
- **macOS**: `Document Processor Desktop-X.X.X.dmg`
- **Linux**: `Document Processor Desktop-X.X.X.AppImage`

## Troubleshooting

### Issue: "Cannot find module 'electron'"

**Solution**: Reinstall Electron
```bash
npm install electron --save-dev
npm rebuild
```

### Issue: App won't start in development

**Solution**: Check if port 5173 is in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173   # Windows
```

### Issue: Upload fails with 401 error

**Solution**: Check authentication
- Ensure API URL is correct
- Verify authentication token is valid
- Login again if needed

### Issue: Files not found in browser

**Solution**: Verify file permissions
- Ensure you have read permissions for the folder
- On macOS, grant folder access in System Preferences
- On Windows, run as Administrator if needed

### Issue: Slow uploads

**Solution**: Check network and file size
- Test internet connection speed
- For large files, use multiple smaller batches
- Check backend logs for processing delays

## Development Tips

### Debugging

The Electron DevTools are available in development mode:

1. **Toggle DevTools**: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
2. **Console Tab**: View logs and errors
3. **Network Tab**: Monitor API requests
4. **Application Tab**: View localStorage and app state

### Hot Reload

Changes to React components are automatically hot-reloaded in development.

To see changes:
1. Save your file
2. App automatically reloads
3. State is preserved

### Electron Debugging

For Electron process debugging:

```bash
# Debug main process
node --inspect=5858 ./node_modules/electron/dist/electron .
```

### Logging

View logs in development console:

```javascript
// In your component
console.log('Debug message:', data);
console.error('Error:', error);
```

## Performance Optimization

### Tips for Faster Uploads

1. **Batch Size**: Upload 50-100 files at a time
2. **File Preparation**: Compress large PDFs before uploading
3. **Network**: Use wired connection for better speeds
4. **Backend**: Ensure backend has sufficient resources

### Memory Usage

The app uses:
- **Idle**: ~150MB RAM
- **Browsing**: ~200-300MB RAM
- **Uploading**: ~300-500MB RAM

## Security Considerations

1. **API Keys**: Never share your API URL or keys
2. **Tokens**: Stored locally only, never logged
3. **File Access**: Only accesses files you explicitly select
4. **Network**: Uses HTTPS for production (configure in settings)

## Updates

### Checking for Updates

Check manually:
1. Help → Check for Updates
2. Or download latest from releases page

### Auto-Update (Enterprise)

Configure auto-updates in `package.json`:

```json
{
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "document-processor"
  }
}
```

## Support and Issues

### Reporting Issues

1. Check the logs (Help → View Logs)
2. Include:
   - OS and version
   - App version
   - Detailed error message
   - Steps to reproduce

### Getting Help

- Check this guide for solutions
- Review backend documentation
- Contact support team

## FAQ

**Q: Can I upload from network drives?**
A: Yes, navigate to the network drive path in the file browser.

**Q: What file types are supported?**
A: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, XLS, XLSX

**Q: Is there a file size limit?**
A: Default is 100MB per file. Contact backend admin to change.

**Q: Can I cancel uploads?**
A: Yes, click the X button next to a file (only before upload starts).

**Q: Where are settings stored?**
A: macOS: `~/Library/Application Support/Document Processor`
   Windows: `%AppData%/Document Processor`
   Linux: `~/.config/Document Processor`

## Advanced Configuration

### Custom Backend URL

Set in environment:
```bash
export DOCUMENT_PROCESSOR_API_URL=https://api.example.com
npm run electron:dev
```

### Proxy Configuration

For corporate networks:
```bash
npm config set proxy http://proxy.example.com:8080
npm config set https-proxy http://proxy.example.com:8080
```

### SSL Certificate Issues

For self-signed certificates (development only):
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run electron:dev
```

## Version History

### v1.0.0
- Initial release
- File browser
- Batch upload
- Progress tracking
- Multi-service support

## License

See LICENSE file in project root.

## Contributing

For development contributions:

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test
3. Submit pull request
4. Ensure all tests pass

## Support Contact

- **Email**: support@example.com
- **Documentation**: https://docs.example.com
- **Bug Reports**: https://github.com/example/issues
