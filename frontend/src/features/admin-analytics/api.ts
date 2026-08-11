import apiClient from '@/lib/api/client';
import { APIResponse } from '@/types/auth';

export interface AdminOverview {
  total_students: number;
  total_quizzes: number;
  published_quizzes: number;
  active_attempts: number;
  completed_attempts: number;
  average_percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'REGISTRATION' | 'SUBMISSION' | 'QUIZ_PUBLISHED';
  title: string;
  description: string;
  timestamp: string;
}

export interface AdminDashboardData {
  overview: AdminOverview;
  recent_activity: RecentActivity[];
}

export const adminAnalyticsApi = {
  getDashboardData: async () => {
    const response = await apiClient.get<APIResponse<AdminDashboardData>>('/analytics/overview');
    return response.data;
  }
};
