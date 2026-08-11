import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { adminQuizApi } from '@/features/admin-quizzes/api';
import { quizApi } from '@/features/quiz-browser/api';
import { QuizForm } from '@/features/admin-quizzes/QuizForm';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export const EditQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizApi.getQuiz(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const quiz = data?.data;

  return (
    <div className="space-y-6">
      <Link to="/admin/quizzes" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Quiz Management
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <FileText className="mr-3 h-8 w-8 text-primary" />
          {id ? `Edit Quiz: ${quiz?.title}` : 'Create New Quiz'}
        </h1>
        <p className="text-muted-foreground">Configure quiz settings, metadata, and assets.</p>
      </div>

      <QuizForm initialData={quiz} />
    </div>
  );
};
