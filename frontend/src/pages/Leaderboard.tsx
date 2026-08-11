import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Globe, Target, Medal, Timer, Award } from 'lucide-react';
import { leaderboardApi } from '@/features/leaderboard/api';
import { quizApi } from '@/features/quiz-browser/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/features/quiz-runner/utils/timer';

export const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'quiz'>('global');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // 1. Fetch available quizzes for the dropdown
  const { data: quizzesRes } = useQuery({
    queryKey: ['quizzes-mini'],
    queryFn: () => quizApi.getQuizzes()
  });

  // 2. Fetch Global Leaderboard
  const {
    data: globalRes,
    isLoading: isGlobalLoading,
    isError: isGlobalError,
    refetch: refetchGlobal
  } = useQuery({
    queryKey: ['leaderboard-global'],
    queryFn: () => leaderboardApi.getGlobalLeaderboard(),
    enabled: activeTab === 'global'
  });

  // 3. Fetch Quiz Leaderboard
  const {
    data: quizRes,
    isLoading: isQuizLoading,
    isError: isQuizError,
    refetch: refetchQuiz
  } = useQuery({
    queryKey: ['leaderboard-quiz', selectedQuizId],
    queryFn: () => leaderboardApi.getQuizLeaderboard(selectedQuizId!),
    enabled: activeTab === 'quiz' && !!selectedQuizId
  });

  const { data: myRankRes } = useQuery({
    queryKey: ['my-rank'],
    queryFn: leaderboardApi.getMyRank,
    enabled: activeTab === 'global'
  });

  const quizzes = quizzesRes?.data || [];
  const entries = activeTab === 'global' ? (globalRes?.data || []) : (quizRes?.data || []);
  const isLoading = activeTab === 'global' ? isGlobalLoading : isQuizLoading;
  const isError = activeTab === 'global' ? isGlobalError : isQuizError;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">See how you stack up against other learners on the platform.</p>
      </div>

      <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg w-full max-w-md">
        <button
          onClick={() => setActiveTab('global')}
          className={cn(
            "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
            activeTab === 'global' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe className="mr-2 h-4 w-4" />
          Global Rankings
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={cn(
            "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
            activeTab === 'quiz' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Target className="mr-2 h-4 w-4" />
          Per Quiz
        </button>
      </div>

      {activeTab === 'global' && myRankRes?.data && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Medal className="text-primary h-6 w-6 mr-3" />
            <div>
              <p className="text-sm font-medium text-primary">Your Global Position</p>
              <p className="text-2xl font-bold text-primary-foreground">Rank #{myRankRes.data}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Top of the pack</p>
            <p className="text-sm font-semibold">Keep it up!</p>
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Select a Quiz</label>
          <select
            className="w-full bg-background border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setSelectedQuizId(e.target.value)}
            value={selectedQuizId || ''}
          >
            <option value="" disabled>Choose a quiz...</option>
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'global' ? 'All-Time Champions' : 'Top Performers'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'global'
              ? 'Ranked by average performance percentage across all attempted quizzes.'
              : 'Ranked by highest score, with time taken as the tie-breaker.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {activeTab === 'quiz' && !selectedQuizId ? (
            <div className="p-12 text-center text-muted-foreground italic">
              Please select a quiz to see its rankings.
            </div>
          ) : isLoading ? (
            <LoadingState message="Fetching rankings..." />
          ) : isError ? (
            <ErrorState onRetry={activeTab === 'global' ? refetchGlobal : refetchQuiz} />
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No entries found yet. Be the first to top the chart!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-20">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4 text-center">
                        {activeTab === 'global' ? 'Avg. Percentage' : 'Best Score'}
                    </th>
                    {activeTab === 'quiz' && <th className="px-6 py-4 text-center">Time Taken</th>}
                    <th className="px-6 py-4 text-right">
                        {activeTab === 'global' ? 'Quizzes Passed' : 'Achieved At'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry) => {
                    const isTopThree = entry.rank <= 3;
                    return (
                      <tr key={entry.username} className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isTopThree && "bg-primary/5"
                      )}>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            {entry.rank === 1 ? <Medal className="text-yellow-500 h-5 w-5" /> :
                             entry.rank === 2 ? <Medal className="text-slate-400 h-5 w-5" /> :
                             entry.rank === 3 ? <Medal className="text-amber-600 h-5 w-5" /> :
                             <span className="font-mono text-muted-foreground">{entry.rank}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3 text-xs font-bold text-muted-foreground">
                                {entry.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground leading-none">{entry.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">@{entry.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-primary">
                          {activeTab === 'global' ? `${entry.average_percentage}%` : `${entry.score} pts`}
                        </td>
                        {activeTab === 'quiz' && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center text-muted-foreground text-xs font-medium">
                              <Timer className="mr-1 h-3.5 w-3.5" />
                              {formatTime(entry.time_taken || 0)}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-right text-xs text-muted-foreground font-medium">
                          {activeTab === 'global'
                            ? <div className="flex items-center justify-end">
                                <Award className="mr-1 h-3.5 w-3.5 text-primary" />
                                {entry.total_attempts} attempts
                              </div>
                            : new Date(entry.achieved_at!).toLocaleDateString()}
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
