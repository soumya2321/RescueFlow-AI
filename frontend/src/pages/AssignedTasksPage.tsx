import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Truck } from 'lucide-react';
import { assignmentsApi, donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState, ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { StatusBadge } from '../components/Badges';
import type { Donation, VolunteerAssignment } from '../types';

interface TaskWithDonation {
  assignment: VolunteerAssignment;
  donation?: Donation;
}

export const AssignedTasksPage: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TaskWithDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<{
    assignmentId: number;
    action: 'pickup' | 'deliver';
    foodName: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const [assignments, donations] = await Promise.all([
        assignmentsApi.getMyAssignments(),
        donationsApi.getAll()
      ]);
      const map = new Map(donations.map((d) => [d.donationId, d]));
      setTasks(assignments.map((a) => ({ assignment: a, donation: map.get(a.donationId) })));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const executeAction = async () => {
    if (!confirmState) return;
    setSubmitting(true);
    try {
      if (confirmState.action === 'pickup') {
        await assignmentsApi.confirmPickup(confirmState.assignmentId);
        showToast(`Pickup confirmed for ${confirmState.foodName}!`, 'success');
      } else {
        await assignmentsApi.confirmDelivery(confirmState.assignmentId);
        showToast(`Delivery confirmed for ${confirmState.foodName}!`, 'success');
      }
      setConfirmState(null);
      await loadTasks();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading assigned pickup tasks..." />;
  if (error) return <ErrorBanner message={error} onRetry={loadTasks} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Pickup &amp; Delivery Tasks</h1>
        <p className="text-sm text-slate-500">Confirm pickups from donors and deliveries to NGOs.</p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No assigned tasks" description="When an NGO assigns you to a donation, it will appear here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(({ assignment, donation }) => (
            <div key={assignment.assignmentId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-slate-400">ASSIGNMENT #{assignment.assignmentId}</div>
                  <h3 className="font-bold text-slate-900">
                    {donation?.foodName || `Donation #${assignment.donationId}`}
                  </h3>
                  {donation && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {donation.quantity} {donation.unit} · {donation.foodCategory}
                    </div>
                  )}
                </div>
                <StatusBadge status={assignment.status} />
              </div>

              {donation && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{donation.pickupAddress}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Link to={`/donations/${assignment.donationId}`} className="text-xs font-semibold text-emerald-600">
                  View Details →
                </Link>
                {assignment.status === 'Assigned' && (
                  <button
                    onClick={() =>
                      setConfirmState({
                        assignmentId: assignment.assignmentId,
                        action: 'pickup',
                        foodName: donation?.foodName || `Donation #${assignment.donationId}`
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirm Pickup</span>
                  </button>
                )}
                {assignment.status === 'PickedUp' && (
                  <button
                    onClick={() =>
                      setConfirmState({
                        assignmentId: assignment.assignmentId,
                        action: 'deliver',
                        foodName: donation?.foodName || `Donation #${assignment.donationId}`
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Delivery</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.action === 'pickup' ? 'Confirm Food Pickup?' : 'Confirm Food Delivery?'}
        message={
          confirmState?.action === 'pickup'
            ? `Confirm you have collected "${confirmState?.foodName}" from the donor.`
            : `Confirm you have delivered "${confirmState?.foodName}" to the NGO.`
        }
        loading={submitting}
        onConfirm={executeAction}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
};
