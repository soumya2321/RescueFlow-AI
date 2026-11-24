import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role as UserRole | undefined;

  const getNavLinks = (): NavItem[] => {
    switch (role) {
      case 'Donor':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
          { to: '/register-surplus', label: 'Register Surplus', icon: 'bi-plus-circle' },
          { to: '/my-donations', label: 'My Donations', icon: 'bi-box-seam' },
          { to: '/impact', label: 'My Impact', icon: 'bi-graph-up-arrow' }
        ];
      case 'NGO':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
          { to: '/available-food', label: 'Available Food', icon: 'bi-search' },
          { to: '/my-requests', label: 'My Requests', icon: 'bi-hand-thumbs-up' },
          { to: '/impact', label: 'Impact', icon: 'bi-graph-up-arrow' }
        ];
      case 'Volunteer':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
          { to: '/pickup-tasks', label: 'Pickup Tasks', icon: 'bi-truck' },
          { to: '/my-tasks', label: 'My Tasks', icon: 'bi-clipboard-check' },
          { to: '/impact', label: 'My Contribution', icon: 'bi-graph-up-arrow' }
        ];
      case 'Admin':
        return [
          { to: '/dashboard', label: 'Overview', icon: 'bi-speedometer2' },
          { to: '/all-donations', label: 'All Donations', icon: 'bi-box-seam' },
          { to: '/users', label: 'Users & Roles', icon: 'bi-people' },
          { to: '/matching', label: 'Matching Engine', icon: 'bi-diagram-3' },
          { to: '/impact', label: 'Impact Metrics', icon: 'bi-bar-chart-line' }
        ];
      default:
        return [{ to: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' }];
    }
  };

  const roleLabel = (r?: UserRole): string => {
    switch (r) {
      case 'Donor':
        return 'Food Donor';
      case 'NGO':
        return 'NGO / Recipient';
      case 'Volunteer':
        return 'Volunteer';
      case 'Admin':
        return 'Administrator';
      default:
        return r || 'User';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">
            <i className="bi bi-heart-pulse-fill"></i>
          </div>
          <div>
            <h5>RescueFlow AI</h5>
            <small>VisionQuad</small>
          </div>
        </div>

        <nav className="nav-section">
          {getNavLinks().map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-link-custom ${isActive ? 'active' : ''}`
              }
            >
              <i className={`bi ${item.icon}`}></i> {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initial}</div>
            <div style={{ overflow: 'hidden' }}>
              <div
                className="name text-truncate"
                style={{ maxWidth: '170px' }}
                title={user?.fullName || ''}
              >
                {user?.fullName || 'User'}
              </div>
              <div className="role">{roleLabel(user?.role)}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              border: 'none',
              borderRadius: '0.6rem',
              padding: '0.45rem'
            }}
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Toggle Button */}
      <button
        className="mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
      </button>
    </div>
  );
};
