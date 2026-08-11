import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';
import { Quiz, QuizStatus, DifficultyLevel } from '@/types/quiz';

export interface QuizAdminFilters {
  category_id?: string;
  status?: QuizStatus;
  difficulty?: DifficultyLevel;
  skip?: number;
  limit?: number;
}

export const adminQuizApi = {
  list: async (filters: QuizAdminFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.skip !== undefined) params.append('skip', String(filters.skip));
    if (filters.limit !== undefined) params.append('limit', String(filters.limit));

    // For admin view, we want to see everything
    params.append('published_only', 'false');

    const response = await apiClient.get<APIResponse<Quiz[]>>(`/quizzes/?${params.toString()}`);
    return response.data;
  },

  publish: async (id: string) => {
    const response = await apiClient.patch<APIResponse<Quiz>>(`/quizzes/${id}/status`, { status: 'PUBLISHED' });
    return response.data;
  },

  archive: async (id: string) => {
    const response = await apiClient.patch<APIResponse<Quiz>>(`/quizzes/${id}/status`, { status: 'ARCHIVED' });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<APIResponse<boolean>>(`/quizzes/${id}`);
    return response.data;
  }
};
