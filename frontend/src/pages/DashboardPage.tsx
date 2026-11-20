import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarRange,
  Package,
  UserCheck,
  Users,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Campaign, PageKey, Product, User, Visitor } from '../types';

interface DashboardPageProps {
  onNavigate: (page: PageKey) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<Campaign[]>('/campaign-master').catch(() => []),
      apiRequest<Visitor[]>('/visitor-master').catch(() => []),
      apiRequest<Product[]>('/product-master').catch(() => []),
      apiRequest<User[]>('/user-master').catch(() => []),
    ])
      .then(([c, v, p, u]) => {
        setCampaigns(Array.isArray(c) ? c : []);
        setVisitors(Array.isArray(v) ? v : []);
        setProducts(Array.isArray(p) ? p : []);
        setUsers(Array.isArray(u) ? u : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c.campaignName]));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome, {user?.username || 'Admin'}
          </h1>
          <p className="page-subtitle">
            Live overview of exhibitions, captured visitor leads, and product
            catalog.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('campaigns')}
          >
            Manage Campaigns
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('visitors')}
          >
            Capture Visitor Lead
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Exhibition Campaigns</div>
            <div className="stat-value">{loading ? '—' : campaigns.length}</div>
          </div>
          <div className="stat-icon indigo">
            <CalendarRange size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Visitor Leads Captured</div>
            <div className="stat-value">{loading ? '—' : visitors.length}</div>
          </div>
          <div className="stat-icon green">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Catalog Products</div>
            <div className="stat-value">{loading ? '—' : products.length}</div>
          </div>
          <div className="stat-icon amber">
            <Package size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Team Members</div>
            <div className="stat-value">{loading ? '—' : users.length}</div>
          </div>
          <div className="stat-icon slate">
            <Users size={22} />
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Active Campaigns</h2>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigate('campaigns')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-wrap">
            {campaigns.length === 0 ? (
              <div className="empty-state">No campaigns yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.campaignName}</div>
                        <div className="muted">{c.location || 'TBD'}</div>
                      </td>
                      <td className="muted">
                        {c.fromDate} → {c.toDate}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            c.status ? 'badge-success' : 'badge-neutral'
                          }`}
                        >
                          {c.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Visitor Leads</h2>
            <button
              type="button"
              className="link-btn"
              onClick={() => onNavigate('visitors')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-wrap">
            {visitors.length === 0 ? (
              <div className="empty-state">No visitor leads recorded yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Company / Contact</th>
                    <th>Campaign</th>
                    <th>Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.slice(0, 5).map((v) => {
                    const primary = v.visitorDetails?.[0];
                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {v.companyName || 'Walk-in Visitor'}
                          </div>
                          <div className="muted">
                            {primary?.visitorName || 'No contact name'}
                            {primary?.mobileNo ? ` · ${primary.mobileNo}` : ''}
                          </div>
                        </td>
                        <td className="muted">
                          {campaignMap.get(v.campaignId) || `#${v.campaignId}`}
                        </td>
                        <td>
                          <span className="badge badge-primary">
                            {v.planningTimeline || 'Standard'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
