import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, RefreshCw } from 'lucide-react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { EmptyState, ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { UrgencyBadge } from '../components/Badges';
import { formatHoursRemaining } from '../utils/urgency';
import type { Donation, UrgencyResult } from '../types';

interface RankedItem extends UrgencyResult {
  donation?: Donation;
}

export const UrgencyRankingPage: React.FC = () => {
  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [sortAsc, setSortAsc] = useState(false);

  const loadRanking = async () => {
    setLoading(true);
    setError('');
    try {
      const [ranking, donations] = await Promise.all([
        donationsApi.getUrgencyRanking(),
        donationsApi.getAll()
      ]);
      const map = new Map(donations.map((d) => [d.donationId, d]));
      setItems(ranking.map((r) => ({ ...r, donation: map.get(r.donationId) })));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((i) => levelFilter === 'ALL' || i.level === levelFilter)
      .sort((a, b) => (sortAsc ? a.score - b.score : b.score - a.score));
  }, [items, levelFilter, sortAsc]);

  if (loading) return <LoadingSpinner label="Calculating AI urgency rankings..." />;
  if (error) return <ErrorBanner message={error} onRetry={loadRanking} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-600" />
            <span>AI Urgency Ranking</span>
          </h1>
          <p className="text-sm text-slate-500">Live priority queue from GET /api/donations/urgency-ranking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">All Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium"
          >
            Score: {sortAsc ? 'Low → High' : 'High → Low'}
          </button>
          <button
            onClick={loadRanking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No eligible available donations" description="Urgency ranking shows Available, non-expired donations." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, idx) => (
            <div key={item.donationId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-400">PRIORITY #{idx + 1} · ID #{item.donationId}</div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {item.donation?.foodName || `Donation #${item.donationId}`}
                  </h3>
                  {item.donation && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.donation.quantity} {item.donation.unit} · {item.donation.foodCategory} · {item.donation.pickupAddress}
                    </p>
                  )}
                </div>
                <UrgencyBadge level={item.level} score={item.score} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {formatHoursRemaining(item.hoursUntilPickupDeadline)}
                  </span>
                  <span className={item.eligible ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                    {item.eligible ? 'Eligible' : 'Ineligible'}
                  </span>
                </div>
                <Link to={`/donations/${item.donationId}`} className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Open Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
