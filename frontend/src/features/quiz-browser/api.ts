import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';
import { Quiz, Category } from '@/types/quiz';

export interface QuizFilters {
  category_id?: string;
  published_only?: boolean;
}

export const quizApi = {
  getQuizzes: async (filters: QuizFilters = { published_only: true }) => {
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id);
    params.append('published_only', String(filters.published_only));

    const response = await apiClient.get<APIResponse<Quiz[]>>(`/quizzes/?${params.toString()}`);
    return response.data;
  },

  getQuiz: async (id: string) => {
    const response = await apiClient.get<APIResponse<Quiz>>(`/quizzes/${id}`);
    return response.data;
  },

  getCategories: async (activeOnly: boolean = true) => {
    const response = await apiClient.get<APIResponse<Category[]>>(`/categories/?active_only=${activeOnly}`);
    return response.data;
  }
};
