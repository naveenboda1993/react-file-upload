import React from 'react';
import { UserTable } from '../components/admin/UserTable';

export const AdminPage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">
            Manage users and system settings
          </p>
        </div>

        <UserTable />
      </div>
    </div>
  );
};