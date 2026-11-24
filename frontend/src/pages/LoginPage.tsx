import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email: email.trim(), password });
      showToast(`Welcome back, ${res.fullName}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email: demoEmail, password: 'Password123!' });
      showToast(`Logged in as ${roleName} (${res.fullName})`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="bi bi-heart-pulse-fill"></i>
        </div>
        <h1 className="auth-title">RescueFlow AI</h1>
        <p className="auth-subtitle">From surplus to shared meals — faster & safer</p>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', borderRadius: '0.75rem' }}>
            <i className="bi bi-exclamation-circle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="loginEmail">Email</label>
            <input
              type="email"
              className="form-control"
              id="loginEmail"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="loginPassword">Password</label>
            <input
              type="password"
              className="form-control"
              id="loginPassword"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <label className="form-check-label" htmlFor="rememberMe" style={{ fontSize: '0.9rem' }}>
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>

        <div className="demo-accounts">
          <h6>
            <i className="bi bi-lightning-charge-fill me-1"></i> Quick Demo Login
          </h6>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('donor@demo.com', 'Donor')}
            disabled={loading}
          >
            <span>donor@demo.com</span>
            <span className="role-badge">Donor</span>
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('ngo@demo.com', 'NGO / Recipient')}
            disabled={loading}
          >
            <span>ngo@demo.com</span>
            <span className="role-badge">NGO / Recipient</span>
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('volunteer@demo.com', 'Volunteer')}
            disabled={loading}
          >
            <span>volunteer@demo.com</span>
            <span className="role-badge">Volunteer</span>
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('admin@demo.com', 'Administrator')}
            disabled={loading}
          >
            <span>admin@demo.com</span>
            <span className="role-badge">Administrator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
