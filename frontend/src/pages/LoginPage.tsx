import React, { useState } from 'react';
import { Building2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemoCredentials() {
    setEmail('admin@exhibition.local');
    setPassword('Admin@123');
    setError('');
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="brand-mark">
          <span className="brand-icon">
            <Building2 size={20} />
          </span>
          <span>ExhibitionApp</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to manage exhibition campaigns, capture visitor leads, and
          export reports.
        </p>

        <div className="demo-box">
          <div>
            <div>
              Demo Admin: <code>admin@exhibition.local</code>
            </div>
            <div>
              Password: <code>Admin@123</code>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fillDemoCredentials}
          >
            Auto-fill
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="admin@exhibition.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            <LogIn size={16} />
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          New organization?{' '}
          <button
            type="button"
            className="link-btn"
            onClick={onSwitchToRegister}
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
