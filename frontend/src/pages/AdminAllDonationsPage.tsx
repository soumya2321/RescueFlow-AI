import React, { useEffect, useState } from 'react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner } from '../components/FeedbackStates';
import { DEPARTMENTS } from '../types';
import type { Donation } from '../types';

export const AdminAllDonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await donationsApi.getAll();
      setDonations(all);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const filtered = donations.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesDept = deptFilter === 'all' || d.foodCategory.toLowerCase() === deptFilter.toLowerCase();
    return matchesStatus && matchesDept;
  });

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>All Food Donations</h2>
          <p>Full system audit feed of all surplus listings submitted across all donor accounts.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-custom mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-6 col-md-4">
              <label className="form-label mb-1" style={{ fontSize: '0.8rem' }}>Filter by Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses ({donations.length})</option>
                <option value="Available">Available</option>
                <option value="Accepted">Accepted</option>
                <option value="Assigned">Assigned</option>
                <option value="PickedUp">Picked Up</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-4">
              <label className="form-label mb-1" style={{ fontSize: '0.8rem' }}>Filter by Department</label>
              <select
                className="form-select form-select-sm"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.label}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading all donations..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDonations} />
      ) : (
        <div className="card-custom">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Food Item</th>
                    <th>Donor ID</th>
                    <th>Department</th>
                    <th>Qty</th>
                    <th>Pickup Address</th>
                    <th>Deadline</th>
                    <th>Urgency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-muted">
                        No donations found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => (
                      <tr key={d.donationId}>
                        <td>#{d.donationId}</td>
                        <td>
                          <strong>{d.foodName}</strong>
                          <br />
                          <small className="text-muted">{d.foodCondition}</small>
                        </td>
                        <td>Donor #{d.donorId}</td>
                        <td>
                          <span className="food-type-pill">{d.foodCategory}</span>
                        </td>
                        <td>
                          {d.quantity} {d.unit}
                        </td>
                        <td style={{ fontSize: '0.85rem', maxWidth: '180px' }} className="text-truncate" title={d.pickupAddress}>
                          {d.pickupAddress}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {new Date(d.pickupDeadline).toLocaleString()}
                        </td>
                        <td>
                          <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                        </td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
