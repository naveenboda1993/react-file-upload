import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { File, Download, Share2, Trash2, Copy } from 'lucide-react';
import { Document } from '../../types';
import { fileService } from '../../services/fileService';
import { ShareModal } from './ShareModal';

interface FileCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
  showShareButton?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ 
  document, 
  onDelete, 
  showDeleteButton = true,
  showShareButton = true 
}) => {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this file?')) {
      setDeleting(true);
      try {
        await fileService.deleteFile(document.id);
        onDelete(document.id);
      } catch (error) {
        console.error('Delete failed:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const copyShareLink = () => {
    if (document.shareLink) {
      navigator.clipboard.writeText(document.shareLink);
    }
  };

  const handleFileNameClick = () => {
    navigate('/file-details', { state: { document } });
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <File size={24} className="text-blue-600" />
            <div className="min-w-0 flex-1">
              <h3 
                className="font-medium text-gray-900 truncate text-sm sm:text-base cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleFileNameClick}
              >
                {document.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {formatFileSize(document.size)} • {formatDate(document.uploadedAt)}
              </p>
              {/* Status and Client ID */}
              <div className="flex flex-wrap gap-2 mt-1">
                {(document.status || document.clientId) && (
                  <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                    {document.status && <>{document.status}</>}
                    {document.status && document.clientId && <span className="mx-1">|</span>}
                    {document.clientId && <>Client ID: {document.clientId}</>}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
            <button
              onClick={() => window.open(document.downloadUrl, '_blank')}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors touch-manipulation"
              title="Download"
            >
              <Download size={16} />
            </button>
            
            {showShareButton && (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 text-gray-500 hover:text-green-600 transition-colors touch-manipulation"
                title="Share"
              >
                <Share2 size={16} />
              </button>
            )}
            
            {showDeleteButton && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 touch-manipulation"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        
        {document.isShared && document.shareLink && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <span className="text-sm text-green-800 font-medium">Shared</span>
              <button
                onClick={copyShareLink}
                className="flex items-center space-x-1 text-sm text-green-700 hover:text-green-800 transition-colors touch-manipulation self-start sm:self-auto"
              >
                <Copy size={14} />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 truncate">
          Uploaded by: {document.uploadedBy}
        </div>
      </div>

      {showShareModal && (
        <ShareModal
          document={document}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};