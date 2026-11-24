import { apiClient } from './client';
import type {
  AuthResponse,
  AvailableTask,
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
  VolunteerDashboardStats,
  VolunteerUser
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
  }
};

export const donationsApi = {
  getAll: async (): Promise<Donation[]> => {
    const { data } = await apiClient.get<Donation[]>('/api/donations');
    return data;
  },
  getById: async (id: number): Promise<Donation> => {
    try {
      const { data } = await apiClient.get<Donation>(`/api/donations/${id}`);
      return data;
    } catch {
      // Backend GetDonationById returns 400 for non-Available donations;
      // fall back to full list so accepted/assigned/completed details remain accessible.
      const all = await donationsApi.getAll();
      const found = all.find((d) => d.donationId === id);
      if (!found) throw new Error('Donation not found.');
      return found;
    }
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
  getAvailableTasks: async (): Promise<AvailableTask[]> => {
    const { data } = await apiClient.get<AvailableTask[]>('/api/volunteer-assignments/available-tasks');
    return data;
  },
  takeTask: async (donationId: number): Promise<VolunteerAssignment> => {
    const { data } = await apiClient.post<VolunteerAssignment>('/api/volunteer-assignments/take-task', {
      donationId
    });
    return data;
  },
  getActiveVolunteers: async (): Promise<VolunteerUser[]> => {
    const { data } = await apiClient.get<VolunteerUser[]>('/api/volunteer-assignments/volunteers');
    return data;
  },
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
    const { data } = await apiClient.get<DonorDashboardStats>('/api/dashboard/donor');
    return data;
  },
  ngo: async (): Promise<NgoDashboardStats> => {
    const { data } = await apiClient.get<NgoDashboardStats>('/api/dashboard/ngo');
    return data;
  },
  volunteer: async (): Promise<VolunteerDashboardStats> => {
    const { data } = await apiClient.get<VolunteerDashboardStats>('/api/dashboard/volunteer');
    return data;
  }
};
