import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  History,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { attemptApi } from '@/features/quiz-runner/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatTime } from '@/features/quiz-runner/utils/timer';
import { cn } from '@/lib/utils/cn';

export const MyAttempts: React.FC = () => {
  const {
    data: response,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['my-attempts-full'],
    queryFn: attemptApi.getMyAttempts
  });

  if (isLoading) return <LoadingState message="Loading your attempt history..." />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const attempts = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <History className="mr-3 h-8 w-8 text-primary" />
          My Attempts
        </h1>
        <p className="text-muted-foreground">Review your performance over time across all quizzes.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {attempts.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <History className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium">No attempts found</h3>
              <p className="text-muted-foreground">You haven't started any quizzes yet.</p>
              <Link to="/quizzes" className="inline-block">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">
                  Browse Available Quizzes
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Quiz</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Score / %</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attempts.map((attempt) => {
                    const isCompleted = attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED';

                    return (
                      <tr key={attempt.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-foreground">{attempt.quiz_title}</p>
                            <p className="text-xs text-muted-foreground">Version {attempt.quiz_version}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                            attempt.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                            attempt.status === 'EXPIRED' ? "bg-red-100 text-red-700" :
                            attempt.status === 'AUTO_SUBMITTED' ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {attempt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isCompleted ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{attempt.score} pts</span>
                              <span className="text-xs text-muted-foreground">{attempt.percentage}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(attempt.started_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isCompleted ? (
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="mr-1.5 h-3.5 w-3.5" />
                              {formatTime(attempt.time_taken_seconds || 0)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isCompleted ? (
                            <Link to={`/attempts/${attempt.id}/result`}>
                              <button className="text-primary hover:text-primary/80 font-bold inline-flex items-center">
                                View Result
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </button>
                            </Link>
                          ) : attempt.status === 'IN_PROGRESS' ? (
                            <Link to={`/attempts/${attempt.id}/runner`}>
                              <button className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md font-bold text-xs inline-flex items-center">
                                Continue
                                <ExternalLink className="ml-1.5 h-3 w-3" />
                              </button>
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
