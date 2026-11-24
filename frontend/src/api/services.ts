import type {
  AdminDashboardStats,
  AdminUser,
  UpdateUserStatusResponse,
  UserRole
} from '../types';

import type { VolunteerSummary } from '../types';
import { apiClient } from './client';
import type {
  AuthResponse,
  CreateDonationRequest,
  Donation,
  DonationStatus,
  DonorDashboardStats,
  LoginRequest,
  NgoDashboardStats,
  RegisterRequest,
  UrgencyResult,
  UserProfile,
  VolunteerAssignment,
  VolunteerDashboardStats
} from '../types';


export const authApi = {
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
    return data;
  },

  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    return data;
  },

  me: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>('/api/auth/me');
    return data;
  },

  updateProfile: async (payload: {
    fullName: string;
    email: string;
    phone: string | null;
  }): Promise<UserProfile> => {
    const { data } = await apiClient.put<UserProfile>(
      '/api/auth/profile', payload
    );
    return data;
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>(
      '/api/auth/change-password', payload
    );
    return data;
  }
};

export const donationsApi = {
  getAll: async (): Promise<Donation[]> => {
    const { data } = await apiClient.get<Donation[]>('/api/donations');
    return data;
  },
  getById: async (id: number): Promise<Donation> => {
  const { data } = await apiClient.get<Donation>(
    `/api/donations/${id}`
  );
  return data;
},
  create: async (payload: CreateDonationRequest): Promise<Donation> => {
    const { data } = await apiClient.post<Donation>('/api/donations', payload);
    return data;
  },
  update: async (id: number, payload: CreateDonationRequest): Promise<Donation> => {
    const { data } = await apiClient.put<Donation>(`/api/donations/${id}`, payload);
    return data;
  },
  updateStatus: async (id: number, status: DonationStatus): Promise<Donation> => {
    const { data } = await apiClient.patch<Donation>(`/api/donations/${id}/status`, { status });
    return data;
  },
  getUrgency: async (id: number): Promise<UrgencyResult> => {
    const { data } = await apiClient.get<UrgencyResult>(`/api/donations/${id}/urgency`);
    return data;
  },
  getUrgencyRanking: async (): Promise<UrgencyResult[]> => {
    const { data } = await apiClient.get<UrgencyResult[]>('/api/donations/urgency-ranking');
    return data;
  }
};

export const assignmentsApi = {
  assignVolunteer: async (donationId: number, volunteerId: number): Promise<VolunteerAssignment> => {
    const { data } = await apiClient.post<VolunteerAssignment>('/api/volunteer-assignments', {
      donationId,
      volunteerId
    });
    return data;
  },
  getByDonation: async (donationId: number): Promise<VolunteerAssignment> => {
    const { data } = await apiClient.get<VolunteerAssignment>(`/api/volunteer-assignments/donation/${donationId}`);
    return data;
  },
  getMyAssignments: async (): Promise<VolunteerAssignment[]> => {
    const { data } = await apiClient.get<VolunteerAssignment[]>('/api/volunteer-assignments/my-assignments');
    return data;
  },
  confirmPickup: async (assignmentId: number): Promise<VolunteerAssignment> => {
    const { data } = await apiClient.patch<VolunteerAssignment>(`/api/volunteer-assignments/${assignmentId}/pickup`);
    return data;
  },
  confirmDelivery: async (assignmentId: number): Promise<VolunteerAssignment> => {
    const { data } = await apiClient.patch<VolunteerAssignment>(`/api/volunteer-assignments/${assignmentId}/deliver`);
    return data;
  },
  completeAssignment: async (assignmentId: number): Promise<VolunteerAssignment> => {
    const { data } = await apiClient.patch<VolunteerAssignment>(`/api/volunteer-assignments/${assignmentId}/complete`);
    return data;
  }
};


export const dashboardApi = {
  donor: async (): Promise<DonorDashboardStats> => {
    const { data } = await apiClient.get<DonorDashboardStats>(
      '/api/dashboard/donor'
    );
    return data;
  },

  ngo: async (): Promise<NgoDashboardStats> => {
    const { data } = await apiClient.get<NgoDashboardStats>(
      '/api/dashboard/ngo'
    );
    return data;
  },

  volunteer: async (): Promise<VolunteerDashboardStats> => {
    const { data } = await apiClient.get<VolunteerDashboardStats>(
      '/api/dashboard/volunteer'
    );
    return data;
  }
};

export const usersApi = {
  getVolunteers: async (): Promise<VolunteerSummary[]> => {
    const { data } = await apiClient.get<VolunteerSummary[]>(
      '/api/users/volunteers'
    );
    return data;
  },
};

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await apiClient.get<AdminDashboardStats>(
      '/api/admin/dashboard'
    );
    return data;
  },

  getUsers: async (filters?: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }): Promise<AdminUser[]> => {
    const { data } = await apiClient.get<AdminUser[]>(
      '/api/admin/users',
      { params: filters }
    );
    return data;
  },

  getUserById: async (id: number): Promise<AdminUser> => {
    const { data } = await apiClient.get<AdminUser>(
      `/api/admin/users/${id}`
    );
    return data;
  },

  updateUserStatus: async (
    id: number,
    isActive: boolean
  ): Promise<UpdateUserStatusResponse> => {
    const { data } = await apiClient.patch<UpdateUserStatusResponse>(
      `/api/admin/users/${id}/status`,
      { isActive }
    );
    return data;
  }
};
