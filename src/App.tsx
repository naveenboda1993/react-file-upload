import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;