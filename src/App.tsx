import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { FileDetailsPage } from './pages/FileDetailsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/file-details" element={
            <ProtectedRoute>
              <FileDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;