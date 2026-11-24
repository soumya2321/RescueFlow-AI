import React from 'react';
import type { DonationStatus, UrgencyLevel } from '../types';

export const StatusBadge: React.FC<{ status: DonationStatus | string }> = ({ status }) => {
  const map: Record<string, string> = {
    Available: 'badge-pending',
    Matched: 'badge-matched',
    Accepted: 'badge-matched',
    Assigned: 'badge-matched',
    PickedUp: 'badge-picked',
    'Picked Up': 'badge-picked',
    Delivered: 'badge-picked',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled',
    Rejected: 'badge-rejected',
    Expired: 'badge-cancelled',
    Failed: 'badge-rejected'
  };

  const badgeClass = map[status] || 'badge-pending';

  return <span className={`badge-status ${badgeClass}`}>{status}</span>;
};

export const UrgencyBadge: React.FC<{ score?: number; level?: UrgencyLevel | string }> = ({ score, level }) => {
  const actualScore = score ?? (level === 'Critical' ? 90 : level === 'High' ? 70 : level === 'Medium' ? 50 : 25);
  
  if (actualScore >= 80 || level === 'Critical') {
    return <span className="badge-status badge-urgent">Urgent {score !== undefined ? score : 'Critical'}</span>;
  }
  if (actualScore >= 60 || level === 'High') {
    return <span className="badge-status badge-high">High {score !== undefined ? score : 'High'}</span>;
  }
  if (actualScore >= 35 || level === 'Medium') {
    return <span className="badge-status badge-medium">Medium {score !== undefined ? score : 'Medium'}</span>;
  }
  return <span className="badge-status badge-low">Low {score !== undefined ? score : 'Low'}</span>;
};
