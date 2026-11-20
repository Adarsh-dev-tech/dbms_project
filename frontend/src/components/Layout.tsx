import React from 'react';
import {
  Building2,
  CalendarRange,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  UserCheck,
  Users,
} from 'lucide-react';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageKey } from '../types';

interface LayoutProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'campaigns', label: 'Campaigns', icon: <CalendarRange size={18} /> },
  { key: 'visitors', label: 'Visitors & Leads', icon: <UserCheck size={18} /> },
  { key: 'products', label: 'Products', icon: <Package size={18} /> },
  { key: 'users', label: 'Team & Org', icon: <Users size={18} /> },
];

export function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const { user, subscriptionDetails, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="brand-icon">
            <Building2 size={20} />
          </span>
          <span>ExhibitionApp</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a
            href={`${API_BASE_URL}/api/docs`}
            target="_blank"
            rel="noreferrer"
            className="nav-item"
          >
            <ExternalLink size={16} />
            <span>API Docs (Swagger)</span>
          </a>

          <div className="user-pill">
            <div className="user-pill-name">{user?.username}</div>
            <div className="user-pill-org">
              {user?.orgName || `Org #${user?.orgId}`}
              {subscriptionDetails?.planMaster?.name
                ? ` · ${subscriptionDetails.planMaster.name}`
                : ''}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
