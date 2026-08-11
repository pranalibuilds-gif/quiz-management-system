import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import { useQuizRunner } from '@/features/quiz-runner/hooks/useQuizRunner';
import { QuizTimer } from '@/features/quiz-runner/components/QuizTimer';
import { QuestionNavigator } from '@/features/quiz-runner/components/QuestionNavigator';
import { OptionList } from '@/features/quiz-runner/components/OptionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export const QuizRunner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questionRef = React.useRef<HTMLHeadingElement>(null);

  const {
    attempt,
    runnerState,
    currentQuestionIndex,
    currentQuestion,
    selectedAnswers,
    timeLeft,
    error,
    actions
  } = useQuizRunner(id!, (attemptId) => {
    navigate(`/attempts/${attemptId}/result`, { replace: true });
  });

  // Focus the question text when navigating
  React.useEffect(() => {
    if (currentQuestionIndex !== undefined && questionRef.current) {
      questionRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const answeredIndices = useMemo(() => {
    if (!attempt?.questions) return new Set<number>();
    const indices = new Set<number>();
    attempt.questions.forEach((q, i) => {
      if (selectedAnswers[q.question_id]) {
        indices.add(i);
      }
    });
    return indices;
  }, [attempt, selectedAnswers]);

  if (runnerState === 'LOADING') return <LoadingState message="Preparing your attempt..." />;
  if (runnerState === 'ERROR') return (
    <ErrorState
      message={error || 'Failed to load quiz'}
      extraAction={
        <Button onClick={() => navigate('/dashboard')} variant="ghost">
          Back to Dashboard
        </Button>
      }
    />
  );
  if (runnerState === 'COMPLETED') {
    // If finished, redirect to results page (Task 8.10)
    // For now, show a simple message
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h1 className="text-3xl font-bold">Quiz Completed</h1>
        <p className="text-muted-foreground">Your attempt has been successfully submitted.</p>
        <Button onClick={() => navigate('/attempts')}>View My Attempts</Button>
      </div>
    );
  }

  if (!attempt || !currentQuestion) return null;

  const isLastQuestion = currentQuestionIndex === (attempt.questions?.length ?? 0) - 1;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = attempt.total_questions;

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Sidebar - Desktop Only */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Answered</span>
              <span className="font-bold">{answeredCount} / {totalQuestions}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>

            <div className="pt-4">
              <QuestionNavigator
                total={totalQuestions}
                currentIndex={currentQuestionIndex}
                answeredIndices={answeredIndices}
                onNavigate={actions.goToQuestion}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Runner Area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Header with Timer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg font-bold">
              Q{currentQuestionIndex + 1}
            </div>
            <h2 className="font-bold text-lg leading-tight line-clamp-1">{attempt.quiz_title}</h2>
          </div>
          <QuizTimer seconds={timeLeft} />
        </div>

        <Card className="border-2 shadow-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                 Question {currentQuestionIndex + 1} of {totalQuestions}
               </span>
               <span className="text-xs font-bold text-primary px-2 py-1 rounded bg-primary/10">
                 {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
               </span>
            </div>
            <CardTitle
              ref={questionRef}
              tabIndex={-1}
              className="text-xl md:text-2xl font-semibold leading-relaxed outline-none focus:ring-0"
            >
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptionList
              options={currentQuestion.options}
              selectedOptionId={selectedAnswers[currentQuestion.question_id]}
              onSelect={(optId) => actions.selectOption(currentQuestion.question_id, optId)}
              disabled={runnerState === 'SUBMITTING'}
            />
          </CardContent>
          <CardFooter className="flex justify-between pt-6 border-t bg-muted/5">
            <Button
              variant="outline"
              onClick={actions.prevQuestion}
              disabled={currentQuestionIndex === 0 || runnerState === 'SUBMITTING'}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            <div className="flex space-x-3">
              {isLastQuestion ? (
                <Button
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700 border-green-600"
                  onClick={actions.submit}
                  isLoading={runnerState === 'SUBMITTING'}
                >
                  <Send className="mr-2 h-4 w-4" /> Submit Quiz
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={actions.nextQuestion}
                  disabled={runnerState === 'SUBMITTING'}
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Warning if questions are unanswered */}
        {isLastQuestion && answeredCount < totalQuestions && (
          <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
            <p>You still have <strong>{totalQuestions - answeredCount} unanswered</strong> questions. Are you sure you want to submit?</p>
          </div>
        )}
      </div>
    </div>
  );
};
