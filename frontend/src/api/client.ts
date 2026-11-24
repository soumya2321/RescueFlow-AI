import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5055';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rescueflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ message?: string; title?: string } | string>;
    if (!axiosErr.response) {
      return `Unable to reach RescueFlow API. Ensure backend is running on ${BASE_URL}`;
    }
    const data = axiosErr.response.data;
    if (typeof data === 'string' && data.trim()) {
      if (
        data.includes('<!DOCTYPE') ||
        data.includes('<html') ||
        data.includes('SqlException') ||
        data.includes('Microsoft.Data.SqlClient') ||
        data.includes('at RescueFlow')
      ) {
        return 'A server or database error occurred. Please verify backend logs.';
      }
      return data;
    }
    if (data && typeof data === 'object') {
      if (data.message) return data.message;
      if (data.title) return data.title;
    }
    return `Request failed with status ${axiosErr.response.status}`;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
