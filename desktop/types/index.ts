export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export interface UploadItem {
  id: string;
  file: FileItem;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export type ProcessingService = 'sap' | 'abbyy' | 'google' | 'auto';

declare global {
  interface Window {
    electronAPI?: {
      dialog: {
        openFolder: () => Promise<string | null>;
        openFile: () => Promise<string[]>;
      };
      fs: {
        listDirectory: (dirPath: string) => Promise<FileItem[]>;
        readFile: (filePath: string) => Promise<ArrayBuffer>;
        getFileInfo: (filePath: string) => Promise<{ size: number; modified: string; created: string }>;
      };
      app: {
        getDefaultPath: () => Promise<string>;
        getAppVersion: () => Promise<string>;
      };
      onUploadProgress: (callback: (data: any) => void) => void;
      onUploadComplete: (callback: (data: any) => void) => void;
      onUploadError: (callback: (data: any) => void) => void;
    };
  }
}
