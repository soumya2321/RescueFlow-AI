import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Flame, Package, PlusCircle, RefreshCw, Scale } from 'lucide-react';
import { adminApi, dashboardApi, donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import type { AdminDashboardStats, Donation, DonorDashboardStats, NgoDashboardStats, VolunteerDashboardStats } from '../types';

const URGENCY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#d97706',
  Low: '#16a34a'
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [roleStats, setRoleStats] = useState<AdminDashboardStats | DonorDashboardStats | NgoDashboardStats | VolunteerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allDonations, roleDash] = await Promise.all([
        donationsApi.getAll(),
        user?.role === 'Donor'
          ? dashboardApi.donor()
          : user?.role === 'NGO'
          ? dashboardApi.ngo()
          : user?.role === 'Volunteer'
          ? dashboardApi.volunteer()
          : user?.role === 'Admin'
          ? adminApi.getDashboard()
          : Promise.resolve(null)
      ]);
      setDonations(allDonations);
      setRoleStats(roleDash);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) loadData();
  }, [user?.userId, user?.role]);

  if (loading) return <LoadingSpinner label="Loading dashboard analytics..." />;
  if (error) return <ErrorBanner message={error} onRetry={loadData} />;

  const relevantDonations =
    user?.role === 'Donor' ? donations.filter((d) => d.donorId === user.userId) : donations;

  const totalCount = relevantDonations.length;
  const availableCount = relevantDonations.filter((d) => d.status === 'Available').length;
  const acceptedCount = relevantDonations.filter((d) => d.status === 'Accepted').length;
  const completedList = relevantDonations.filter((d) => d.status === 'Completed');
  const completedCount = completedList.length;
  const urgentCount = relevantDonations.filter((d) => d.urgencyLevel === 'Critical' || d.urgencyLevel === 'High').length;
  const totalFoodRescued = completedList.reduce((sum, d) => sum + Number(d.quantity || 0), 0);

  const statusData = ['Available', 'Accepted', 'Assigned', 'PickedUp', 'Delivered', 'Completed'].map((status) => ({
    name: status,
    count: relevantDonations.filter((d) => d.status === status).length
  }));

  const urgencyData = ['Critical', 'High', 'Medium', 'Low']
    .map((level) => ({
      name: level,
      value: relevantDonations.filter((d) => d.urgencyLevel === level).length
    }))
    .filter((x) => x.value > 0);

  const recentDonations = [...relevantDonations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user?.role} Dashboard</h1>
          <p className="text-sm text-slate-500">Live overview of food rescue operations and urgency metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {user?.role === 'Donor' && (
            <Link
              to="/donations/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Donation</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Donations</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Available</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{availableCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{acceptedCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{completedCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Urgent</span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{urgentCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Food Rescued</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{totalFoodRescued}</div>
        </div>
      </div>

      {/* Role-Specific Backend Summary */}
      {roleStats && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
          <span className="font-semibold">Live {user?.role} Endpoint Metrics:</span>
          <div className="flex flex-wrap gap-4">
            {Object.entries(roleStats).map(([key, val]) => (
              <span key={key}>
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                <strong>{String(val)}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'Admin' && roleStats && 'totalUsers' in roleStats && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900">User and Assignment Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Total Users', roleStats.totalUsers],
              ['Active Users', roleStats.activeUsers],
              ['Inactive Users', roleStats.inactiveUsers],
              ['Donors', roleStats.totalDonors],
              ['NGOs', roleStats.totalNGOs],
              ['Volunteers', roleStats.totalVolunteers],
              ['Administrators', roleStats.totalAdmins],
              ['Total Assignments', roleStats.totalAssignments],
              ['Active Assignments', roleStats.activeAssignments],
              ['Completed Assignments', roleStats.completedAssignments]
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="font-semibold text-slate-900 mb-4">Donation Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="font-semibold text-slate-900 mb-4">Urgency Level Distribution</h2>
          <div className="h-64">
            {urgencyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No urgency data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={urgencyData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                    {urgencyData.map((entry) => (
                      <Cell key={entry.name} fill={URGENCY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent Donations &amp; Activity</h2>
          <Link to="/donations" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            View all
          </Link>
        </div>
        {recentDonations.length === 0 ? (
          <EmptyState title="No donations yet" description="Donations registered in the system will appear here." />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDonations.map((d) => (
              <Link
                key={d.donationId}
                to={`/donations/${d.donationId}`}
                className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    #{d.donationId} · {d.foodName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {d.quantity} {d.unit} · {d.foodCategory} · {d.pickupAddress}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyBadge level={d.urgencyLevel} score={d.urgencyScore} />
                  <StatusBadge status={d.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};