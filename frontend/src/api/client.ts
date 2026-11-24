
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5055';

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

    if (!error.response) {
      return 'Unable to connect to RescueFlow API. Please ensure the backend is running.';
    }

    const status = error.response.status;
    const data = error.response.data;

    // Never display internal server exceptions.
    if (status >= 500) {
      return 'An unexpected server error occurred. Please try again later.';
    }

    if (status === 401) {
      return 'Authentication failed or your session has expired. Please check your credentials.';
    }

    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (data && typeof data === 'object') {

      // ASP.NET Core validation errors
      if (data.errors && typeof data.errors === 'object') {
        const messages = Object.values(data.errors)
          .flat()
          .filter(
            (message): message is string =>
              typeof message === 'string'
          );

        if (messages.length > 0) {
          return messages.join(' ');
        }
      }

      if (typeof data.message === 'string') {
        return data.message;
      }

      if (typeof data.title === 'string') {
        return data.title;
      }
    }

    if (
      typeof data === 'string' &&
      data.trim() &&
      data.length <= 300 &&
      !/exception|stack trace|bearer|authorization|<html/i.test(data)
    ) {
      return data;
    }

    if (status === 404) {
      return 'The requested resource was not found.';
    }

    if (status === 409) {
      return 'This request conflicts with existing data.';
    }

    if (status === 400) {
      return 'Invalid information. Please check your input.';
    }

    return `Request failed with status ${status}.`;
  }

  return 'An unexpected error occurred. Please try again.';
}
