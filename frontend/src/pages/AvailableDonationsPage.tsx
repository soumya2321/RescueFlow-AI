import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState, ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { UrgencyBadge } from '../components/Badges';
import type { Donation } from '../types';

export const AvailableDonationsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptTarget, setAcceptTarget] = useState<Donation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await donationsApi.getAll();
      setDonations(all.filter((d) => d.status === 'Available').sort((a, b) => b.urgencyScore - a.urgencyScore));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmAccept = async () => {
    if (!acceptTarget) return;
    setSubmitting(true);
    try {
      await donationsApi.updateStatus(acceptTarget.donationId, 'Accepted');
      showToast(`Accepted "${acceptTarget.foodName}"!`, 'success');
      setAcceptTarget(null);
      await load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading available donations..." />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Available Donations</h1>
        <p className="text-sm text-slate-500">Surplus food ready to be accepted by verified NGOs, sorted by urgency score.</p>
      </div>

      {donations.length === 0 ? (
        <EmptyState title="No available donations" description="Check back soon for new surplus food listings." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donations.map((d) => (
            <div key={d.donationId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900">#{d.donationId} · {d.foodName}</div>
                  <div className="text-xs text-slate-500">{d.quantity} {d.unit} · {d.foodCategory} · {d.foodCondition}</div>
                </div>
                <UrgencyBadge level={d.urgencyLevel} score={d.urgencyScore} />
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deadline: {new Date(d.pickupDeadline).toLocaleString()}</span>
              </div>
              <div className="text-xs text-slate-500">{d.pickupAddress}</div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Link to={`/donations/${d.donationId}`} className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700">
                  Details
                </Link>
                {user?.role === 'NGO' && (
                  <button
                    onClick={() => setAcceptTarget(d)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!acceptTarget}
        title="Accept Donation?"
        message={`Accept "${acceptTarget?.foodName}" (${acceptTarget?.quantity} ${acceptTarget?.unit}) for pickup coordination?`}
        loading={submitting}
        onConfirm={confirmAccept}
        onCancel={() => setAcceptTarget(null)}
      />
    </div>
  );
};
