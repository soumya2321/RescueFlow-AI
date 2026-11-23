import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Sprout, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';

const DEMO_ACCOUNTS = [
  { role: 'Donor', email: 'donor@demo.com', password: 'Password123!' },
  { role: 'Volunteer', email: 'volunteer@demo.com', password: 'Password123!' },
  { role: 'NGO', email: 'ngo@demo.com', password: 'Password123!' },
  { role: 'Admin', email: 'admin@demo.com', password: 'Password123!' }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter both your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login({ email: loginEmail.trim(), password: loginPassword });
      showToast(`Welcome back, ${res.fullName}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleDemoFill = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Sprout className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to RescueFlow AI</h1>
          <p className="text-sm text-slate-500">Access your Donor, NGO, Volunteer, or Admin workspace</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Login Accounts */}
        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Demo Login Accounts (Click to Fill)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleDemoFill(acc.email, acc.password)}
                className="text-left p-2.5 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition"
              >
                <div className="text-xs font-bold text-slate-900">{acc.role}</div>
                <div className="text-[11px] text-slate-600 truncate">ID: {acc.email}</div>
                <div className="text-[11px] font-mono text-emerald-700">PW: {acc.password}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};
