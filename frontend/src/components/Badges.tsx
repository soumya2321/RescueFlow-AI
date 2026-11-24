import React from 'react';
import { getStatusBadgeClasses, getUrgencyBadgeClasses } from '../utils/urgency';
import type { DonationStatus, UrgencyLevel } from '../types';

export const StatusBadge: React.FC<{ status: DonationStatus | string }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClasses(status)}`}>
    {status}
  </span>
);

export const UrgencyBadge: React.FC<{ level: UrgencyLevel | string; score?: number }> = ({ level, score }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getUrgencyBadgeClasses(level)}`}>
    {score !== undefined ? `${score} · ${level}` : level}
  </span>
);
