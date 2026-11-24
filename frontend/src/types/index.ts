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
  organizationName?: string;
  maximumCapacity?: number;
  capacityUnit?: string;
  location?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Donation {
  donationId: number;
  donorId: number;
acceptedByNgoId: number | null;
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

export interface VolunteerSummary {
  userId: number;
  fullName: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalDonors: number;
  totalNGOs: number;
  totalVolunteers: number;
  totalAdmins: number;

  totalDonations: number;
  availableDonations: number;
  acceptedDonations: number;
  assignedDonations: number;
  pickedUpDonations: number;
  deliveredDonations: number;
  completedDonations: number;
  cancelledDonations: number;
  expiredDonations: number;
  rejectedDonations: number;
  failedDonations: number;

  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
}

export interface AdminUser extends UserProfile {
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserStatusResponse {
  message: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  updatedAt: string;
}
