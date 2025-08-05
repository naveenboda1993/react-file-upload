import React, { useState } from 'react';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { MyFilesPage } from '../../pages/MyFilesPage';
import { TeamFilesPage } from '../../pages/TeamFilesPage';
import { AdminPage } from '../../pages/AdminPage';
import { useAuth } from '../../contexts/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('myFiles');

  const renderContent = () => {
    switch (activeTab) {
      case 'myFiles':
        return <MyFilesPage />;
      case 'teamFiles':
        return <TeamFilesPage />;
      case 'admin':
        return user?.role === 'admin' ? <AdminPage /> : <MyFilesPage />;
      default:
        return <MyFilesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};