import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { adminQuizApi } from '@/features/admin-quizzes/api';
import { quizApi } from '@/features/quiz-browser/api';
import { QuizForm } from '@/features/admin-quizzes/QuizForm';
import { QuestionList } from '@/features/admin-questions/QuestionList';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export const EditQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizApi.getQuiz(id!),
    enabled: !!id,
  });

  if (id && isLoading) return <LoadingState />;
  if (id && (isError || !data)) return <ErrorState onRetry={() => refetch()} />;

  const quiz = data?.data || null;
  const isReadOnly = quiz?.status === 'ARCHIVED';

  return (
    <div className="space-y-10 pb-20">
      <div className="space-y-6">
        <Link to="/admin/quizzes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quiz Management
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <FileText className="mr-3 h-8 w-8 text-primary" />
              {id ? `Edit Quiz: ${quiz?.title}` : 'Create New Quiz'}
            </h1>
            <p className="text-muted-foreground">Configure quiz settings, metadata, and assets.</p>
          </div>

          {quiz && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                quiz.status === 'PUBLISHED' ? "bg-green-100 text-green-700" :
                quiz.status === 'DRAFT' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
              )}>
                {quiz.status}
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">v{quiz.version}</span>
            </div>
          )}
        </div>

        <QuizForm initialData={quiz} />
      </div>

      {quiz && (
        <div className="pt-8 border-t">
          <QuestionList quizId={quiz.id} isReadOnly={isReadOnly} />
        </div>
      )}
    </div>
  );
};
