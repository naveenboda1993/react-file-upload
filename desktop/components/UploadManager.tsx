import React, { useState, useEffect } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { desktopFileService } from '../services/desktopFileService';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

interface UploadItem {
  id: string;
  file: FileItem;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface UploadManagerProps {
  files: FileItem[];
  processingService: 'sap' | 'abbyy' | 'google' | 'auto';
  onUploadComplete: () => void;
  onRemoveFile: (id: string) => void;
}

export const UploadManager: React.FC<UploadManagerProps> = ({
  files,
  processingService,
  onUploadComplete,
  onRemoveFile
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0 });

  useEffect(() => {
    if (files.length > 0) {
      const newUploads = files.map((file, idx) => ({
        id: `${Date.now()}-${idx}`,
        file,
        status: 'pending' as const,
        progress: 0
      }));
      setUploads(prev => [...prev, ...newUploads]);
    }
  }, [files]);

  const uploadFile = async (uploadItem: UploadItem) => {
    try {
      setUploads(prev =>
        prev.map(u =>
          u.id === uploadItem.id ? { ...u, status: 'uploading' as const } : u
        )
      );

      const buffer = await window.electronAPI?.fs.readFile(uploadItem.file.path);
      const file = new File([buffer], uploadItem.file.name, {
        type: getMimeType(uploadItem.file.name)
      });

      const response = await desktopFileService.uploadFile(
        file,
        processingService,
        (progress) => {
          setUploads(prev =>
            prev.map(u =>
              u.id === uploadItem.id ? { ...u, progress } : u
            )
          );
        }
      );

      setUploads(prev =>
        prev.map(u =>
          u.id === uploadItem.id
            ? { ...u, status: 'success' as const, progress: 100 }
            : u
        )
      );

      setStats(prev => ({ ...prev, successful: prev.successful + 1 }));
    } catch (error) {
      setUploads(prev =>
        prev.map(u =>
          u.id === uploadItem.id
            ? {
              ...u,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
            : u
        )
      );
      setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
    }
  };

  const startUploads = async () => {
    setIsUploading(true);
    setStats({ total: uploads.length, successful: 0, failed: 0 });

    const pendingUploads = uploads.filter(u => u.status === 'pending');

    for (const upload of pendingUploads) {
      if (!isUploading) break;
      await uploadFile(upload);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsUploading(false);
    onUploadComplete();
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const pendingCount = uploads.filter(u => u.status === 'pending').length;
  const uploadingCount = uploads.filter(u => u.status === 'uploading').length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Upload Queue</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="bg-blue-50 rounded p-2">
            <p className="text-gray-600">Total</p>
            <p className="text-xl font-bold text-blue-600">{uploads.length}</p>
          </div>
          <div className="bg-green-50 rounded p-2">
            <p className="text-gray-600">Successful</p>
            <p className="text-xl font-bold text-green-600">{stats.successful}</p>
          </div>
          <div className="bg-red-50 rounded p-2">
            <p className="text-gray-600">Failed</p>
            <p className="text-xl font-bold text-red-600">{stats.failed}</p>
          </div>
          <div className="bg-yellow-50 rounded p-2">
            <p className="text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Upload size={32} className="mb-2" />
            <p>No files to upload</p>
          </div>
        ) : (
          uploads.map(upload => (
            <div key={upload.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  {upload.status === 'success' && (
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                  )}
                  {(upload.status === 'pending' || upload.status === 'uploading') && (
                    <Clock size={18} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(upload.id)}
                  disabled={upload.status === 'uploading'}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={16} />
                </button>
              </div>

              {upload.status === 'uploading' && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{upload.progress}%</p>
                </div>
              )}

              {upload.status === 'error' && (
                <p className="text-xs text-red-600 mt-1">{upload.error}</p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <button
          onClick={startUploads}
          disabled={isUploading || uploads.length === 0 || pendingCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Upload size={18} />
          <span>
            {isUploading ? `Uploading (${uploadingCount})...` : `Start Upload (${pendingCount})`}
          </span>
        </button>
      </div>
    </div>
  );
};
