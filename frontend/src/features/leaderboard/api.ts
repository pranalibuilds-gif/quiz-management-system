import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  score?: number;
  percentage?: number;
  average_percentage?: number;
  time_taken?: number;
  achieved_at?: string;
  total_attempts?: number;
}

export const leaderboardApi = {
  getGlobalLeaderboard: async (limit: number = 10) => {
    const response = await apiClient.get<APIResponse<LeaderboardEntry[]>>(`/leaderboard/global?limit=${limit}`);
    return response.data;
  },

  getQuizLeaderboard: async (quizId: string, limit: number = 10) => {
    const response = await apiClient.get<APIResponse<LeaderboardEntry[]>>(`/leaderboard/quiz/${quizId}?limit=${limit}`);
    return response.data;
  },

  getMyRank: async () => {
    const response = await apiClient.get<APIResponse<number | null>>('/leaderboard/me');
    return response.data;
  }
};
