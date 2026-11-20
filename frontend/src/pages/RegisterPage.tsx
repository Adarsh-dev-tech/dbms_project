import React, { useState } from 'react';
import { Building2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    orgName: '',
    orgContactName: '',
    orgEmail: '',
    orgMobileNo: '',
    password: '',
    address: '',
    pincode: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        orgName: form.orgName.trim(),
        orgContactName: form.orgContactName.trim(),
        orgEmail: form.orgEmail.trim(),
        orgMobileNo: form.orgMobileNo.trim(),
        password: form.password,
        address: form.address.trim() || undefined,
        pincode: form.pincode ? Number(form.pincode) : undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card wide">
        <div className="brand-mark">
          <span className="brand-icon">
            <Building2 size={20} />
          </span>
          <span>ExhibitionApp</span>
        </div>

        <h1 className="auth-title">Register Organization</h1>
        <p className="auth-subtitle">
          Create your organization workspace and admin user account.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="reg-org">Organization Name *</label>
              <input
                id="reg-org"
                required
                placeholder="e.g. Nova Tech Expo"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-contact">Admin Full Name *</label>
              <input
                id="reg-contact"
                required
                placeholder="e.g. Alex Rivera"
                value={form.orgContactName}
                onChange={(e) =>
                  setForm({ ...form, orgContactName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                required
                placeholder="alex@novatech.local"
                value={form.orgEmail}
                onChange={(e) => setForm({ ...form, orgEmail: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-mobile">Mobile Number *</label>
              <input
                id="reg-mobile"
                required
                placeholder="9876543210"
                value={form.orgMobileNo}
                onChange={(e) =>
                  setForm({ ...form, orgMobileNo: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password (min 6 chars) *</label>
              <input
                id="reg-password"
                type="password"
                minLength={6}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-pincode">Pincode</label>
              <input
                id="reg-pincode"
                type="number"
                placeholder="411001"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
            </div>

            <div className="form-group full">
              <label htmlFor="reg-address">Address</label>
              <input
                id="reg-address"
                placeholder="City, State"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            <UserPlus size={16} />
            <span>
              {submitting ? 'Creating Workspace...' : 'Register & Sign In'}
            </span>
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          Already have an account?{' '}
          <button type="button" className="link-btn" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
