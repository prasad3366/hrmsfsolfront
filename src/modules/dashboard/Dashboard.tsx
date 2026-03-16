import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardRouter from './DashboardRouter';

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm">Welcome back, {user?.name} ({user?.role})</p>
        </div>
      </div>
      
      <DashboardRouter />
    </div>
  );
};

export default Dashboard;