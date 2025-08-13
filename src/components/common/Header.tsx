import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Document Sharing System
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 min-w-0">
              <User size={18} className="text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate max-w-[100px] sm:max-w-none">{user?.name}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-gray-700 transition-colors p-2 -m-2 touch-manipulation"
            >
              <LogOut size={18} />
              <span className="text-sm hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};