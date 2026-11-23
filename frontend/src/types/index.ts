export type UserRole = 'Donor' | 'NGO' | 'Volunteer' | 'Admin';

export type DonationStatus =
  | 'Available'
  | 'Accepted'
  | 'Assigned'
  | 'PickedUp'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Expired'
  | 'Rejected'
  | 'Failed';

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Expired' | 'Ineligible';

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  isActive: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Donation {
  donationId: number;
  donorId: number;
  foodName: string;
  foodCategory: string;
  quantity: number;
  unit: string;
  foodCondition: string;
  storageType: string;
  pickupDeadline: string;
  pickupAddress: string;
  description?: string | null;
  status: DonationStatus;
  urgencyScore: number;
  urgencyLevel: UrgencyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationRequest {
  foodName: string;
  foodCategory: string;
  quantity: number;
  unit: string;
  foodCondition: string;
  storageType: string;
  pickupDeadline: string;
  pickupAddress: string;
  description?: string;
}

export interface UrgencyResult {
  donationId: number;
  score: number;
  level: UrgencyLevel;
  eligible: boolean;
  hoursUntilPickupDeadline: number;
}

export interface VolunteerAssignment {
  assignmentId: number;
  donationId: number;
  volunteerId: number;
  assignedByNgoId: number;
  assignedAt: string;
  status: 'Assigned' | 'PickedUp' | 'Delivered' | 'Completed';
}

export interface DonorDashboardStats {
  totalDonations: number;
  availableDonations: number;
  acceptedDonations: number;
  assignedDonations: number;
  completedDonations: number;
  cancelledDonations: number;
}

export interface NgoDashboardStats {
  availableDonations: number;
  acceptedDonations: number;
  myTotalAssignments: number;
  myActiveAssignments: number;
  myCompletedAssignments: number;
}

export interface VolunteerDashboardStats {
  totalAssignments: number;
  pendingPickups: number;
  pickedUpDonations: number;
  deliveredDonations: number;
  completedAssignments: number;
}
