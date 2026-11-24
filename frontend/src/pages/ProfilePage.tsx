
import React, { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Shield, Save, Lock,
  Eye, EyeOff, Loader2, RefreshCw
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/services';
import { extractErrorMessage } from '../api/client';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (!fullName.trim() || !email.trim()) {
      setProfileError('Name and email are required.');
      return;
    }

    setSaving(true);

    try {
      await authApi.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null
      });

      await refreshUser();

      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      setProfileError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must differ from current password.');
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showToast('Password changed successfully!', 'success');
    } catch (error) {
      setPasswordError(extractErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Profile &amp; Settings
        </h1>

        <p className="text-sm text-slate-500">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">

        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">

          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {user?.fullName}
            </h2>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              User ID
            </div>

            <div className="font-semibold mt-1">
              #{user?.userId}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs text-slate-500">
              Account Status
            </div>

            <div className="font-semibold text-emerald-700 mt-1">
              {user?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>

        </div>

        <button
          type="button"
          onClick={refreshUser}
          disabled={saving || changingPassword}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Profile
        </button>

      </div>

      {/* Edit Profile */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
      >

        <h2 className="text-lg font-bold text-slate-900">
          Personal Information
        </h2>

        {profileError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
            {profileError}
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-2 mb-2">
            <User className="w-4 h-4" />
            Full Name
          </label>

          <input
            id="fullName"
            type="text"
            required
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="profileEmail" className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4" />
            Email Address
          </label>

          <input
            id="profileEmail"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </label>

          <input
            id="phone"
            type="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-60"
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }

          {saving ? 'Saving...' : 'Save Changes'}
        </button>

      </form>

      {/* Change Password */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
      >

        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          Change Password
        </h2>

        <p className="text-sm text-slate-500">
          Update your password to keep your account secure.
        </p>

        {passwordError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
            {passwordError}
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-semibold mb-2">
            Current Password
          </label>

          <input
            id="currentPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-semibold mb-2">
            New Password
          </label>

          <input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2">
            Confirm New Password
          </label>

          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="flex items-center gap-2 text-sm text-slate-600"
        >
          {showPassword
            ? <EyeOff className="w-4 h-4" />
            : <Eye className="w-4 h-4" />
          }

          {showPassword ? 'Hide passwords' : 'Show passwords'}
        </button>

        <button
          type="submit"
          disabled={changingPassword}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-60"
        >
          {changingPassword
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Lock className="w-4 h-4" />
          }

          {changingPassword ? 'Updating...' : 'Update Password'}
        </button>

      </form>

    </div>
  );
};
