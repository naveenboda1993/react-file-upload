import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { Document } from '../../types';
import { fileService } from '../../services/fileService';

interface ShareModalProps {
  document: Document;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ document, onClose }) => {
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState(document.shareLink);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const link = await fileService.shareFile(document.id);
      setShareLink(link);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Share File</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">{document.name}</h3>
            <p className="text-sm text-gray-600">
              Generate a shareable link for this file. Anyone with the link will be able to download it.
            </p>
          </div>
          
          {shareLink ? (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                    {shareLink}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>✓ Link is ready to share</p>
                <p>✓ Recipients can download the file</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Click the button below to generate a shareable link for this file.
              </p>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sharing ? 'Generating...' : 'Generate Share Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};