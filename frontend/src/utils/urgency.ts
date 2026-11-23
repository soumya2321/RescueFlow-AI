import type { DonationStatus, UrgencyLevel, UserRole } from '../types';

export function getUrgencyBadgeClasses(level: UrgencyLevel | string): string {
  switch (level) {
    case 'Critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'High':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getStatusBadgeClasses(status: DonationStatus | string): string {
  switch (status) {
    case 'Available':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Accepted':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'Assigned':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'PickedUp':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Delivered':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'Completed':
      return 'bg-green-200 text-green-900 border-green-300';
    case 'Cancelled':
    case 'Rejected':
    case 'Expired':
    case 'Failed':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function formatHoursRemaining(hours: number): string {
  if (hours <= 0) return 'Expired';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} mins left`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
}

/**
 * Mirrors DonationsController.UpdateDonationStatus transition rules:
 * - Available -> Accepted (NGO), Rejected (NGO), Expired (NGO), Cancelled (Donor owner)
 * - Accepted  -> Cancelled (Donor owner), Rejected (NGO)
 * - Assigned / PickedUp / Delivered / Completed are handled via VolunteerAssignmentsController
 */
export function getAllowedPatchStatusTransitions(
  currentStatus: DonationStatus,
  role: UserRole | undefined,
  isOwner: boolean
): DonationStatus[] {
  if (!role) return [];
  const next: DonationStatus[] = [];

  if (currentStatus === 'Available') {
    if (role === 'NGO') next.push('Accepted', 'Rejected', 'Expired');
    if (role === 'Donor' && isOwner) next.push('Cancelled');
  } else if (currentStatus === 'Accepted') {
    if (role === 'Donor' && isOwner) next.push('Cancelled');
    if (role === 'NGO') next.push('Rejected');
  }

  return next;
}
