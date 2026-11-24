import React from 'react';

export const UsersPage: React.FC = () => {
  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>Users & Role Governance</h2>
          <p>RescueFlow AI role directory, permissions structure and access management.</p>
        </div>
      </div>

      <div className="card-custom mb-4">
        <div className="card-header">
          <span>Platform Accounts Directory</span>
          <span className="badge bg-light text-dark">System Seeded & Managed</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>User / Organization</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Permissions Scope</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Demo Donor</strong>
                    <br />
                    <small className="text-muted">Restaurant & Supermarket Partner</small>
                  </td>
                  <td>donor@demo.com</td>
                  <td>
                    <span className="badge-status badge-completed">Donor</span>
                  </td>
                  <td>Register surplus food, manage listings, view donor impact</td>
                  <td>
                    <span className="badge bg-success-subtle text-success">Active</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Demo NGO</strong>
                    <br />
                    <small className="text-muted">Hope Foundation & Community Kitchen</small>
                  </td>
                  <td>ngo@demo.com</td>
                  <td>
                    <span className="badge-status badge-matched">NGO</span>
                  </td>
                  <td>Browse surplus, request food, assign volunteers, confirm receipt</td>
                  <td>
                    <span className="badge bg-success-subtle text-success">Active</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Demo Volunteer</strong>
                    <br />
                    <small className="text-muted">Field Logistics Volunteer</small>
                  </td>
                  <td>volunteer@demo.com</td>
                  <td>
                    <span className="badge-status badge-high">Volunteer</span>
                  </td>
                  <td>View assigned pickups, confirm transit, confirm delivery</td>
                  <td>
                    <span className="badge bg-success-subtle text-success">Active</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Demo Admin</strong>
                    <br />
                    <small className="text-muted">RescueFlow AI Administration</small>
                  </td>
                  <td>admin@demo.com</td>
                  <td>
                    <span className="badge-status badge-urgent">Admin</span>
                  </td>
                  <td>Full system feed, AI urgency ranking monitoring, metrics</td>
                  <td>
                    <span className="badge bg-success-subtle text-success">Active</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card-custom h-100">
            <div className="card-header">Authentication & Security Policy</div>
            <div className="card-body" style={{ fontSize: '0.9rem', color: '#475569' }}>
              <p>
                <strong>Public Registration:</strong> In accordance with backend security design, public self-registration via <code>/api/auth/register</code> is intentionally restricted to <strong>Donor</strong> and <strong>Volunteer</strong> accounts only.
              </p>
              <p>
                <strong>Privileged Roles:</strong> <strong>NGO / Recipient</strong> and <strong>Admin</strong> accounts require pre-verification and administrative provisioning to prevent fraudulent food claims and ensure health/safety standards.
              </p>
              <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-shield-lock me-1"></i> Passwords are salted and hashed using BCrypt. JWT authentication tokens are signed with HMAC-SHA256.
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-custom h-100">
            <div className="card-header">Role-Based Access Control (RBAC)</div>
            <div className="card-body" style={{ fontSize: '0.9rem', color: '#475569' }}>
              <ul className="ps-3 mb-0" style={{ lineHeight: '1.8' }}>
                <li><strong>Donor:</strong> Authenticated access to create donations, update active listings, cancel surplus.</li>
                <li><strong>NGO:</strong> Exclusive permission to accept donations and assign volunteers to pickup tasks.</li>
                <li><strong>Volunteer:</strong> Access restricted to assigned pickup tasks with transit state progression.</li>
                <li><strong>Admin:</strong> Global read access across all donations and AI ranking pipelines.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
