import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentsApi, donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../components/FeedbackStates';
import type { Donation, VolunteerAssignment } from '../types';

interface AssignmentWithDonation {
  assignment: VolunteerAssignment;
  donation?: Donation;
}

export const VolunteerMyTasksPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<AssignmentWithDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [myAssignments, allDonations] = await Promise.all([
        assignmentsApi.getMyAssignments(),
        donationsApi.getAll().catch(() => [])
      ]);

      const donationMap = new Map<number, Donation>();
      allDonations.forEach((d) => donationMap.set(d.donationId, d));

      const combined: AssignmentWithDonation[] = myAssignments.map((a) => ({
        assignment: a,
        donation: donationMap.get(a.donationId)
      }));

      // Sort with newest first
      combined.sort(
        (a, b) =>
          new Date(b.assignment.assignedAt).getTime() -
          new Date(a.assignment.assignedAt).getTime()
      );

      setItems(combined);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleConfirmPickup = async (assignmentId: number) => {
    setActionLoadingId(assignmentId);
    try {
      await assignmentsApi.confirmPickup(assignmentId);
      showToast('Pickup confirmed! You are now transporting the food.', 'success');
      await loadTasks();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDeliver = async (assignmentId: number) => {
    setActionLoadingId(assignmentId);
    try {
      await assignmentsApi.confirmDelivery(assignmentId);
      showToast('Delivery confirmed! Awaiting recipient NGO to mark completed.', 'success');
      await loadTasks();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeTasks = items.filter(
    (i) =>
      i.assignment.status === 'Assigned' ||
      i.assignment.status === 'PickedUp' ||
      i.assignment.status === 'Delivered'
  );

  const completedTasks = items.filter(
    (i) => i.assignment.status === 'Completed'
  );

  const displayedItems =
    activeTab === 'active'
      ? activeTasks
      : activeTab === 'completed'
      ? completedTasks
      : items;

  return (
    <div className="page-view">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h2>My Assigned Tasks</h2>
          <p>
            Track your ongoing deliveries, confirm pickups, and review completed food rescue history.
          </p>
        </div>
        <button
          className="btn btn-primary-custom d-flex align-items-center gap-2"
          onClick={() => navigate('/pickup-tasks')}
        >
          <i className="bi bi-plus-circle"></i> Browse Available Tasks
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary-custom' : 'btn-light'}`}
          onClick={() => setActiveTab('all')}
        >
          All Tasks ({items.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary-custom' : 'btn-light'}`}
          onClick={() => setActiveTab('active')}
        >
          Active Deliveries ({activeTasks.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary-custom' : 'btn-light'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed History ({completedTasks.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your assigned tasks..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadTasks} />
      ) : displayedItems.length === 0 ? (
        <EmptyState
          title={
            activeTab === 'active'
              ? 'No active deliveries'
              : activeTab === 'completed'
              ? 'No completed tasks yet'
              : 'You have no assigned tasks'
          }
          description="Browse the Volunteer Pickup Tasks marketplace to claim available food deliveries."
          action={
            <button
              className="btn btn-sm btn-primary-custom mt-2"
              onClick={() => navigate('/pickup-tasks')}
            >
              Browse Marketplace
            </button>
          }
        />
      ) : (
        <div className="card-custom">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Assignment ID</th>
                    <th>Food Item & Details</th>
                    <th>Pickup Address</th>
                    <th>Assigned At</th>
                    <th>Status</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>Transit Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map(({ assignment, donation }) => (
                    <tr key={assignment.assignmentId}>
                      <td className="fw-semibold">#{assignment.assignmentId}</td>
                      <td>
                        <div className="fw-bold text-dark">
                          {donation?.foodName || `Donation #${assignment.donationId}`}
                        </div>
                        <div className="small text-muted">
                          {donation ? `${donation.quantity} ${donation.unit} · ${donation.foodCategory}` : 'Surplus food'}
                        </div>
                        {donation?.urgencyLevel && (
                          <div className="mt-1">
                            <UrgencyBadge score={donation.urgencyScore} level={donation.urgencyLevel} />
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>
                        <i className="bi bi-geo-alt me-1 text-danger"></i>
                        {donation?.pickupAddress || 'Address on record'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-calendar-event me-1 text-muted"></i>
                        {new Date(assignment.assignedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <StatusBadge status={assignment.status} />
                      </td>
                      <td className="text-center align-middle">
                        {assignment.status === 'Assigned' && (
                          <button
                            className="btn btn-sm btn-primary-custom w-100"
                            style={{ padding: '0.4rem 0.7rem' }}
                            onClick={() => handleConfirmPickup(assignment.assignmentId)}
                            disabled={actionLoadingId === assignment.assignmentId}
                          >
                            {actionLoadingId === assignment.assignmentId ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <>
                                <i className="bi bi-box-arrow-up me-1"></i> Confirm Pickup
                              </>
                            )}
                          </button>
                        )}

                        {assignment.status === 'PickedUp' && (
                          <button
                            className="btn btn-sm btn-success w-100"
                            style={{ padding: '0.4rem 0.7rem' }}
                            onClick={() => handleConfirmDeliver(assignment.assignmentId)}
                            disabled={actionLoadingId === assignment.assignmentId}
                          >
                            {actionLoadingId === assignment.assignmentId ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <>
                                <i className="bi bi-check2-circle me-1"></i> Confirm Delivery
                              </>
                            )}
                          </button>
                        )}

                        {assignment.status === 'Delivered' && (
                          <div className="badge bg-warning text-dark p-2 text-wrap" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-hourglass-split me-1"></i>
                            Delivered · Awaiting NGO Completion
                          </div>
                        )}

                        {assignment.status === 'Completed' && (
                          <div className="badge bg-success-subtle text-success p-2" style={{ fontSize: '0.8rem' }}>
                            <i className="bi bi-check-circle-fill me-1"></i> Completed
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
