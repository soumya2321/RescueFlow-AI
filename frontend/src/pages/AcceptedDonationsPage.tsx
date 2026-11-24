
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignmentsApi, donationsApi, usersApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EmptyState, ErrorBanner, LoadingSpinner } from '../components/FeedbackStates';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import type { Donation, VolunteerSummary } from '../types';

export const AcceptedDonationsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerSummary[]>([]);
  const [volunteerIds, setVolunteerIds] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [all, activeVolunteers] = await Promise.all([
        donationsApi.getAll(),
        usersApi.getVolunteers()
      ]);

      setVolunteers(activeVolunteers);

      setDonations(
        all.filter(
          (d) =>
            d.acceptedByNgoId === user?.userId &&
            ['Accepted', 'Assigned', 'PickedUp', 'Delivered']
              .includes(d.status)
        )
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      load();
    }
  }, [user?.userId]);

  const handleAssign = async (donationId: number) => {
    const volId = Number(volunteerIds[donationId]);

    if (!volunteers.some((v) => v.userId === volId)) {
      return showToast(
        'Please select an active volunteer.',
        'error'
      );
    }

    try {
      await assignmentsApi.assignVolunteer(donationId, volId);

      showToast(
        `Volunteer #${volId} assigned to Donation #${donationId}.`,
        'success'
      );

      await load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleComplete = async (donationId: number) => {
    try {
      const assignment =
        await assignmentsApi.getByDonation(donationId);

      await assignmentsApi.completeAssignment(
        assignment.assignmentId
      );

      showToast(
        `Donation #${donationId} marked Completed!`,
        'success'
      );

      await load();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  if (loading) {
    return (
      <LoadingSpinner label="Loading accepted & active pickups..." />
    );
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Accepted &amp; Active Pickup Tracking
        </h1>

        <p className="text-sm text-slate-500">
          Assign volunteers to accepted donations and confirm
          completed deliveries.
        </p>
      </div>

      {donations.length === 0 ? (
        <EmptyState
          title="No active accepted donations"
          description="Accept an available donation first to coordinate pickup."
        />
      ) : (
        <div className="space-y-3">
          {donations.map((d) => (
            <div
              key={d.donationId}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/donations/${d.donationId}`}
                    className="font-bold text-slate-900 hover:text-emerald-700"
                  >
                    #{d.donationId} &middot; {d.foodName}
                  </Link>

                  <UrgencyBadge
                    level={d.urgencyLevel}
                    score={d.urgencyScore}
                  />

                  <StatusBadge status={d.status} />
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  {d.quantity} {d.unit} &middot; {d.pickupAddress}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user?.role === 'NGO' &&
                  d.status === 'Accepted' && (
                    <>
                      <select
                        aria-label="Select volunteer"
                        value={volunteerIds[d.donationId] || ''}
                        disabled={volunteers.length === 0}
                        onChange={(e) =>
                          setVolunteerIds((prev) => ({
                            ...prev,
                            [d.donationId]: e.target.value
                          }))
                        }
                        className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs w-56"
                      >
                        <option value="">
                          {volunteers.length === 0
                            ? 'No active volunteers'
                            : 'Select Volunteer'}
                        </option>

                        {volunteers.map((v) => (
                          <option
                            key={v.userId}
                            value={v.userId}
                          >
                            {v.fullName} (#{v.userId})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() =>
                          handleAssign(d.donationId)
                        }
                        disabled={
                          !volunteers.some(
                            (v) =>
                              v.userId ===
                              Number(volunteerIds[d.donationId])
                          )
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Assign
                      </button>
                    </>
                  )}

                {user?.role === 'NGO' &&
                  d.status === 'Delivered' && (
                    <button
                      onClick={() =>
                        handleComplete(d.donationId)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Mark Completed
                    </button>
                  )}

                <Link
                  to={`/donations/${d.donationId}`}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
