import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info, Loader2, Sprout } from 'lucide-react';
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
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [maximumCapacity, setMaximumCapacity] = useState('');
  const [capacityUnit, setCapacityUnit] = useState('kg');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<UserRole>('Donor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError('Full name, valid email, and a password of 8 characters (maximum 72 bytes) are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        ...(role === "NGO" ? { organizationName, maximumCapacity: Number(maximumCapacity), capacityUnit, location } : {})
      });
      showToast(`Account created for ${res.fullName} (${res.role})!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Sprout className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">Join RescueFlow AI to donate or deliver surplus food</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., GreenBite Bistro"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
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
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (optional)</label>
            <input
              id="phone"
              type="tel"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Donor">Donor</option>
              <option value="Volunteer">Volunteer</option>
              <option value="NGO">NGO</option>
              
            </select>
            {role === 'NGO' && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>NGO accounts require administrator approval before rescue operations.</span>
              </p>
            )}
          </div>

          {role === 'NGO' && <div className="space-y-2">
            <label>Organization name<input className="w-full border rounded p-2" required maxLength={200} value={organizationName} onChange={e=>setOrganizationName(e.target.value)} /></label>
            <label>Maximum capacity<input className="w-full border rounded p-2" type="number" required min="0.01" max="99999999.99" step="0.01" value={maximumCapacity} onChange={e=>setMaximumCapacity(e.target.value)} /></label>
            <label>Capacity unit<input className="w-full border rounded p-2" required maxLength={20} value={capacityUnit} onChange={e=>setCapacityUnit(e.target.value)} /></label>
            <label>Location<input className="w-full border rounded p-2" required maxLength={500} value={location} onChange={e=>setLocation(e.target.value)} /></label>
          </div>}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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
            <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
