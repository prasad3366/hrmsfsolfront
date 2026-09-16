import React from 'react';
import DashboardRouter from './DashboardRouter';

const Dashboard = () => {
  return (
    <div className="dashboard-command-center mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
      <DashboardRouter />
    </div>
  );
};

export default Dashboard;