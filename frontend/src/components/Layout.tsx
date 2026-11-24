import { NotificationBell } from './NotificationBell';
import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Sprout,
    User as UserIcon,
  Users,
  X  
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: '/ngo/profile', label: 'NGO Verification', icon: <Users className="w-4 h-4" />, roles: ['NGO'] },
    { to: '/admin/ngos', label: 'Manage NGOs', icon: <Users className="w-4 h-4" />, roles: ['Admin'] },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/donations', label: 'All Donations', icon: <Package className="w-4 h-4" /> },
    {
      to: '/donations/create',
      label: 'Create Donation',
      icon: <PlusCircle className="w-4 h-4" />,
      roles: ['Donor']
    },
    { to: '/urgency-ranking', label: 'AI Urgency Ranking', icon: <Flame className="w-4 h-4" /> },
    {
      to: '/available-donations',
      label: 'Available Donations',
      icon: <Package className="w-4 h-4" />,
      roles: ['NGO', 'Admin']
    },
    
    {
  to: '/accepted-donations',
  label: 'Accepted Donations',
  icon: <CheckCircle2 className="w-4 h-4" />,
  roles: ['NGO']
},
    {
      to: '/assigned-tasks',
      label: 'Assigned Tasks',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['Volunteer']
    },
  {
  to: '/admin/users',
  label: 'Manage Users',
  icon: <Users className="w-4 h-4" />,
  roles: ['Admin']
},
{
  to: '/profile',
  label: 'Profile & Settings',
  icon: <UserIcon className="w-4 h-4" />
}
  ];

  const visibleItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderLinks = (onClick?: () => void) =>
    visibleItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            isActive
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
          }`
        }
      >
        {item.icon}
        <span>{item.label}</span>
      </NavLink>
    ));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">RescueFlow AI</div>
              <div className="text-[11px] font-medium text-emerald-700">Food Rescue Platform</div>
            </div>
          </Link>
        </div>

        <div className="px-4 pt-2"><NotificationBell /></div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">{renderLinks()}</nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-xs font-semibold text-slate-900 truncate">{user?.fullName}</div>
            <div className="text-[11px] text-emerald-700 font-medium">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-700 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header + Drawer */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">RescueFlow AI</span>
          </Link>
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40" onClick={() => setMobileOpen(false)}>
            <div
              className="w-72 bg-white h-full p-4 flex flex-col justify-between shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Navigation</span>
                  <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">{renderLinks(() => setMobileOpen(false))}</nav>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-700 bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
