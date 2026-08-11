import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, FileText, CheckCircle, Clock } from 'lucide-react';
import { attemptApi } from '@/features/quiz-runner/api';
import { quizApi } from '@/features/quiz-browser/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/features/auth/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const {
    data: attemptsRes,
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
    refetch: refetchAttempts
  } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: attemptApi.getMyAttempts
  });

  const {
    data: quizzesRes,
    isLoading: isQuizzesLoading,
    isError: isQuizzesError
  } = useQuery({
    queryKey: ['available-quizzes'],
    queryFn: () => quizApi.getQuizzes({ published_only: true })
  });

  if (isAttemptsLoading || isQuizzesLoading) return <LoadingState />;
  if (isAttemptsError || isQuizzesError) return <ErrorState onRetry={refetchAttempts} />;

  const attempts = attemptsRes?.data || [];
  const availableQuizzes = quizzesRes?.data || [];

  const stats = {
    total: attempts.length,
    completed: attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED').length,
    average: attempts.length > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / attempts.length)
      : 0,
    inProgress: attempts.filter(a => a.status === 'IN_PROGRESS').length
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.full_name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Quizzes Attempted" value={stats.total} icon={FileText} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} />
        <StatCard title="Average Score" value={`${stats.average}%`} icon={LayoutDashboard} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent attempts found.</p>
            ) : (
              <ul className="space-y-4">
                {attempts.slice(0, 5).map((attempt) => (
                  <li key={attempt.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{attempt.quiz_title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(attempt.started_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{attempt.score ?? 0} pts</p>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        attempt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {attempt.status.replace('_', ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {availableQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new quizzes available right now.</p>
            ) : (
              <ul className="space-y-4">
                {availableQuizzes.slice(0, 5).map((quiz) => (
                  <li key={quiz.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">{quiz.difficulty} • {quiz.duration_minutes} mins</p>
                    </div>
                    <button className="text-primary text-sm font-medium hover:underline">View</button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: any }> = ({ title, value, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
