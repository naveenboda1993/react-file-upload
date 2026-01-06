const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    openFile: () => ipcRenderer.invoke('dialog:openFile')
  },
  fs: {
    listDirectory: (dirPath) => ipcRenderer.invoke('fs:listDirectory', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    getFileInfo: (filePath) => ipcRenderer.invoke('fs:getFileInfo', filePath)
  },
  app: {
    getDefaultPath: () => ipcRenderer.invoke('app:getDefaultPath'),
    getAppVersion: () => ipcRenderer.invoke('app:getAppVersion')
  },
  onUploadProgress: (callback) => ipcRenderer.on('upload:progress', (event, data) => callback(data)),
  onUploadComplete: (callback) => ipcRenderer.on('upload:complete', (event, data) => callback(data)),
  onUploadError: (callback) => ipcRenderer.on('upload:error', (event, data) => callback(data))
});
