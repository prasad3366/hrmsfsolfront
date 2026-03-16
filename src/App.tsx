import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './modules/dashboard/Dashboard';
import EmployeeList from './modules/employees/EmployeeList';
import EmployeeProfile from './modules/employees/EmployeeProfile';
import Attendance from './modules/attendance/Attendance';
import LeaveManagement from './modules/leave/LeaveManagement';
import Payroll from './modules/payroll/Payroll';
import Recruitment from './modules/recruitment/Recruitment';
import Assets from './modules/assets/Assets';
import Documents from './modules/documents/Documents';
import { Construction } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading FSOL Portal...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-slate-500">Access Denied. You do not have permission to view this page.</div>;
  }

  return <>{children}</>;
};

// Placeholder for missing modules
const PlaceholderModule = ({ title }: { title: string }) => (
    <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4 text-slate-400">
            <Construction size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title} Module</h2>
        <p className="text-slate-500 mt-2 max-w-md">This module is part of the FSOL Enterprise suite but is currently under maintenance or construction.</p>
    </div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Login Page - redirect to dashboard if already logged in */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="employees" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <EmployeeList />
          </ProtectedRoute>
        } />

        <Route path="employees/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <EmployeeProfile />
          </ProtectedRoute>
        } />
        
        <Route path="attendance" element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        } />

        <Route path="leave" element={
          <ProtectedRoute>
            <LeaveManagement />
          </ProtectedRoute>
        } />

        <Route path="payroll" element={
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        } />

        <Route path="recruitment" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Recruitment />
          </ProtectedRoute>
        } />

        <Route path="assets" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
            <Assets />
          </ProtectedRoute>
        } />

        {/* Placeholders for remaining modules */}
        <Route path="performance" element={<ProtectedRoute><PlaceholderModule title="Performance" /></ProtectedRoute>} />
        <Route path="documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="helpdesk" element={<ProtectedRoute><PlaceholderModule title="Helpdesk" /></ProtectedRoute>} />
        <Route path="training" element={<ProtectedRoute><PlaceholderModule title="Training" /></ProtectedRoute>} />
        <Route path="announcements" element={<ProtectedRoute><PlaceholderModule title="Announcements" /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute><PlaceholderModule title="Reports" /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><PlaceholderModule title="Settings" /></ProtectedRoute>} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;