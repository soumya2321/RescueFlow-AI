import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Package, ShieldCheck, Truck } from 'lucide-react';
import { assignmentsApi, donationsApi, usersApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { formatHoursRemaining, getAllowedPatchStatusTransitions } from '../utils/urgency';
import type { Donation, DonationStatus, UrgencyResult, VolunteerAssignment, VolunteerSummary } from '../types';

export const DonationDetailsPage: React.FC = () => {
  const { id } = useParams();
  const donationId = Number(id);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [urgency, setUrgency] = useState<UrgencyResult | null>(null);
  const [assignment, setAssignment] = useState<VolunteerAssignment | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerSummary[]>([]);
  const [volunteerError, setVolunteerError] = useState('');
  const [volunteerIdInput, setVolunteerIdInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pendingAction, setPendingAction] = useState<{
    title: string;
    message: string;
    danger?: boolean;
    run: () => Promise<void>;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, u] = await Promise.all([
        donationsApi.getById(donationId),
        donationsApi.getUrgency(donationId)
      ]);
      setDonation(d);
      setUrgency(u);
      setAssignment(null);
      setVolunteers([]);
      setVolunteerError('');
      setVolunteerIdInput('');

      if (user?.role === 'NGO' && d.acceptedByNgoId === user.userId && d.status === 'Accepted') {
        try {
          setVolunteers(await usersApi.getVolunteers());
        } catch (err) {
          setVolunteerError(extractErrorMessage(err));
        }
      }

      if (user?.role === 'NGO' || user?.role === 'Volunteer') {
        try {
          const a = await assignmentsApi.getByDonation(donationId);
          setAssignment(a);
        } catch {
          setAssignment(null);
        }
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (donationId) loadDetails();
  }, [donationId, user?.userId, user?.role]);

  const executeConfirmed = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      await pendingAction.run();
      setPendingAction(null);
      await loadDetails();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading donation details..." />;
  if (error || !donation) return <ErrorBanner message={error || 'Donation not found.'} onRetry={loadDetails} />;

  const isOwner = user?.userId === donation.donorId;

const isNgoOwner =
  user?.role === 'NGO' &&
  donation.acceptedByNgoId === user.userId;

const allowedNextStatuses =
  user?.role === 'NGO' &&
  donation.status !== 'Available' &&
  !isNgoOwner
    ? []
    : getAllowedPatchStatusTransitions(
        donation.status,
        user?.role,
        isOwner
      );
  const handleStatusChange = (nextStatus: DonationStatus) => {
    setPendingAction({
      title: `Update status to ${nextStatus}?`,
      message: `Are you sure you want to transition donation #${donation.donationId} from ${donation.status} to ${nextStatus}?`,
      danger: ['Cancelled', 'Rejected', 'Expired', 'Failed'].includes(nextStatus),
      run: async () => {
        await donationsApi.updateStatus(donation.donationId, nextStatus);
        showToast(`Status updated to ${nextStatus}.`, 'success');
      }
    });
  };

  const handleAssignVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    const volId = Number(volunteerIdInput);
    const selectedVolunteer = volunteers.find((v) => v.userId === volId);
    if (!selectedVolunteer) {
      showToast('Please select an active volunteer.', 'error');
      return;
    }
    setPendingAction({
      title: 'Assign Volunteer?',
      message: `Assign ${selectedVolunteer.fullName} (#${volId}) to pick up "${donation.foodName}"?`,
      run: async () => {
        await assignmentsApi.assignVolunteer(donation.donationId, volId);
        showToast(`Volunteer #${volId} assigned.`, 'success');
        setVolunteerIdInput('');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/donations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Donations</span>
        </Link>
        <StatusBadge status={donation.status} />
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono text-slate-400">DONATION #{donation.donationId}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{donation.foodName}</h1>
            <p className="text-sm text-slate-500">{donation.foodCategory} &middot; Donor ID #{donation.donorId}</p>
          </div>
          <UrgencyBadge level={urgency?.level || donation.urgencyLevel} score={urgency?.score ?? donation.urgencyScore} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Quantity</div>
            <div className="font-semibold text-slate-900 mt-1">{donation.quantity} {donation.unit}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">Condition &amp; Storage</div>
            <div className="font-semibold text-slate-900 mt-1">{donation.foodCondition} &middot; {donation.storageType}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pickup Deadline</div>
            <div className="font-semibold text-slate-900 mt-1">{new Date(donation.pickupDeadline).toLocaleString()}</div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Pickup Address</div>
            <div className="font-semibold text-slate-900 mt-1">{donation.pickupAddress}</div>
          </div>
        </div>

        {donation.description && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</h3>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3.5 border border-slate-100">{donation.description}</p>
          </div>
        )}
      </div>

      {/* Urgency Details from GET /api/donations/{id}/urgency */}
      {urgency && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>AI Urgency Assessment</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50">
              <div className="text-xs text-slate-500">Score</div>
              <div className="text-lg font-bold text-slate-900">{urgency.score} / 100</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <div className="text-xs text-slate-500">Urgency Level</div>
              <div className="mt-1"><UrgencyBadge level={urgency.level} /></div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <div className="text-xs text-slate-500">Time Remaining</div>
              <div className="font-semibold text-slate-900 mt-1">{formatHoursRemaining(urgency.hoursUntilPickupDeadline)}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <div className="text-xs text-slate-500">Eligibility</div>
              <div className={`font-semibold mt-1 ${urgency.eligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                {urgency.eligible ? 'Eligible' : 'Ineligible'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Workflow & Volunteer Assignment */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <span>Workflow Actions</span>
        </h2>

        {allowedNextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allowedNextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  ['Cancelled', 'Rejected', 'Expired'].includes(status)
                    ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Mark as {status}
              </button>
            ))}
          </div>
        )}
  {isNgoOwner && donation.status === 'Accepted' && !assignment && (
          <form onSubmit={handleAssignVolunteer} className="flex flex-wrap items-center gap-2 pt-2">
            {volunteerError && (
              <p className="w-full text-sm text-rose-700">{volunteerError} <button type="button" onClick={loadDetails} className="underline">Retry</button></p>
            )}
            <select
              aria-label="Select volunteer"
              value={volunteerIdInput}
              onChange={(e) => setVolunteerIdInput(e.target.value)}
              disabled={volunteers.length === 0 || actionLoading}
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm w-60"
            >
              <option value="">{volunteerError ? 'Unable to load volunteers' : volunteers.length === 0 ? 'No active volunteers' : 'Select Volunteer'}</option>
              {volunteers.map((v) => (
                <option key={v.userId} value={v.userId}>{v.fullName} (#{v.userId})</option>
              ))}
            </select>
            <button type="submit" disabled={actionLoading || !volunteers.some((v) => v.userId === Number(volunteerIdInput))} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              Assign Volunteer
            </button>
          </form>
        )}

        {assignment && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold text-slate-900">
                Assignment #{assignment.assignmentId} &middot; Volunteer #{assignment.volunteerId}
              </div>
              <div className="text-xs text-slate-500">
                Status: <strong>{assignment.status}</strong> &middot; Assigned {new Date(assignment.assignedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              {user?.role === 'Volunteer' && assignment.status === 'Assigned' && (
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Confirm Pickup?',
                      message: 'Confirm that you have picked up this donation from the donor.',
                      run: async () => {
                        await assignmentsApi.confirmPickup(assignment.assignmentId);
                        showToast('Pickup confirmed!', 'success');
                      }
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold"
                >
                  Confirm Pickup
                </button>
              )}
              {user?.role === 'Volunteer' && assignment.status === 'PickedUp' && (
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Confirm Delivery?',
                      message: 'Confirm that you have delivered this donation to the NGO.',
                      run: async () => {
                        await assignmentsApi.confirmDelivery(assignment.assignmentId);
                        showToast('Delivery confirmed!', 'success');
                      }
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  Confirm Delivery
                </button>
              )}
              {isNgoOwner && assignment.status === 'Delivered' && (
                <button
                  onClick={() =>
                    setPendingAction({
                      title: 'Complete Donation?',
                      message: 'Mark this assignment and donation as Completed.',
                      run: async () => {
                        await assignmentsApi.completeAssignment(assignment.assignmentId);
                        showToast('Donation completed!', 'success');
                      }
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        )}

{allowedNextStatuses.length === 0 && !assignment && !(isNgoOwner && donation.status === 'Accepted') && (
          <p className="text-sm text-slate-500">No workflow actions available for your role at the current status ({donation.status}).</p>
        )}
      </div>

      <ConfirmModal
        open={!!pendingAction}
        title={pendingAction?.title || ''}
        message={pendingAction?.message || ''}
        danger={pendingAction?.danger}
        loading={actionLoading}
        onConfirm={executeConfirmed}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};