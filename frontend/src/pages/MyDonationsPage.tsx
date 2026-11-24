import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../components/FeedbackStates';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Donation } from '../types';

export const MyDonationsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for cancellation
  const [cancelTarget, setCancelTarget] = useState<Donation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await donationsApi.getAll();
      const mine = all.filter((d) => d.donorId === user?.userId);
      setDonations(mine);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [user?.userId]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await donationsApi.updateStatus(cancelTarget.donationId, 'Cancelled');
      showToast(`Donation #${cancelTarget.donationId} has been cancelled.`, 'info');
      setCancelTarget(null);
      await loadDonations();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>My Donations</h2>
          <p>Track status and urgency scores of everything you have listed.</p>
        </div>
        <button
          className="btn btn-primary-custom"
          style={{ width: 'auto' }}
          onClick={() => navigate('/register-surplus')}
        >
          <i className="bi bi-plus-lg me-1"></i> New Listing
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading your donations..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDonations} />
      ) : donations.length === 0 ? (
        <EmptyState
          title="No food donations found"
          description="You haven't listed any surplus food yet. Create your first donation to connect with local NGOs."
          action={
            <button
              className="btn btn-primary-custom"
              onClick={() => navigate('/register-surplus')}
            >
              <i className="bi bi-plus-lg me-1"></i> Register Surplus Food
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
                    <th>Food Item</th>
                    <th>Department</th>
                    <th>Qty</th>
                    <th>Pickup Deadline</th>
                    <th>Pickup Address</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
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
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(d.pickupDeadline).toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.85rem', maxWidth: '180px' }} className="text-truncate" title={d.pickupAddress}>
                        {d.pickupAddress}
                      </td>
                      <td>
                        <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>
                        {(d.status === 'Available' || d.status === 'Accepted') && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setCancelTarget(d)}
                          >
                            Cancel
                          </button>
                        )}
                        {d.status === 'Completed' && (
                          <span className="text-success small fw-semibold">
                            <i className="bi bi-check-circle-fill me-1"></i>Completed
                          </span>
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

      {/* Confirmation Modal */}
      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel Donation"
        message={`Are you sure you want to cancel the listing for "${cancelTarget?.foodName}"? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Listing"
        cancelLabel="Keep Listing"
        danger
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
};
