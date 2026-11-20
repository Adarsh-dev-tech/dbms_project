import React, { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RoleItem, SbuItem, User } from '../types';

interface UsersPageProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export function UsersPage({ onNotify }: UsersPageProps) {
  const { user, subscriptionDetails } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [sbus, setSbus] = useState<SbuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    mobile: '',
    roleId: '',
    sbuId: '',
    address: '',
  });

  async function loadAll() {
    setLoading(true);
    try {
      const [u, r, s] = await Promise.all([
        apiRequest<User[]>('/user-master'),
        apiRequest<RoleItem[]>('/role-master').catch(() => []),
        apiRequest<SbuItem[]>('/sbu-master').catch(() => []),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setRoles(Array.isArray(r) ? r : []);
      setSbus(Array.isArray(s) ? s : []);
    } catch (err: any) {
      onNotify(err.message || 'Failed to load team members', true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const roleMap = new Map(roles.map((r) => [r.id, r.roleName]));
  const sbuMap = new Map(sbus.map((s) => [s.id, s.sbuName]));

  function openCreate() {
    setForm({
      username: '',
      email: '',
      password: '',
      mobile: '',
      roleId: roles[0]?.id ? String(roles[0].id) : '',
      sbuId: sbus[0]?.id ? String(sbus[0].id) : '',
      address: '',
    });
    setModalOpen(true);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/user-master', {
        method: 'POST',
        body: JSON.stringify({
          orgId: user?.orgId || 1,
          orgName: user?.orgName || undefined,
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          mobile: form.mobile.trim() || undefined,
          roleId: form.roleId ? Number(form.roleId) : undefined,
          sbuId: form.sbuId ? Number(form.sbuId) : undefined,
          address: form.address.trim() || undefined,
          createdBy: user?.username || 'Admin',
          status: true,
        }),
      });
      onNotify('Team member added (password hashed with bcrypt)');
      setModalOpen(false);
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to add user', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(target: User) {
    try {
      await apiRequest(`/user-master/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: !target.status }),
      });
      onNotify(
        `User ${target.username} ${!target.status ? 'activated' : 'deactivated'}`,
      );
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to update user status', true);
    }
  }

  async function handleDelete(target: User) {
    if (target.id === user?.id) {
      onNotify('You cannot delete your own active account', true);
      return;
    }
    if (!window.confirm(`Delete user ${target.username}?`)) return;
    try {
      await apiRequest(`/user-master/${target.id}`, { method: 'DELETE' });
      onNotify('User removed');
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to delete user', true);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team & Organization</h1>
          <p className="page-subtitle">
            Manage exhibition booth staff, roles, and your active workspace
            subscription.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={16} />
          <span>Add Team Member</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2
            className="card-title"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShieldCheck size={18} color="#4f46e5" />
            <span>Organization Workspace</span>
          </h2>
          <span className="badge badge-success">
            {subscriptionDetails?.planMaster?.name || 'Active Workspace'}
          </span>
        </div>
        <div className="card-body">
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div>
              <div className="stat-label">Organization</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {user?.orgName || `Organization #${user?.orgId}`}
              </div>
            </div>
            <div>
              <div className="stat-label">Subscription Validity</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {subscriptionDetails
                  ? `${subscriptionDetails.startDate} → ${subscriptionDetails.endDate}`
                  : 'Standard Demo Access'}
              </div>
            </div>
            <div>
              <div className="stat-label">Business Units (SBUs)</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {sbus.map((s) => s.sbuName).join(', ') || 'Default'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Team Members ({users.length})</h2>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading team members...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name & Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Business Unit</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {u.username}{' '}
                        {u.id === user?.id && (
                          <span className="badge badge-primary">You</span>
                        )}
                      </div>
                      <div className="muted">{u.email || '—'}</div>
                    </td>
                    <td className="muted">{u.mobile || '—'}</td>
                    <td>
                      <span className="badge badge-neutral">
                        {u.roleId
                          ? roleMap.get(u.roleId) || `Role #${u.roleId}`
                          : 'Staff'}
                      </span>
                    </td>
                    <td className="muted">
                      {u.sbuId
                        ? sbuMap.get(u.sbuId) || `SBU #${u.sbuId}`
                        : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`badge ${
                          u.status ? 'badge-success' : 'badge-warning'
                        }`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        onClick={() => handleToggleStatus(u)}
                        title="Click to toggle status"
                      >
                        {u.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={u.id === user?.id}
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="card-title">Add Team Member</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      required
                      placeholder="e.g. Rahul Verma"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@exhibition.local"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Password (min 6 chars) *</label>
                    <input
                      type="password"
                      minLength={6}
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                      placeholder="9876543210"
                      value={form.mobile}
                      onChange={(e) =>
                        setForm({ ...form, mobile: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={form.roleId}
                      onChange={(e) =>
                        setForm({ ...form, roleId: e.target.value })
                      }
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Business Unit (SBU)</label>
                    <select
                      value={form.sbuId}
                      onChange={(e) =>
                        setForm({ ...form, sbuId: e.target.value })
                      }
                    >
                      {sbus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sbuName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Address</label>
                    <input
                      placeholder="Office location"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
