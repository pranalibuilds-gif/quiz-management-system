import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { attemptApi } from '../api';
import { calculateRemainingSeconds } from '../utils/timer';
import { Attempt, AttemptStatus } from '@/types/quiz';
import { ApiError } from '@/lib/api/error';

export type RunnerState = 'IDLE' | 'LOADING' | 'IN_PROGRESS' | 'SUBMITTING' | 'COMPLETED' | 'ERROR';

export const useQuizRunner = (attemptId: string, onComplete?: (id: string) => void) => {
    const [runnerState, setRunnerState] = useState<RunnerState>('IDLE');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Use a ref to prevent stale closures in the timer interval
    const isSubmittingRef = useRef(false);

    // 1. Fetch Attempt Data
    const { data: attemptRes, isLoading, isError, error: queryError } = useQuery({
        queryKey: ['attempt', attemptId],
        queryFn: () => attemptApi.getAttempt(attemptId),
        enabled: !!attemptId,
        staleTime: 0, // Always get fresh data for the runner
    });

    const attempt = attemptRes?.data;

    // 2. Submission Mutation
    const submitMutation = useMutation({
        mutationFn: (answers: { question_id: string; option_id: string }[]) =>
            attemptApi.submitAttempt(attemptId, answers),
        onMutate: () => {
            isSubmittingRef.current = true;
            setRunnerState('SUBMITTING');
        },
        onSuccess: (response) => {
            setRunnerState('COMPLETED');
            if (onComplete) onComplete(response.data.id);
        },
        onError: (err: ApiError) => {
            setError(err.message);
            setRunnerState('ERROR');
            isSubmittingRef.current = false;
        }
    });

    const handleSubmit = useCallback(() => {
        if (isSubmittingRef.current || !attempt) return;

        const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
            question_id: qId,
            option_id: oId
        }));

        submitMutation.mutate(answers);
    }, [attempt, selectedAnswers, submitMutation]);

    // 3. Timer Management
    useEffect(() => {
        if (!attempt || attempt.status !== 'IN_PROGRESS' || runnerState !== 'IN_PROGRESS') return;

        const interval = setInterval(() => {
            const remaining = calculateRemainingSeconds(attempt.expires_at);
            setTimeLeft(remaining);

            if (remaining <= 0 && !isSubmittingRef.current) {
                clearInterval(interval);
                handleSubmit(); // Auto-submit on expiration
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [attempt, runnerState, handleSubmit]);

    // 4. Initialization and State Transitions
    useEffect(() => {
        if (isLoading) {
            setRunnerState('LOADING');
        } else if (isError) {
            setRunnerState('ERROR');
            setError((queryError as ApiError)?.message || 'Failed to load attempt');
        } else if (attempt) {
            if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
                setRunnerState('COMPLETED');
            } else if (attempt.status === 'IN_PROGRESS') {
                setRunnerState('IN_PROGRESS');

                // Initialize timer immediately
                setTimeLeft(calculateRemainingSeconds(attempt.expires_at));

                // Load existing answers from snapshot if any (resuming refresh)
                if (attempt.questions) {
                    const initialAnswers: Record<string, string> = {};
                    attempt.questions.forEach(q => {
                        if (q.selected_option_id) {
                            initialAnswers[q.question_id] = q.selected_option_id;
                        }
                    });
                    setSelectedAnswers(initialAnswers);
                }
            } else {
                setRunnerState('ERROR');
                setError('Invalid attempt status');
            }
        }
    }, [attempt, isLoading, isError, queryError]);

    // 5. Navigation & Interaction
    const handleSelectOption = (questionId: string, optionId: string) => {
        if (runnerState !== 'IN_PROGRESS') return;
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const nextQuestion = () => {
        if (!attempt?.questions) return;
        setCurrentQuestionIndex(prev => Math.min(prev + 1, attempt.questions!.length - 1));
    };

    const prevQuestion = () => {
        setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
    };

    const goToQuestion = (index: number) => {
        if (!attempt?.questions) return;
        if (index >= 0 && index < attempt.questions.length) {
            setCurrentQuestionIndex(index);
        }
    };

    return {
        attempt,
        runnerState,
        currentQuestionIndex,
        currentQuestion: attempt?.questions?.[currentQuestionIndex],
        selectedAnswers,
        timeLeft,
        error,
        actions: {
            selectOption: handleSelectOption,
            nextQuestion,
            prevQuestion,
            goToQuestion,
            submit: handleSubmit
        }
    };
};
