import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';
import type { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Donor' | 'Volunteer'>('Donor');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role as UserRole,
        phone: phone.trim() || undefined
      });
      showToast(`Account created successfully! Welcome, ${res.fullName}.`, 'success');
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
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <i className="bi bi-person-plus-fill"></i>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the movement against food waste</p>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', borderRadius: '0.75rem' }}>
            <i className="bi bi-exclamation-circle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-2 mb-2">
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="regName">Full Name *</label>
              <input
                type="text"
                className="form-control"
                id="regName"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label" htmlFor="regEmail">Email *</label>
              <input
                type="email"
                className="form-control"
                id="regEmail"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label" htmlFor="regPassword">Password *</label>
            <input
              type="password"
              className="form-control"
              id="regPassword"
              placeholder="Minimum 6 characters"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-2">
            <label className="form-label" htmlFor="regRole">I am a... *</label>
            <select
              className="form-select"
              id="regRole"
              value={role}
              onChange={(e) => setRole(e.target.value as 'Donor' | 'Volunteer')}
              required
              disabled={loading}
            >
              <option value="Donor">Food Donor (Restaurant / Supermarket / Storage / Bakery / Farm)</option>
              <option value="Volunteer">Volunteer (Pickup & Delivery)</option>
            </select>
            <div className="form-text" style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Note: NGO and Admin accounts are provisioned securely by platform administrators.
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="regPhone">Phone (Optional)</label>
            <input
              type="tel"
              className="form-control"
              id="regPhone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
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
                Creating Account...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-2"></i>Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
