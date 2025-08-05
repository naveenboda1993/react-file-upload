import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Files, Users, FolderOpen } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'myFiles', label: 'My Files', icon: Files },
    { id: 'teamFiles', label: 'Team Files', icon: FolderOpen },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Portal', icon: Users }] : []),
  ];

  return (
    <div className="bg-gray-50 w-64 min-h-screen border-r border-gray-200">
      <nav className="mt-8">
        <div className="px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
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
    </div>
  );
};