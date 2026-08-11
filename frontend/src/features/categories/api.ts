import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';
import { Category } from '@/types/quiz';
import { CategoryFormData } from './types';

export const categoriesApi = {
  list: async (activeOnly: boolean = false) => {
    const response = await apiClient.get<APIResponse<Category[]>>(`/categories/?active_only=${activeOnly}`);
    return response.data;
  },

  create: async (data: CategoryFormData) => {
    const response = await apiClient.post<APIResponse<Category>>('/categories/', data);
    return response.data;
  },

  update: async (id: string, data: CategoryFormData) => {
    const response = await apiClient.patch<APIResponse<Category>>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<APIResponse<boolean>>(`/categories/${id}`);
    return response.data;
  }
};
