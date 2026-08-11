import apiClient from '@/lib/api/client';
import { APIResponse, User } from '@/types/auth';

export interface UserFilters {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export const adminUserApi = {
  list: async (filters: UserFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.limit !== undefined) params.append('limit', String(filters.limit));

    const response = await apiClient.get<APIResponse<User[]>>(`/users/?${params.toString()}`);
    return response.data;
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const response = await apiClient.patch<APIResponse<User>>(`/users/${id}/status?is_active=${isActive}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<APIResponse<boolean>>(`/users/${id}`);
    return response.data;
  }
};
