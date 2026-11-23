import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Eye, PlusCircle, Search } from 'lucide-react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import type { Donation } from '../types';

const PAGE_SIZE = 8;

export const DonationsPage: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'urgency' | 'deadline' | 'newest'>('urgency');
  const [page, setPage] = useState(1);

  const loadDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await donationsApi.getAll();
      setDonations(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(donations.map((d) => d.foodCategory))).sort(),
    [donations]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return donations
      .filter((d) => {
        if (user?.role === 'Donor' && d.donorId !== user.userId) return false;
        if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
        if (categoryFilter !== 'ALL' && d.foodCategory !== categoryFilter) return false;
        if (q) {
          const hay = `${d.donationId} ${d.foodName} ${d.foodCategory} ${d.pickupAddress}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') return b.urgencyScore - a.urgencyScore;
        if (sortBy === 'deadline') return new Date(a.pickupDeadline).getTime() - new Date(b.pickupDeadline).getTime();
        return b.donationId - a.donationId;
      });
  }, [donations, search, statusFilter, categoryFilter, sortBy, user]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingSpinner label="Loading donations..." />;
  if (error) return <ErrorBanner message={error} onRetry={loadDonations} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.role === 'Donor' ? 'My Donations' : 'All Donations'}
          </h1>
          <p className="text-sm text-slate-500">Search, filter, and inspect surplus food listings.</p>
        </div>
        {user?.role === 'Donor' && (
          <Link
            to="/donations/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Donation</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search food, category, address..."
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="ALL">All Statuses</option>
          {['Available', 'Accepted', 'Assigned', 'PickedUp', 'Delivered', 'Completed', 'Cancelled', 'Rejected', 'Expired'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'urgency' | 'deadline' | 'newest')}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="urgency">Sort: Highest Urgency</option>
            <option value="deadline">Sort: Earliest Deadline</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {paginated.length === 0 ? (
        <EmptyState title="No matching donations" description="Try adjusting your search or filter criteria." />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Food</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Condition / Storage</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginated.map((d) => (
                  <tr key={d.donationId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">#{d.donationId}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{d.foodName}</div>
                      <div className="text-xs text-slate-500">{d.foodCategory} · {d.pickupAddress}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{d.quantity} {d.unit}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{d.foodCondition}</div>
                      <div className="text-slate-400">{d.storageType}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(d.pickupDeadline).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <UrgencyBadge level={d.urgencyLevel} score={d.urgencyScore} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/donations/${d.donationId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginated.map((d) => (
              <div key={d.donationId} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">#{d.donationId} · {d.foodName}</div>
                    <div className="text-xs text-slate-500">{d.foodCategory} · {d.quantity} {d.unit}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="text-xs text-slate-600">
                  {d.foodCondition} · {d.storageType} · {d.pickupAddress}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <UrgencyBadge level={d.urgencyLevel} score={d.urgencyScore} />
                  <Link to={`/donations/${d.donationId}`} className="text-xs font-semibold text-emerald-600">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Page {page} of {totalPages} ({filtered.length} items)</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
