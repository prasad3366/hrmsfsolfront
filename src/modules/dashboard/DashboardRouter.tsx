import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RichDashboard from './RichDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return null;
  const approvedRoles = ['SUPER_ADMIN', 'CEO', 'HR', 'FINANCE_MANAGER', 'IT_MANAGER', 'SALES_MANAGER', 'EMPLOYEE'];
  if (!approvedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-slate-500">Access Denied. You do not have permission to view this page.</div>;
  }
  return <RichDashboard role={user.role} />;
};

export default DashboardRouter;
