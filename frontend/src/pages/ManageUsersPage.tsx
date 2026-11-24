
import React, { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  ShieldCheck
} from 'lucide-react';

import { adminApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AdminUser, UserRole } from '../types';

export const ManageUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState('all');

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      user.fullName.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword);

    const matchesRole =
      role === '' || user.role === role;

    const matchesStatus =
      status === 'all' ||
      (status === 'active' && user.isActive) ||
      (status === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  const handleStatusChange = async (user: AdminUser) => {
    if (user.role === 'Admin' || updatingId !== null) {
      return;
    }

    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.fullName}'s account?`
    );

    if (!confirmed) return;

    setUpdatingId(user.userId);
    setError('');
    setSuccess('');

    try {
      const response = await adminApi.updateUserStatus(
        user.userId,
        newStatus
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.userId === user.userId
            ? {
                ...item,
                isActive: response.isActive,
                updatedAt: response.updatedAt
              }
            : item
        )
      );

      setSuccess(response.message);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Access denied. Administrator privileges are required.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manage Users
          </h1>

          <p className="text-sm text-slate-500">
            Manage registered users and account access.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading || updatingId !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Total Users
            </span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {loading ? '—' : users.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Active Users
            </span>
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {loading ? '—' : activeUsers}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Inactive Users
            </span>
            <UserX className="h-5 w-5 text-red-600" />
          </div>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {loading ? '—' : inactiveUsers}
          </p>
        </div>

      </div>

      {/* Feedback Messages */}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

            <input
              type="text"
              aria-label="Search users"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm"
            />
          </div>

          <select
            aria-label="Filter by role"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as UserRole | '')
            }
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="">All Roles</option>
            <option value="Donor">Donor</option>
            <option value="NGO">NGO</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            aria-label="Filter by account status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>

          <button
            onClick={() => {
              setSearch('');
              setRole('');
              setStatus('all');
            }}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Clear Filters
          </button>
        </div>

      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredUsers.map((user) => (
                  <tr
                    key={user.userId}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      #{user.userId}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                      {user.fullName}
                      {user.userId === currentUser?.userId && (
                        <span className="ml-2 text-xs text-slate-400">
                          (You)
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {user.email}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {user.role}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {user.phone || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4">

                      {user.role === 'Admin' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          <ShieldCheck className="h-4 w-4" />
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user)}
                          disabled={updatingId !== null}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {updatingId === user.userId
                            ? 'Updating...'
                            : user.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      )}

                    </td>
                  </tr>
                ))}

              </tbody>
            </table>

          </div>
        )}

      </div>

    </div>
  );
};
