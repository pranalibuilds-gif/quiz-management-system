import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';
import { Attempt } from '@/types/quiz';

export const attemptApi = {
  getMyAttempts: async () => {
    const response = await apiClient.get<APIResponse<Attempt[]>>('/attempts/');
    return response.data;
  },

  getAttempt: async (id: string) => {
    const response = await apiClient.get<APIResponse<Attempt>>(`/attempts/${id}`);
    return response.data;
  },

  startAttempt: async (quizId: string) => {
    const response = await apiClient.post<APIResponse<any>>(`/attempts/${quizId}/start`);
    return response.data;
  },

  submitAttempt: async (attemptId: string, answers: any) => {
    const response = await apiClient.post<APIResponse<Attempt>>(`/attempts/${attemptId}/submit`, { answers });
    return response.data;
  },

  saveAnswer: async (attemptId: string, questionId: string, optionId: string) => {
    const response = await apiClient.patch<APIResponse<boolean>>(`/attempts/${attemptId}/questions/${questionId}/answer`, { option_id: optionId });
    return response.data;
  }
};
