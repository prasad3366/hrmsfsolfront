import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const foodeezLogo = new URL('../../assets/foodeez.png', import.meta.url).href;
import { 
  LayoutDashboard, Users, CalendarCheck, FileText, 
  DollarSign, Briefcase, TrendingUp, Monitor, 
  File, HelpCircle, GraduationCap, Megaphone, 
  BarChart2, Settings, LogOut, UserCheck
} from 'lucide-react';
import { cn } from '../ui/components';
import { canAccessReports } from '../../modules/reports/reports-roles';

// Extracted Brand Colors
const BRAND_BLUE = '#2A4B9B';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getLinks = () => {
    const employeeAttendanceRoles = [
      'SUPER_ADMIN',
      'CEO',
      'HR',
      'IT_MANAGER',
      'SALES_MANAGER',
      'FINANCE_MANAGER',
    ];

    const links = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Employees', path: '/employees', icon: Users },
      { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
      ...(employeeAttendanceRoles.includes(user.role)
        ? [{ name: 'Employee Attendance', path: '/employee-attendance', icon: CalendarCheck }]
        : []),
      { name: 'Leave', path: '/leave', icon: FileText },
      { name: 'Documents', path: '/documents', icon: File },
      { name: 'Helpdesk', path: '/helpdesk', icon: HelpCircle },
      { name: 'Training', path: '/training', icon: GraduationCap },
      { name: 'Announcements', path: '/announcements', icon: Megaphone },
      { name: 'Team', path: '/team', icon: UserCheck },
      { name: 'Payroll', path: '/payroll', icon: DollarSign },
      { name: 'Recruitment', path: '/recruitment', icon: Briefcase },
      { name: 'Performance', path: '/performance', icon: TrendingUp },
      ...(['SUPER_ADMIN', 'CEO', 'HR', 'IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER', 'EMPLOYEE'].includes(user.role)
        ? [{ name: 'Assets', path: '/assets', icon: Monitor }]
        : []),
      { name: 'Holidays', path: '/holidays', icon: CalendarCheck },
      ...(canAccessReports(user.role) ? [{ name: 'Reports', path: '/reports', icon: BarChart2 }] : []),
      { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return links;
  };

  const links = getLinks();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
        />
      )}
      <div className={cn(
        "w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-30 font-sans transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
      {/* Branding */}
      <div className="h-20 flex items-center px-6 border-b border-slate-100">
        <img 
            src={foodeezLogo}
            alt="FooDeeZ" 
            className="h-20 w-auto" 
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-hide">
        {links.map((link) => (
            <NavLink
            key={link.name}
            to={link.path}
              onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-[#2A4B9B]/10 text-[#2A4B9B]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <link.icon 
                  size={20} 
                  className={cn("mr-3", isActive ? "text-[#2A4B9B]" : "text-slate-400 group-hover:text-slate-600")} 
                />
                {link.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
            onClick={() => {
              if (!user.employeeId) {
                alert('Employee ID not found. Please refresh the page.');
                return;
              }
              navigate(`/employees/${user.employeeId}`);
            }}
            className="w-full flex items-center mb-4 p-2 rounded-lg hover:bg-slate-100 transition-colors group"
            title="View your profile"
        >
            <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full mr-3 border-2 border-white shadow-sm group-hover:border-blue-300" />
            <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600">{user.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
        </button>
        <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-xs font-semibold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
        >
            <LogOut size={14} className="mr-2" />
            Sign Out
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;