import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OceanAtmosphere from './OceanAtmosphere';
import { useState } from 'react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="shell-app relative min-h-screen font-sans text-slate-900">
      <OceanAtmosphere />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} collapsed={isSidebarCollapsed} onCollapsedChange={setIsSidebarCollapsed} />
      <div className={`relative z-[1] flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="shell-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
