import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { UrgencyBadge, StatusBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner, EmptyState } from '../components/FeedbackStates';
import type { AvailableTask } from '../types';

export const VolunteerPickupsPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadMarketplace = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assignmentsApi.getAvailableTasks();
      setTasks(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  const handleTakeTask = async (donationId: number) => {
    setTakingId(donationId);
    try {
      await assignmentsApi.takeTask(donationId);
      showToast(
        `Task #${donationId} claimed successfully! It has been added to your My Tasks list.`,
        'success'
      );
      // Remove claimed task from available list immediately and refresh
      setTasks((prev) => prev.filter((t) => t.donationId !== donationId));
      await loadMarketplace();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setTakingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCat =
      filterCategory === 'all' ||
      t.foodCategory.toLowerCase() === filterCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query === '' ||
      t.foodName.toLowerCase().includes(query) ||
      t.pickupAddress.toLowerCase().includes(query) ||
      t.recipientNgoName.toLowerCase().includes(query) ||
      t.recipientNgoAddress.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  const categories = Array.from(new Set(tasks.map((t) => t.foodCategory))).filter(Boolean);

  return (
    <div className="page-view">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h2>Volunteer Pickup Tasks Marketplace</h2>
          <p>
            Browse eligible surplus food orders requested by recipient NGOs and claim delivery tasks.
          </p>
        </div>
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          onClick={() => navigate('/my-tasks')}
        >
          <i className="bi bi-card-checklist"></i> View My Tasks
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-custom mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by food name, pickup location, or recipient NGO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories ({tasks.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 text-md-end">
              <button
                className="btn btn-light w-100"
                onClick={loadMarketplace}
                disabled={loading}
              >
                <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading available pickup tasks..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadMarketplace} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? 'No tasks available right now' : 'No matching tasks found'}
          description={
            tasks.length === 0
              ? 'When NGOs accept food donations, eligible pickup orders will appear here for volunteers to claim.'
              : 'Try clearing your category filter or search query.'
          }
        />
      ) : (
        <div className="card-custom">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Food Item & Details</th>
                    <th>Pickup From (Donor)</th>
                    <th>Deliver To (Recipient NGO)</th>
                    <th>Deadline</th>
                    <th>Urgency</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.donationId}>
                      <td className="fw-semibold">#{task.donationId}</td>
                      <td>
                        <div className="fw-bold text-dark">{task.foodName}</div>
                        <div className="small text-muted">
                          {task.quantity} {task.unit} · {task.foodCategory}
                        </div>
                        <div className="small text-secondary mt-1">
                          <span className="badge bg-light text-dark border me-1">
                            {task.foodCondition}
                          </span>
                          <span className="badge bg-light text-dark border">
                            {task.storageType}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>
                        <div className="d-flex align-items-start gap-1">
                          <i className="bi bi-geo-alt-fill text-danger mt-1"></i>
                          <span>{task.pickupAddress}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>
                        <div className="fw-semibold text-primary">
                          <i className="bi bi-building me-1"></i>
                          {task.recipientNgoName}
                        </div>
                        <div className="small text-muted">
                          <i className="bi bi-pin-map me-1"></i>
                          {task.recipientNgoAddress}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-clock me-1 text-muted"></i>
                        {new Date(task.pickupDeadline).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <UrgencyBadge score={task.urgencyScore} level={task.urgencyLevel} />
                      </td>
                      <td className="text-center align-middle">
                        <button
                          className="btn btn-sm btn-primary-custom d-inline-flex align-items-center justify-content-center gap-1 w-100"
                          style={{ padding: '0.45rem 0.8rem', fontWeight: 600 }}
                          onClick={() => handleTakeTask(task.donationId)}
                          disabled={takingId === task.donationId}
                        >
                          {takingId === task.donationId ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-hand-index-thumb"></i>
                              <span>Take Task</span>
                            </>
                          )}
                        </button>
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
