import React, { useEffect, useState } from 'react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { UrgencyBadge } from '../components/Badges';
import { LoadingSpinner, ErrorBanner } from '../components/FeedbackStates';
import type { Donation, UrgencyResult } from '../types';

interface RankedItem {
  ranking: UrgencyResult;
  donation?: Donation;
}

export const AdminMatchingPage: React.FC = () => {
  const { showToast } = useToast();

  const [items, setItems] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rankings, allDonations] = await Promise.all([
        donationsApi.getUrgencyRanking(),
        donationsApi.getAll().catch(() => [])
      ]);

      const donationMap = new Map<number, Donation>();
      allDonations.forEach((d) => donationMap.set(d.donationId, d));

      const combined: RankedItem[] = rankings.map((r) => ({
        ranking: r,
        donation: donationMap.get(r.donationId)
      }));

      setItems(combined);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const handleRunCycle = async () => {
    showToast('Refreshing urgency prioritization from backend...', 'info');
    await loadRankings();
    showToast('AI Urgency cycle re-evaluated successfully.', 'success');
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>Intelligent Matching & Urgency Engine</h2>
          <p>Explainable AI prioritization with backend dynamic scoring and human approval.</p>
        </div>
        <button
          className="btn btn-primary-custom"
          style={{ width: 'auto' }}
          onClick={handleRunCycle}
          disabled={loading}
        >
          <i className="bi bi-arrow-repeat me-1"></i> Re-run Urgency Engine
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card-custom">
            <div className="card-header">
              <span>Prioritized Surplus Listings (Backend Urgency Ranking)</span>
              <span className="badge bg-light text-dark">{items.length} Active Candidates</span>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <LoadingSpinner label="Evaluating urgency rankings..." />
              ) : error ? (
                <ErrorBanner message={error} onRetry={loadRankings} />
              ) : items.length === 0 ? (
                <div className="empty-state py-4">
                  <i className="bi bi-diagram-3"></i>
                  <h5>No eligible candidate donations</h5>
                  <p>All currently available donations have either been matched or no items are in Available status.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Food Item</th>
                        <th>Category</th>
                        <th>Hours Remaining</th>
                        <th>Urgency Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(({ ranking, donation }, idx) => (
                        <tr key={ranking.donationId}>
                          <td>
                            <span className="badge rounded-pill bg-light text-dark border">
                              #{idx + 1}
                            </span>
                          </td>
                          <td>
                            <strong>{donation?.foodName || `Donation #${ranking.donationId}`}</strong>
                            <br />
                            <small className="text-muted">{donation?.foodCondition}</small>
                          </td>
                          <td>
                            <span className="food-type-pill">{donation?.foodCategory || 'Surplus'}</span>
                          </td>
                          <td>
                            {ranking.hoursUntilPickupDeadline > 0 ? (
                              <span className={ranking.hoursUntilPickupDeadline <= 6 ? 'text-danger fw-bold' : ''}>
                                {ranking.hoursUntilPickupDeadline} hrs
                              </span>
                            ) : (
                              <span className="text-muted">Deadline reached</span>
                            )}
                          </td>
                          <td>
                            <UrgencyBadge score={ranking.score} level={ranking.level} />
                          </td>
                          <td>
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              Eligible for match
                            </span>
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
            <div className="card-header">How AI Scoring Operates</div>
            <div className="card-body" style={{ fontSize: '0.9rem' }}>
              <p className="fw-semibold text-teal mb-2">Backend Urgency Formula (0-100 pts):</p>
              <ul className="mb-3 ps-3" style={{ fontSize: '0.86rem', color: '#334155' }}>
                <li><strong>Time remaining (max 50 pts):</strong> &le;2h: 50, &le;6h: 40, &le;12h: 30, &le;24h: 20</li>
                <li><strong>Food condition (max 30 pts):</strong> Highly perishable: 30, Perishable/leftover: 25, Cooked: 20, Fresh: 15</li>
                <li><strong>Quantity (max 20 pts):</strong> &gt;20 kg: 20, &gt;10 kg: 15, &gt;5 kg: 10</li>
              </ul>
              <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-shield-check me-1"></i> <strong>Safety Rule:</strong> Expired, unsafe, or spoiled donations receive score 0 and are excluded from eligible matching.
              </div>
            </div>
          </div>

          <div className="card-custom">
            <div className="card-header">Redistribution Workflow</div>
            <div className="card-body" style={{ fontSize: '0.88rem', color: '#64748b' }}>
              <ol className="ps-3 mb-0" style={{ lineHeight: '1.7' }}>
                <li><strong>Donor</strong> lists surplus with deadline & condition.</li>
                <li><strong>RescueFlow AI</strong> computes urgency & ranks candidates.</li>
                <li><strong>NGO</strong> accepts/requests the prioritized listing.</li>
                <li><strong>Volunteer</strong> executes pickup & recipient delivery.</li>
                <li><strong>Recipient NGO</strong> confirms distribution.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
