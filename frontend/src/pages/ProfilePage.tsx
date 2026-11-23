import React from 'react';
import { AlertCircle, Mail, Phone, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile &amp; Settings</h1>
        <p className="text-sm text-slate-500">Account details hydrated from GET /api/auth/me.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.fullName}</h2>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</div>
            <div className="font-medium text-slate-900 mt-1">{user?.email}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</div>
            <div className="font-medium text-slate-900 mt-1">{user?.phone || 'Not provided'}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> User ID</div>
            <div className="font-mono font-medium text-slate-900 mt-1">#{user?.userId}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <div className="text-xs text-slate-500">Account Status</div>
            <div className="font-semibold text-emerald-700 mt-1">{user?.isActive ? 'Active' : 'Inactive'}</div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={refreshUser}
            className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sync Profile from Backend
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Pending Backend Features</div>
          <p className="text-xs mt-1 leading-relaxed">
            Profile editing, password updates, NGO profile verification, and Admin user management do not have endpoints in the current ASP.NET Core API yet.
          </p>
        </div>
      </div>
    </div>
  );
};
