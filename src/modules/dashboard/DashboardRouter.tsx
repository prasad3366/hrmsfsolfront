import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'CEO':
      return <AdminDashboard />;
    case 'HR':
      return <HRDashboard />;
    case 'FINANCE_MANAGER':
      return <EmployeeDashboard />;
    case 'IT_MANAGER':
    case 'SALES_MANAGER':
      return <ManagerDashboard />;
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    default:
      return <div className="p-8 text-center text-slate-500">Access Denied. You do not have permission to view this page.</div>;
  }
};

export default DashboardRouter;
