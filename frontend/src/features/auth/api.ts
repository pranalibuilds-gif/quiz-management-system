import apiClient from '@/lib/api/client';
import { APIResponse, AuthResponse } from '@/types/auth';
import { LoginCredentials, RegisterCredentials } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<APIResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const response = await apiClient.post<APIResponse<any>>('/users/register', credentials);
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await apiClient.post<APIResponse<boolean>>('/auth/logout', { refresh_token: refreshToken });
    return response.data;
  }
};
