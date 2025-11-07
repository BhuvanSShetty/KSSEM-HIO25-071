import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Auth pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Farmers from './pages/admin/Farmers.jsx';
import VerifyAll from './pages/admin/VerifyAll.jsx';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard.jsx';
import Devices from './pages/farmer/Devices.jsx';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={
              user
                ? user.role === 'admin'
                  ? '/admin'
                  : '/farmer'
                : '/login'
            }
            replace
          />
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/farmers"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Farmers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verify-all"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <VerifyAll />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer"
        element={
          <ProtectedRoute role="farmer">
            <Layout>
              <FarmerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/devices"
        element={
          <ProtectedRoute role="farmer">
            <Layout>
              <Devices />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
