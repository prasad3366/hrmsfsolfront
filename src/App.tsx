import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import TeamManagement from './modules/team/Team';
import Recruitment from './modules/recruitment/Recruitment';
import Assets from './modules/assets/Assets';
import Documents from './modules/documents/Documents';
import { Construction } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading FooDeeZ...</div>;
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
        <p className="text-slate-500 mt-2 max-w-md">This module is part of the FooDeeZ suite but is currently under maintenance or construction.</p>
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
          <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']}>
            <EmployeeList />
          </ProtectedRoute>
        } />

        <Route path="employees/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
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

        <Route path="team" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']}>
            <TeamManagement />
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

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  public props: React.PropsWithChildren<{}>;
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <h1 className="text-2xl font-bold text-rose-600">Something went wrong</h1>
          <p className="mt-2 text-slate-600">The application encountered an error. Please refresh or contact support.</p>
          <pre className="mt-4 p-4 bg-white border rounded shadow-sm overflow-auto text-left text-xs text-slate-700 max-w-3xl">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ErrorBoundary>
          <Router>
            <AppRoutes />
          </Router>
        </ErrorBoundary>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;