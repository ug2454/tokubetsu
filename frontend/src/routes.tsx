import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import ProjectDetailsPage from './pages/ProjectDetailsPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/auth/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="team" element={<div>Team</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 