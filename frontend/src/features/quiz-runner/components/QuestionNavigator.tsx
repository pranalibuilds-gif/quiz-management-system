import React from 'react';
import { cn } from '@/lib/utils/cn';

interface QuestionNavigatorProps {
  total: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onNavigate: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  total,
  currentIndex,
  answeredIndices,
  onNavigate
}) => {
  return (
    <nav
      className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2"
      aria-label="Question navigation"
    >
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === currentIndex;
        const isAnswered = answeredIndices.has(i);
        const questionNumber = i + 1;

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Question ${questionNumber}${isAnswered ? " (Answered)" : ""}`}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold transition-all border-2",
              isCurrent ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2" :
              isAnswered ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" :
              "border-muted bg-background text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {questionNumber}
          </button>
        );
      })}
    </nav>
  );
};
