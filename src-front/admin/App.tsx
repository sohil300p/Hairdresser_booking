import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginPage from './src/pages/auth/LoginPage';
import DashboardPage from './src/pages/dashboard/DashboardPage';
import NotificationConsole from './src/pages/notifications/NotificationConsole';
import UsersPage from './src/pages/users/UsersPage';
import BarbersPage from './src/pages/barbers/BarbersPage';
import AppointmentsPage from './src/pages/appointments/AppointmentsPage';
import StaffPage from './src/pages/staff/StaffPage';
import SettingsPage from './src/pages/settings/SettingsPage';
import DashboardLayout from './src/layouts/DashboardLayout';

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/notifications" element={<NotificationConsole />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/barbers" element={<BarbersPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
