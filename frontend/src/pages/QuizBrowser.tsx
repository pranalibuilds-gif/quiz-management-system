import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X } from 'lucide-react';
import { quizApi } from '@/features/quiz-browser/api';
import { QuizCard } from '@/features/quiz-browser/QuizCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export const QuizBrowser: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchSearchQuery] = useState('');

  const {
    data: categoriesRes,
    isLoading: isCatsLoading
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => quizApi.getCategories(true)
  });

  const {
    data: quizzesRes,
    isLoading: isQuizzesLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['quizzes', selectedCategory],
    queryFn: () => quizApi.getQuizzes({
      category_id: selectedCategory,
      published_only: true
    })
  });

  if (isQuizzesLoading && !quizzesRes) return <LoadingState message="Fetching quizzes..." />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const categories = categoriesRes?.data || [];
  const allQuizzes = quizzesRes?.data || [];

  const filteredQuizzes = allQuizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Quizzes</h1>
          <p className="text-muted-foreground">Find the perfect challenge for your skills.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button
            variant={selectedCategory === undefined ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(undefined)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'primary' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <Filter className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
          <h3 className="text-lg font-semibold">No quizzes found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchSearchQuery('');
                setSelectedCategory(undefined);
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
};
