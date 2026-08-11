import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart
} from 'lucide-react';
import { adminAnalyticsApi } from '@/features/admin-analytics/api';
import { quizApi } from '@/features/quiz-browser/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatTime } from '@/features/quiz-runner/utils/timer';
import { cn } from '@/lib/utils/cn';

export const QuizAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: quizRes } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizApi.getQuiz(id!),
    enabled: !!id
  });

  const { data: analyticsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['quiz-analytics', id],
    queryFn: () => apiClient.get(`/analytics/quiz/${id}`).then(res => res.data),
    enabled: !!id
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const quiz = quizRes?.data;
  const stats = analyticsRes?.data.performance;
  const questions = analyticsRes?.data.questions || [];

  return (
    <div className="space-y-8 pb-20">
      <Link to="/admin/quizzes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Quizzes
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics: {quiz?.title}</h1>
        <p className="text-muted-foreground">Deep dive into performance metrics and question-level insights.</p>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Attempts" value={stats?.total_attempts} icon={BarChart} />
        <StatCard title="Pass Rate" value={`${stats?.pass_rate}%`} icon={Target} />
        <StatCard title="Avg. Score" value={`${stats?.average_percentage}%`} icon={TrendingUp} />
        <StatCard title="Avg. Time" value={formatTime(stats?.average_time_seconds || 0)} icon={Clock} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         <StatCard title="Highest Score" value={`${stats?.highest_score} pts`} icon={Trophy} color="text-yellow-500" />
         <StatCard title="Lowest Score" value={`${stats?.lowest_score} pts`} icon={TrendingUp} className="rotate-180" />
      </div>

      {/* Question Performance */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Question Performance</h2>
        <div className="grid gap-4">
          {questions.length === 0 ? (
             <Card className="p-12 text-center text-muted-foreground italic">No attempt data available for these questions yet.</Card>
          ) : (
            questions.map((q: any) => (
              <Card key={q.question_id}>
                <CardContent className="pt-6">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-2">
                         <p className="font-semibold text-lg line-clamp-2">{q.text}</p>
                         <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <span className="flex items-center"><CheckCircle2 className="mr-1 h-3 w-3 text-green-500" /> {q.correct} Correct</span>
                            <span className="flex items-center"><XCircle className="mr-1 h-3 w-3 text-destructive" /> {q.total - q.correct - q.unanswered} Incorrect</span>
                            <span className="flex items-center"><HelpCircle className="mr-1 h-3 w-3" /> {q.unanswered} Unanswered</span>
                         </div>
                      </div>

                      <div className="text-center md:text-right space-y-1">
                         <p className="text-xs font-bold text-muted-foreground uppercase">Success Rate</p>
                         <p className={cn(
                             "text-3xl font-black",
                             q.success_rate >= 70 ? "text-green-600" : q.success_rate >= 40 ? "text-yellow-600" : "text-destructive"
                         )}>{q.success_rate}%</p>
                         <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden mx-auto md:ml-auto">
                            <div
                                className={cn("h-full", q.success_rate >= 70 ? "bg-green-500" : q.success_rate >= 40 ? "bg-yellow-500" : "bg-destructive")}
                                style={{ width: `${q.success_rate}%` }}
                            />
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import apiClient from '@/lib/api/client';

const StatCard = ({ title, value, icon: Icon, color = "text-primary", className = "" }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={cn("h-4 w-4 text-muted-foreground", color, className)} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value ?? 0}</div>
    </CardContent>
  </Card>
);
