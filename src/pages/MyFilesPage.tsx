import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { fileService } from '../services/fileService';
import { FileUpload } from '../components/files/FileUpload';
import { FileCard } from '../components/files/FileCard';
import { RefreshCw } from 'lucide-react';

export const MyFilesPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const files = await fileService.getMyFiles();
      setDocuments(files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = (fileId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== fileId));
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchFiles();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">My Files</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Upload, manage, and share your documents
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 touch-manipulation"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <FileUpload onUploadComplete={fetchFiles} />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-base sm:text-lg mb-4">No files uploaded yet</p>
            <p className="text-sm sm:text-base text-gray-400">
              Upload your first document using the area above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {documents.map((document) => (
              <FileCard
                key={document.id}
                document={document}
                onDelete={handleDelete}
                showDeleteButton={true}
                showShareButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};