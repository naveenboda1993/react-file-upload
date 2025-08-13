import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Files, Users, FolderOpen } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen = true, onClose }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'myFiles', label: 'My Files', icon: Files },
    { id: 'teamFiles', label: 'Team Files', icon: FolderOpen },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Portal', icon: Users }] : []),
  ];

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        bg-gray-50 w-64 min-h-screen border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <nav className="mt-4 sm:mt-8">
          <div className="px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg mb-2 transition-colors touch-manipulation ${
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};