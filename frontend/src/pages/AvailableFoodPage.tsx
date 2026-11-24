import React, { useEffect, useState } from 'react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../components/FeedbackStates';
import { DEPARTMENTS } from '../types';
import type { Donation } from '../types';

export const AvailableFoodPage: React.FC = () => {
  const { showToast } = useToast();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [requestingId, setRequestingId] = useState<number | null>(null);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await donationsApi.getAll();
      setDonations(all.filter((d) => d.status === 'Available'));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleRequestFood = async (donation: Donation) => {
    setRequestingId(donation.donationId);
    try {
      await donationsApi.updateStatus(donation.donationId, 'Accepted');
      showToast(
        `Successfully requested "${donation.foodName}". It is now in your requests for volunteer dispatch.`,
        'success'
      );
      await loadDonations();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setRequestingId(null);
    }
  };

  const filteredDonations = donations.filter((d) => {
    const matchesDept =
      selectedDept === 'all' ||
      d.foodCategory.toLowerCase() === selectedDept.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      d.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.foodCondition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>Available Surplus Food</h2>
          <p>Browse live surplus food listings across restaurants, supermarkets, storage hubs and bakeries.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-custom mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search food, location, condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-7">
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`dept-chip ${selectedDept === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedDept('all')}
                >
                  <i className="bi bi-grid"></i> All Departments
                </button>
                {DEPARTMENTS.slice(0, 5).map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    className={`dept-chip ${selectedDept === dept.label ? 'active' : ''}`}
                    onClick={() => setSelectedDept(dept.label)}
                  >
                    <i className={`bi ${dept.icon}`}></i> {dept.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching available food donations..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadDonations} />
      ) : filteredDonations.length === 0 ? (
        <EmptyState
          title="No available surplus listings found"
          description={
            searchQuery || selectedDept !== 'all'
              ? 'No donations match your selected filters. Try choosing a different department or clearing search.'
              : 'There are currently no surplus food listings in Available status. Please check back later.'
          }
          action={
            (searchQuery || selectedDept !== 'all') && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSelectedDept('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <div className="row g-3">
          {filteredDonations.map((d) => (
            <div key={d.donationId} className="col-md-6 col-xl-4">
              <div className="card-custom h-100 d-flex flex-column">
                <div className="card-body d-flex flex-column flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="food-type-pill">{d.foodCategory}</span>
                    <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                  </div>

                  <h5 style={{ fontWeight: 700, color: '#0f766e', fontSize: '1.15rem' }}>
                    {d.foodName}
                  </h5>

                  <p className="mb-1" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-box me-1 text-muted"></i>
                    <strong>{d.quantity} {d.unit}</strong> · {d.foodCondition}
                  </p>

                  <p className="mb-1" style={{ fontSize: '0.88rem' }}>
                    <i className="bi bi-geo-alt me-1 text-muted"></i>
                    {d.pickupAddress}
                  </p>

                  <p className="mb-2" style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    <i className="bi bi-clock me-1 text-muted"></i>
                    Deadline: {new Date(d.pickupDeadline).toLocaleString()}
                  </p>

                  {d.description && (
                    <p
                      className="mb-3 text-muted"
                      style={{
                        fontSize: '0.82rem',
                        background: '#f8fafc',
                        padding: '0.5rem',
                        borderRadius: '0.5rem'
                      }}
                    >
                      {d.description}
                    </p>
                  )}

                  <div className="mt-auto pt-2">
                    <button
                      className="btn btn-primary-custom btn-sm w-100"
                      onClick={() => handleRequestFood(d)}
                      disabled={requestingId === d.donationId}
                    >
                      {requestingId === d.donationId ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-hand-thumbs-up me-1"></i> Request this Food
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
