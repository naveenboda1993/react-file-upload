import React, { useState } from 'react';
import { FolderBrowser } from '../components/FolderBrowser';
import { UploadManager } from '../components/UploadManager';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export const HomePage: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [processingService, setProcessingService] = useState<'sap' | 'abbyy' | 'google' | 'auto'>('auto');

  const handleFilesSelected = (files: FileItem[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (id: string) => {
    // Remove from upload manager - this would be handled in UploadManager component
  };

  const handleUploadComplete = () => {
    setSelectedFiles([]);
  };

  const handleFolderNavigate = (path: string) => {
    console.log('Navigated to:', path);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch File Upload</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Processing Service
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'auto', name: 'Auto Select' },
              { id: 'google', name: 'Google Document AI' },
              { id: 'abbyy', name: 'ABBYY Cloud OCR' },
              { id: 'sap', name: 'SAP Document Extraction' }
            ].map(service => (
              <button
                key={service.id}
                onClick={() => setProcessingService(service.id as any)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  processingService === service.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm">{service.name}</p>
                {processingService === service.id && (
                  <span className="text-xs text-blue-600 font-semibold mt-1 block">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Browse Files</h3>
          <FolderBrowser
            onFilesSelected={handleFilesSelected}
            onFolderNavigate={handleFolderNavigate}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Queue</h3>
          <UploadManager
            files={selectedFiles}
            processingService={processingService}
            onUploadComplete={handleUploadComplete}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      </div>
    </div>
  );
};
