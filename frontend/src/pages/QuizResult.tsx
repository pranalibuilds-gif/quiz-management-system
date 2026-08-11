import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { attemptApi } from '@/features/quiz-runner/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/features/quiz-runner/utils/timer';

export const QuizResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [expandedQuestion, setExpandedQuestion] = React.useState<string | null>(null);

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['attempt', id],
    queryFn: () => attemptApi.getAttempt(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState message="Fetching results..." />;
  if (isError || !response) return <ErrorState onRetry={refetch} />;

  const attempt = response.data;
  const reviewStatus = response.meta?.review_status;
  const canReview = reviewStatus?.can_review;

  // Logic to determine pass/fail (Assuming backend logic is reflected in results)
  // In a real app, the backend should return is_passed.
  // For now, let's compare with passing_percentage.
  const isPassed = (attempt.percentage ?? 0) >= (attempt.passing_percentage ?? 40);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex gap-2">
            <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                attempt.status === 'AUTO_SUBMITTED' ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
            )}>
                {attempt.status.replace('_', ' ')}
            </span>
        </div>
      </div>

      {/* Result Header */}
      <Card className={cn(
        "text-center border-t-8",
        isPassed ? "border-t-green-500" : "border-t-destructive"
      )}>
        <CardContent className="pt-10 pb-10 space-y-6">
          <div className="flex justify-center">
            {isPassed ? (
              <div className="bg-green-100 p-4 rounded-full">
                <Trophy className="h-16 w-12 text-green-600" />
              </div>
            ) : (
              <div className="bg-destructive/10 p-4 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">
              {isPassed ? "Congratulations!" : "Keep Practicing!"}
            </h1>
            <p className="text-muted-foreground text-lg">
              You scored <span className="font-bold text-foreground">{attempt.percentage}%</span> on
              <span className="block font-semibold text-primary">{attempt.quiz_title}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
            <StatItem label="Score" value={`${attempt.score} / ${attempt.total_questions}`} />
            <StatItem label="Correct" value={attempt.correct_answers ?? 0} icon={<CheckCircle2 className="text-green-500 h-4 w-4" />} />
            <StatItem label="Incorrect" value={attempt.incorrect_answers ?? 0} icon={<XCircle className="text-destructive h-4 w-4" />} />
            <StatItem label="Time Taken" value={formatTime(attempt.time_taken_seconds ?? 0)} icon={<Clock className="text-primary h-4 w-4" />} />
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Answer Review</h2>
          {!canReview && (
            <div className="flex items-center text-sm font-medium text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
              <Lock className="mr-2 h-4 w-4" />
              Review available at: {new Date(reviewStatus?.available_at).toLocaleString()}
            </div>
          )}
        </div>

        {!canReview ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <div className="bg-background p-4 rounded-full border shadow-sm">
                <Clock className="h-10 w-10 text-muted-foreground opacity-40" />
              </div>
              <div className="max-w-xs space-y-2">
                <h3 className="font-semibold text-lg">Answers are Locked</h3>
                <p className="text-sm text-muted-foreground">
                  To maintain the integrity of the assessment, detailed answers and explanations will be revealed 24 hours after completion.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {attempt.questions?.map((q, idx) => {
              const isCorrect = q.options.find(o => o.option_id === q.selected_option_id)?.is_correct;
              const isUnanswered = !q.selected_option_id;
              const isExpanded = expandedQuestion === q.id;

              return (
                <Card key={q.id} className={cn(
                    "overflow-hidden transition-all",
                    isCorrect ? "border-l-4 border-l-green-500" : isUnanswered ? "border-l-4 border-l-muted" : "border-l-4 border-l-destructive"
                )}>
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                    className="w-full text-left p-6 flex justify-between items-start gap-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Question {idx + 1}</span>
                        {isCorrect ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">CORRECT</span>
                        ) : isUnanswered ? (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold">UNANSWERED</span>
                        ) : (
                          <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">INCORRECT</span>
                        )}
                      </div>
                      <p className="font-semibold text-lg">{q.question_text}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="shrink-0" /> : <ChevronDown className="shrink-0" />}
                  </button>

                  {isExpanded && (
                    <CardContent className="bg-muted/5 pt-0 border-t">
                      <div className="space-y-6 pt-6">
                        <div className="grid gap-3">
                          {q.options.map((opt) => {
                            const isSelected = opt.option_id === q.selected_option_id;
                            return (
                              <div
                                key={opt.id}
                                className={cn(
                                  "p-3 rounded-lg border text-sm flex justify-between items-center",
                                  opt.is_correct ? "bg-green-50 border-green-200 text-green-800" :
                                  isSelected ? "bg-destructive/5 border-destructive/20 text-destructive" : "bg-background"
                                )}
                              >
                                <span>{opt.option_text}</span>
                                {opt.is_correct && <CheckCircle2 className="h-4 w-4" />}
                                {isSelected && !opt.is_correct && <XCircle className="h-4 w-4" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <div className="flex items-center text-primary font-bold text-xs uppercase tracking-wider mb-2">
                              <HelpCircle className="mr-2 h-3 w-3" />
                              Explanation
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8">
        <Link to="/quizzes">
            <Button size="lg">Try Another Quiz</Button>
        </Link>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) => (
  <div className="text-center space-y-1">
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
    <div className="flex items-center justify-center gap-1.5">
      {icon}
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);
