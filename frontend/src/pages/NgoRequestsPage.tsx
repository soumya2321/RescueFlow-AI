import React, { useEffect, useState } from 'react';
import { donationsApi, assignmentsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../components/FeedbackStates';
import type { Donation, VolunteerAssignment, VolunteerUser } from '../types';

export const NgoRequestsPage: React.FC = () => {
  const { showToast } = useToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign Volunteer Modal
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [volunteerId, setVolunteerId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, activeVols] = await Promise.all([
        donationsApi.getAll(),
        assignmentsApi.getActiveVolunteers().catch(() => [])
      ]);

      setVolunteers(activeVols);
      if (activeVols.length > 0) {
        setVolunteerId((prev) =>
          prev && activeVols.some((v) => v.userId === prev)
            ? prev
            : activeVols[0].userId
        );
      }

      // NGO requests include Accepted, Assigned, PickedUp, Delivered, Completed
      const requested = all.filter(
        (d) =>
          d.status === 'Accepted' ||
          d.status === 'Assigned' ||
          d.status === 'PickedUp' ||
          d.status === 'Delivered' ||
          d.status === 'Completed'
      );
      setDonations(requested);

      // Fetch assignment for each assigned donation
      const assignmentList: VolunteerAssignment[] = [];
      for (const d of requested) {
        if (d.status !== 'Accepted') {
          try {
            const a = await assignmentsApi.getByDonation(d.donationId);
            if (a) assignmentList.push(a);
          } catch {
            // No assignment found or not accessible
          }
        }
      }
      setAssignments(assignmentList);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation || !volunteerId) return;

    setAssigning(true);
    try {
      await assignmentsApi.assignVolunteer(selectedDonation.donationId, Number(volunteerId));
      const vol = volunteers.find((v) => v.userId === Number(volunteerId));
      showToast(
        `Volunteer ${vol?.fullName || `#${volunteerId}`} assigned to donation #${selectedDonation.donationId} successfully!`,
        'success'
      );
      setSelectedDonation(null);
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setAssigning(false);
    }
  };

  const handleCompleteDelivery = async (donationId: number) => {
    const assignment = assignments.find((a) => a.donationId === donationId);
    if (!assignment) {
      showToast('Assignment record not found for this donation.', 'danger');
      return;
    }

    setCompletingId(assignment.assignmentId);
    try {
      await assignmentsApi.completeAssignment(assignment.assignmentId);
      showToast(`Donation #${donationId} confirmed as Completed & Distributed!`, 'success');
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>My Requests & Redistribution</h2>
          <p>Manage requested food, assign volunteer pickup, and confirm final recipient distribution.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your food requests..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : donations.length === 0 ? (
        <EmptyState
          title="No food requests yet"
          description="Browse Available Food to request surplus items from local donors."
        />
      ) : (
        <div className="card-custom">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Pickup Address</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Assigned Volunteer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => {
                    const assignment = assignments.find(
                      (a) => a.donationId === d.donationId
                    );
                    const assignedVol = assignment
                      ? volunteers.find((v) => v.userId === assignment.volunteerId)
                      : null;

                    return (
                      <tr key={d.donationId}>
                        <td>
                          <strong>{d.foodName}</strong>
                          <br />
                          <small className="text-muted">{d.foodCondition}</small>
                        </td>
                        <td>
                          <span className="food-type-pill">{d.foodCategory}</span>
                        </td>
                        <td>
                          {d.quantity} {d.unit}
                        </td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '200px' }} className="text-truncate" title={d.pickupAddress}>
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {d.pickupAddress}
                        </td>
                        <td>
                          <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                        </td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {assignment ? (
                            <div>
                              <div className="fw-semibold text-dark">
                                <i className="bi bi-person-badge me-1 text-primary"></i>
                                {assignedVol ? assignedVol.fullName : `Volunteer #${assignment.volunteerId}`}
                              </div>
                              <div className="small text-muted">
                                Status: <strong>{assignment.status}</strong>
                              </div>
                            </div>
                          ) : d.status === 'Accepted' ? (
                            <span className="text-muted small fst-italic">
                              <i className="bi bi-hourglass me-1"></i> Awaiting Assignment
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          {d.status === 'Accepted' && (
                            <button
                              className="btn btn-sm btn-primary-custom"
                              style={{ width: 'auto', padding: '0.3rem 0.75rem' }}
                              onClick={() => setSelectedDonation(d)}
                            >
                              <i className="bi bi-person-plus me-1"></i> Assign Volunteer
                            </button>
                          )}
                          {d.status === 'Assigned' && (
                            <span className="badge bg-light text-dark border">
                              <i className="bi bi-clock me-1"></i> Awaiting Pickup
                            </span>
                          )}
                          {d.status === 'PickedUp' && (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-truck me-1"></i> In Transit
                            </span>
                          )}
                          {d.status === 'Delivered' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleCompleteDelivery(d.donationId)}
                              disabled={completingId === assignment?.assignmentId}
                            >
                              {completingId === assignment?.assignmentId ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                  Completing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check2-circle me-1"></i> Confirm Received
                                </>
                              )}
                            </button>
                          )}
                          {d.status === 'Completed' && (
                            <span className="text-success small fw-semibold">
                              <i className="bi bi-check-all me-1"></i> Distributed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Volunteer Modal */}
      {selectedDonation && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '1.25rem', border: 'none' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: '#0f766e' }}>
                  Assign Volunteer to #{selectedDonation.donationId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedDonation(null)}
                  disabled={assigning}
                ></button>
              </div>
              <form onSubmit={handleAssignVolunteer}>
                <div className="modal-body px-4 py-3">
                  <p className="text-muted small mb-3">
                    Assign a registered volunteer to pick up <strong>{selectedDonation.foodName}</strong> ({selectedDonation.quantity} {selectedDonation.unit}) from {selectedDonation.pickupAddress}.
                  </p>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="volSelect">Select Volunteer *</label>
                    <select
                      id="volSelect"
                      className="form-select"
                      value={volunteerId}
                      onChange={(e) => setVolunteerId(Number(e.target.value))}
                      required
                      disabled={assigning || volunteers.length === 0}
                    >
                      {volunteers.length === 0 ? (
                        <option value="" disabled>No active volunteers found in database</option>
                      ) : (
                        volunteers.map((v) => (
                          <option key={v.userId} value={v.userId}>
                            {v.fullName} ({v.email} - ID: {v.userId})
                          </option>
                        ))
                      )}
                    </select>
                    <div className="form-text" style={{ fontSize: '0.8rem' }}>
                      {volunteers.length > 0
                        ? `Found ${volunteers.length} active volunteer(s) in system.`
                        : 'No active volunteers registered. You can register volunteers or have them self-assign from the marketplace.'}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4 pt-1 gap-2">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setSelectedDonation(null)}
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-custom"
                    disabled={assigning || !volunteerId || volunteers.length === 0}
                  >
                    {assigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
