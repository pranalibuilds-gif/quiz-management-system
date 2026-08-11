import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';
import { AttemptQuestion } from '@/types/quiz';
import { QuestionFormData } from './types';

export const adminQuestionApi = {
  list: async (quizId: string) => {
    const response = await apiClient.get<APIResponse<AttemptQuestion[]>>(`/quizzes/${quizId}/questions`);
    return response.data;
  },

  create: async (quizId: string, data: QuestionFormData) => {
    const response = await apiClient.post<APIResponse<AttemptQuestion>>(`/quizzes/${quizId}/questions`, data);
    return response.data;
  },

  update: async (questionId: string, data: Partial<QuestionFormData>) => {
    const response = await apiClient.patch<APIResponse<AttemptQuestion>>(`/quizzes/questions/${questionId}`, data);
    return response.data;
  },

  delete: async (questionId: string) => {
    const response = await apiClient.delete<APIResponse<boolean>>(`/quizzes/questions/${questionId}`);
    return response.data;
  }
};
