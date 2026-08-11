import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Activity,
  TrendingUp,
  Clock,
  UserPlus,
  Send
} from 'lucide-react';
import { adminAnalyticsApi } from '@/features/admin-analytics/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminAnalyticsApi.getDashboardData
  });

  if (isLoading) return <LoadingState message="Fetching system analytics..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const stats = data?.data.overview;
  const activity = data?.data.recent_activity || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide overview and recent activities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Students"
          value={stats?.total_students ?? 0}
          icon={Users}
          description="Registered on platform"
        />
        <StatCard
          title="Quizzes"
          value={stats?.total_quizzes ?? 0}
          icon={BookOpen}
          description={`${stats?.published_quizzes ?? 0} published quizzes`}
        />
        <StatCard
          title="Avg. Performance"
          value={`${stats?.average_percentage ?? 0}%`}
          icon={TrendingUp}
          description="Across all completed attempts"
        />
        <StatCard
          title="Active Attempts"
          value={stats?.active_attempts ?? 0}
          icon={Activity}
          description="In-progress sessions"
        />
        <StatCard
          title="Completed Attempts"
          value={stats?.completed_attempts ?? 0}
          icon={CheckCircle2}
          description="Submitted or auto-submitted"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest registrations and quiz completions.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="space-y-8">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start">
                    <div className="mr-4 mt-1 rounded-full p-2 bg-muted">
                      {item.type === 'REGISTRATION' ? (
                        <UserPlus className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Send className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center pt-1 text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links / System Info (Placeholder for now) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Health and server details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Status</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">Operational</span>
             </div>
             <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Environment</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Development</span>
             </div>
             <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Version</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);
