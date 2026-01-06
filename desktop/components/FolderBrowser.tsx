import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, Home, HardDrive } from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

interface FolderBrowserProps {
  onFilesSelected: (files: FileItem[]) => void;
  onFolderNavigate: (path: string) => void;
}

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  onFilesSelected,
  onFolderNavigate
}) => {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([]);

  useEffect(() => {
    if (!currentPath) {
      window.electronAPI?.app.getDefaultPath().then(path => {
        loadDirectory(path);
      });
    }
  }, []);

  const loadDirectory = async (dirPath: string) => {
    try {
      setLoading(true);
      const fileList = await window.electronAPI?.fs.listDirectory(dirPath);
      setItems(fileList || []);
      setCurrentPath(dirPath);
      updateBreadcrumbs(dirPath);
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Error loading directory:', error);
      alert(`Failed to load directory: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateBreadcrumbs = (path: string) => {
    const parts = path.split('/').filter(p => p);
    const crumbs: { name: string; path: string }[] = [
      { name: 'Home', path: parts[0] ? '/' : '' }
    ];

    let currentBreadPath = '';
    parts.forEach(part => {
      currentBreadPath += `/${part}`;
      crumbs.push({ name: part, path: currentBreadPath });
    });

    setBreadcrumbs(crumbs);
  };

  const handleFolderClick = (path: string) => {
    loadDirectory(path);
    onFolderNavigate(path);
  };

  const handleFileSelect = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const handleAddSelectedFiles = () => {
    const selected = items.filter(item =>
      !item.isDirectory && selectedFiles.has(item.path)
    );
    onFilesSelected(selected);
    setSelectedFiles(new Set());
  };

  const handleSelectAll = () => {
    const fileItems = items.filter(item => !item.isDirectory);
    if (selectedFiles.size === fileItems.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(fileItems.map(item => item.path)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const fileCount = items.filter(item => !item.isDirectory).length;
  const selectedCount = selectedFiles.size;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => handleFolderClick(currentPath.split('/').slice(0, -1).join('/'))}
            disabled={currentPath === '/' || !currentPath}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} className="transform rotate-180" />
          </button>
          <span className="text-sm text-gray-600">{currentPath || '...'}</span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => handleFolderClick(crumb.path || '/')}
                className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Folder size={32} className="mb-2" />
            <p>Empty folder</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map(item => (
              <div
                key={item.path}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer group"
                onDoubleClick={() => item.isDirectory && handleFolderClick(item.path)}
              >
                <input
                  type="checkbox"
                  disabled={item.isDirectory}
                  checked={selectedFiles.has(item.path)}
                  onChange={() => !item.isDirectory && handleFileSelect(item.path)}
                  className="w-4 h-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={e => e.stopPropagation()}
                />
                {item.isDirectory ? (
                  <Folder size={18} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <File size={18} className="text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  {!item.isDirectory && (
                    <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                  )}
                </div>
                {item.isDirectory && (
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {fileCount} files • {selectedCount} selected
          </span>
          {fileCount > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              {selectedCount === fileCount && fileCount > 0 ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        <button
          onClick={handleAddSelectedFiles}
          disabled={selectedCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
        >
          Add {selectedCount > 0 ? `${selectedCount} File${selectedCount !== 1 ? 's' : ''}` : 'Files'}
        </button>
      </div>
    </div>
  );
};
