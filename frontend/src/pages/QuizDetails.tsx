import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, Trophy, BarChart, AlertTriangle, ArrowLeft, PlayCircle, History } from 'lucide-react';
import { quizApi } from '@/features/quiz-browser/api';
import { attemptApi } from '@/features/quiz-runner/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export const QuizDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: quizRes,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizApi.getQuiz(id!),
    enabled: !!id
  });

  const startMutation = useMutation({
    mutationFn: () => attemptApi.startAttempt(id!),
    onSuccess: (res) => {
      navigate(`/attempts/${res.data.id}/runner`);
    }
  });

  if (isLoading) return <LoadingState />;
  if (isError || !quizRes) return <ErrorState onRetry={refetch} />;

  const quiz = quizRes.data;

  return (
    <div className="space-y-6">
      <Link to="/quizzes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Quizzes
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video w-full bg-muted overflow-hidden rounded-t-lg">
              {quiz.thumbnail_path ? (
                <img
                  src={`http://localhost:8000/${quiz.thumbnail_path}`}
                  alt={quiz.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                  <Trophy size={80} className="opacity-20" />
                </div>
              )}
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  v{quiz.version}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  quiz.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                  quiz.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {quiz.difficulty}
                </span>
              </div>
              <CardTitle className="text-3xl">{quiz.title}</CardTitle>
              <CardDescription className="text-base">
                {quiz.description || "No description provided for this quiz."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                <DetailItem icon={Clock} label="Duration" value={`${quiz.duration_minutes}m`} />
                <DetailItem icon={BarChart} label="Pass Score" value={`${quiz.passing_percentage}%`} />
                <DetailItem icon={PlayCircle} label="Max Attempts" value={quiz.maximum_attempts} />
                <DetailItem icon={AlertTriangle} label="Neg. Marks" value={quiz.negative_marking > 0 ? `-${quiz.negative_marking}` : "None"} />
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-lg">Quiz Rules</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>You must complete the quiz within the allotted time.</li>
                  <li>Refreshing the browser will end your current attempt.</li>
                  <li>Once submitted, you cannot change your answers.</li>
                  <li>Results will be available immediately after submission.</li>
                  {quiz.negative_marking > 0 && (
                    <li className="text-destructive font-medium">Warning: Negative marking is enabled for this quiz.</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ready to start?</CardTitle>
              <CardDescription>
                Ensure you have a stable internet connection before beginning.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full h-12 text-lg"
                onClick={() => startMutation.mutate()}
                isLoading={startMutation.isPending}
              >
                Start Quiz
              </Button>
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                Remaining attempts: ?
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center">
                <History className="mr-2 h-4 w-4" />
                Your History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground italic">
                You haven't attempted this quiz yet.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/attempts" className="text-xs text-primary hover:underline">
                View all my attempts
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
  <div className="space-y-1">
    <div className="flex items-center text-xs text-muted-foreground uppercase font-bold tracking-wider">
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);
