import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardApi, donationsApi, assignmentsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { StatusBadge, UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner } from '../components/FeedbackStates';
import type {
  Donation,
  DonorDashboardStats,
  NgoDashboardStats,
  VolunteerAssignment,
  VolunteerDashboardStats
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [donorStats, setDonorStats] = useState<DonorDashboardStats | null>(null);
  const [ngoStats, setNgoStats] = useState<NgoDashboardStats | null>(null);
  const [volunteerStats, setVolunteerStats] = useState<VolunteerDashboardStats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const role = user?.role;

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (role === 'Donor') {
        const [stats, allDonations] = await Promise.all([
          dashboardApi.donor().catch(() => null),
          donationsApi.getAll().catch(() => [])
        ]);
        setDonorStats(stats);
        // Filter donor's donations
        setDonations(allDonations.filter((d) => d.donorId === user?.userId));
      } else if (role === 'NGO') {
        const [stats, allDonations] = await Promise.all([
          dashboardApi.ngo().catch(() => null),
          donationsApi.getAll().catch(() => [])
        ]);
        setNgoStats(stats);
        setDonations(allDonations);
      } else if (role === 'Volunteer') {
        const [stats, myAssignments, allDonations] = await Promise.all([
          dashboardApi.volunteer().catch(() => null),
          assignmentsApi.getMyAssignments().catch(() => []),
          donationsApi.getAll().catch(() => [])
        ]);
        setVolunteerStats(stats);
        setAssignments(myAssignments);
        setDonations(allDonations);
      } else if (role === 'Admin') {
        const allDonations = await donationsApi.getAll().catch(() => []);
        setDonations(allDonations);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user?.userId]);

  // NGO Request Action
  const handleNgoRequest = async (donationId: number) => {
    setActionLoadingId(donationId);
    try {
      await donationsApi.updateStatus(donationId, 'Accepted');
      showToast('Food requested successfully! Status is now Accepted.', 'success');
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Volunteer Pickup / Deliver Actions
  const handleVolunteerPickup = async (assignmentId: number) => {
    setActionLoadingId(assignmentId);
    try {
      await assignmentsApi.confirmPickup(assignmentId);
      showToast('Pickup confirmed! Please proceed with delivery.', 'success');
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVolunteerDeliver = async (assignmentId: number) => {
    setActionLoadingId(assignmentId);
    try {
      await assignmentsApi.confirmDelivery(assignmentId);
      showToast('Delivery confirmed! Awaiting final NGO confirmation.', 'success');
      await loadData();
    } catch (err) {
      showToast(extractErrorMessage(err), 'danger');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={loadData} />;
  }

  // ==================== DONOR DASHBOARD ====================
  if (role === 'Donor') {
    const activeListings = donorStats?.availableDonations ?? donations.filter((d) => d.status === 'Available').length;
    const completedListings = donorStats?.completedDonations ?? donations.filter((d) => d.status === 'Completed').length;
    const totalDonationsCount = donorStats?.totalDonations ?? donations.length;
    const totalKg = donations
      .filter((d) => d.status === 'Completed' || d.status === 'Delivered')
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const mealsShared = Math.round(totalKg * 4) || (completedListings * 15);

    return (
      <div className="page-view">
        <div className="page-header">
          <div>
            <h2>Donor Dashboard</h2>
            <p>Welcome back, {user?.fullName}. Track your surplus food & impact.</p>
          </div>
          <button
            className="btn btn-primary-custom"
            style={{ width: 'auto' }}
            onClick={() => navigate('/register-surplus')}
          >
            <i className="bi bi-plus-lg me-1"></i> Register Surplus
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat-card role-donor">
              <div className="stat-icon">
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="stat-value">{activeListings}</div>
              <div className="stat-label">Active Listings</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-donor">
              <div className="stat-icon">
                <i className="bi bi-check2-circle"></i>
              </div>
              <div className="stat-value">{completedListings}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-donor">
              <div className="stat-icon">
                <i className="bi bi-people"></i>
              </div>
              <div className="stat-value">{mealsShared}</div>
              <div className="stat-label">Meals Shared</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-donor">
              <div className="stat-icon">
                <i className="bi bi-leaf"></i>
              </div>
              <div className="stat-value">{totalKg} kg</div>
              <div className="stat-label">Waste Prevented</div>
            </div>
          </div>
        </div>

        <div className="card-custom">
          <div className="card-header">
            <span>Recent Surplus Listings</span>
            <span className="badge bg-light text-dark">{totalDonationsCount} Total</span>
          </div>
          <div className="card-body p-0">
            {donations.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-box-seam"></i>
                <h5>No donations listed yet</h5>
                <p>Register your first surplus food listing to help those in need.</p>
                <button
                  className="btn btn-primary-custom"
                  onClick={() => navigate('/register-surplus')}
                >
                  <i className="bi bi-plus-lg me-1"></i> Register Surplus
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Food</th>
                      <th>Dept</th>
                      <th>Qty</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.slice(0, 5).map((d) => (
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
                        <td>
                          <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                        </td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate('/my-donations')}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== NGO DASHBOARD ====================
  if (role === 'NGO') {
    const availableDonations = donations.filter((d) => d.status === 'Available');
    const highPriority = [...availableDonations]
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 4);

    const availableCount = ngoStats?.availableDonations ?? availableDonations.length;
    const activeRequests = ngoStats?.acceptedDonations ?? donations.filter((d) => d.status === 'Accepted').length;
    const completedCount = ngoStats?.myCompletedAssignments ?? donations.filter((d) => d.status === 'Completed').length;
    const mealsServed = completedCount * 25 || 120;

    return (
      <div className="page-view">
        <div className="page-header">
          <div>
            <h2>Recipient Dashboard</h2>
            <p>Hello {user?.fullName}. Find surplus food matched for your needs.</p>
          </div>
          <button
            className="btn btn-primary-custom"
            style={{ width: 'auto' }}
            onClick={() => navigate('/available-food')}
          >
            <i className="bi bi-search me-1"></i> Browse Available
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat-card role-ngo">
              <div className="stat-icon">
                <i className="bi bi-search"></i>
              </div>
              <div className="stat-value">{availableCount}</div>
              <div className="stat-label">Available Now</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-ngo">
              <div className="stat-icon">
                <i className="bi bi-hand-thumbs-up"></i>
              </div>
              <div className="stat-value">{activeRequests}</div>
              <div className="stat-label">Active Requests</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-ngo">
              <div className="stat-icon">
                <i className="bi bi-bag-check"></i>
              </div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Received</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-ngo">
              <div className="stat-icon">
                <i className="bi bi-heart"></i>
              </div>
              <div className="stat-value">{mealsServed}+</div>
              <div className="stat-label">Meals Served</div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card-custom h-100">
              <div className="card-header">
                <span>High Priority Matches</span>
                <span className="badge bg-light text-dark">Rule-based AI</span>
              </div>
              <div className="card-body p-0">
                {highPriority.length === 0 ? (
                  <div className="empty-state py-4">
                    <i className="bi bi-inbox"></i>
                    <p>No available food listings at the moment.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-custom mb-0">
                      <thead>
                        <tr>
                          <th>Food</th>
                          <th>Location / Address</th>
                          <th>Urgency</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {highPriority.map((d) => (
                          <tr key={d.donationId}>
                            <td>
                              <strong>{d.foodName}</strong>
                              <br />
                              <small>
                                {d.quantity} {d.unit} · {d.foodCategory}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">{d.pickupAddress}</small>
                            </td>
                            <td>
                              <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary-custom"
                                style={{ width: 'auto', padding: '0.35rem 0.8rem' }}
                                onClick={() => handleNgoRequest(d.donationId)}
                                disabled={actionLoadingId === d.donationId}
                              >
                                {actionLoadingId === d.donationId ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  'Request'
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card-custom h-100">
              <div className="card-header">Your Preferences & AI Rules</div>
              <div className="card-body">
                <p className="mb-2" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  Matches prioritized by time to expiry, storage type, and quantity:
                </p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="food-type-pill">Perishable</span>
                  <span className="food-type-pill">Cooked Meals</span>
                  <span className="food-type-pill">Dry Rations</span>
                  <span className="food-type-pill">Bakery / Bread</span>
                  <span className="food-type-pill">Warehouse Storage</span>
                </div>
                <div className="alert alert-info py-2" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-shield-check me-1"></i> Human approval required before assigning volunteers.
                </div>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/available-food')}
                >
                  Browse Full Food Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VOLUNTEER DASHBOARD ====================
  if (role === 'Volunteer') {
    const totalAssignments = volunteerStats?.totalAssignments ?? assignments.length;
    const pendingPickups = volunteerStats?.pendingPickups ?? assignments.filter((a) => a.status === 'Assigned').length;
    const completedAssignments = volunteerStats?.completedAssignments ?? assignments.filter((a) => a.status === 'Completed').length;
    const activeTasks = assignments.filter((a) => a.status === 'Assigned' || a.status === 'PickedUp');

    return (
      <div className="page-view">
        <div className="page-header">
          <div>
            <h2>Volunteer Dashboard</h2>
            <p>Hi {user?.fullName}. Help move surplus food to those who need it.</p>
          </div>
          <button
            className="btn btn-primary-custom"
            style={{ width: 'auto' }}
            onClick={() => navigate('/pickup-tasks')}
          >
            <i className="bi bi-truck me-1"></i> View Tasks
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat-card role-volunteer">
              <div className="stat-icon">
                <i className="bi bi-list-task"></i>
              </div>
              <div className="stat-value">{pendingPickups}</div>
              <div className="stat-label">Pending Pickups</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-volunteer">
              <div className="stat-icon">
                <i className="bi bi-truck"></i>
              </div>
              <div className="stat-value">{activeTasks.length}</div>
              <div className="stat-label">My Active Tasks</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-volunteer">
              <div className="stat-icon">
                <i className="bi bi-check2-all"></i>
              </div>
              <div className="stat-value">{completedAssignments}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card role-volunteer">
              <div className="stat-icon">
                <i className="bi bi-star"></i>
              </div>
              <div className="stat-value">5.0</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>

        <div className="card-custom">
          <div className="card-header">
            <span>My Active Deliveries</span>
            <span className="badge bg-light text-dark">{activeTasks.length} In Progress</span>
          </div>
          <div className="card-body p-0">
            {activeTasks.length === 0 ? (
              <div className="empty-state py-4">
                <i className="bi bi-check-circle"></i>
                <h5>No pending pickups right now</h5>
                <p>Check the Pickup Tasks page or await new task assignments from NGOs.</p>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate('/pickup-tasks')}
                >
                  View All Tasks
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Assignment ID</th>
                      <th>Donation ID</th>
                      <th>Status</th>
                      <th>Assigned At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTasks.map((task) => (
                      <tr key={task.assignmentId}>
                        <td>#{task.assignmentId}</td>
                        <td>
                          <strong>Donation #{task.donationId}</strong>
                        </td>
                        <td>
                          <StatusBadge status={task.status} />
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(task.assignedAt).toLocaleString()}
                          </small>
                        </td>
                        <td>
                          {task.status === 'Assigned' && (
                            <button
                              className="btn btn-sm btn-primary-custom"
                              style={{ width: 'auto', padding: '0.3rem 0.75rem' }}
                              onClick={() => handleVolunteerPickup(task.assignmentId)}
                              disabled={actionLoadingId === task.assignmentId}
                            >
                              {actionLoadingId === task.assignmentId ? 'Updating...' : 'Confirm Pickup'}
                            </button>
                          )}
                          {task.status === 'PickedUp' && (
                            <button
                              className="btn btn-sm btn-success"
                              style={{ width: 'auto', padding: '0.3rem 0.75rem' }}
                              onClick={() => handleVolunteerDeliver(task.assignmentId)}
                              disabled={actionLoadingId === task.assignmentId}
                            >
                              {actionLoadingId === task.assignmentId ? 'Updating...' : 'Confirm Delivery'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ADMIN DASHBOARD ====================
  const totalListings = donations.length;
  const availableCount = donations.filter((d) => d.status === 'Available').length;
  const completedCount = donations.filter((d) => d.status === 'Completed').length;
  const totalKgSaved = donations
    .filter((d) => d.status === 'Completed' || d.status === 'Delivered')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>Admin Overview</h2>
          <p>System health, redistribution metrics & AI matching control.</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card role-admin">
            <div className="stat-icon">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="stat-value">{totalListings}</div>
            <div className="stat-label">Total Listings</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card role-admin">
            <div className="stat-icon">
              <i className="bi bi-search"></i>
            </div>
            <div className="stat-value">{availableCount}</div>
            <div className="stat-label">Available Now</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card role-admin">
            <div className="stat-icon">
              <i className="bi bi-check2-all"></i>
            </div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed Deliveries</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card role-admin">
            <div className="stat-icon">
              <i className="bi bi-leaf"></i>
            </div>
            <div className="stat-value">{totalKgSaved} kg</div>
            <div className="stat-label">Food Saved</div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card-custom">
            <div className="card-header">
              <span>Live Donation Feed</span>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate('/all-donations')}
              >
                View All
              </button>
            </div>
            <div className="card-body p-0">
              {donations.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-inbox"></i>
                  <p>No donations recorded in database yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Food</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Urgency</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.slice(0, 6).map((d) => (
                        <tr key={d.donationId}>
                          <td>#{d.donationId}</td>
                          <td>
                            <strong>{d.foodName}</strong>
                          </td>
                          <td>
                            <span className="food-type-pill">{d.foodCategory}</span>
                          </td>
                          <td>
                            {d.quantity} {d.unit}
                          </td>
                          <td>
                            <UrgencyBadge score={d.urgencyScore} level={d.urgencyLevel} />
                          </td>
                          <td>
                            <StatusBadge status={d.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-custom mb-3">
            <div className="card-header">AI Urgency Engine</div>
            <div className="card-body">
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Backend rule-based scoring parameters:
              </p>
              <ul style={{ fontSize: '0.88rem', paddingLeft: '1.1rem', color: '#334155' }}>
                <li>Time to expiry: &le; 2h (+50), &le; 6h (+40), &le; 12h (+30)</li>
                <li>Food condition: perishable/leftover (+25-30)</li>
                <li>Quantity threshold: &gt; 20kg (+20 pts)</li>
                <li>Expired or unsafe: 0 pts (Ineligible)</li>
              </ul>
              <div className="alert alert-success py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-shield-check me-1"></i> Human approval always required
              </div>
            </div>
          </div>

          <div className="card-custom">
            <div className="card-header">Quick Actions</div>
            <div className="card-body d-grid gap-2">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => navigate('/matching')}
              >
                Run Matching Engine
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/users')}
              >
                User Directory
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate('/impact')}
              >
                Full Impact Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
