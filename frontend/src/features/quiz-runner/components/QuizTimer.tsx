import React from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '../utils/timer';
import { cn } from '@/lib/utils/cn';

interface QuizTimerProps {
  seconds: number;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ seconds }) => {
  const isWarning = seconds < 60; // Less than 1 minute
  const isCritical = seconds < 10; // Less than 10 seconds

  return (
    <div
      className={cn(
        "flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-mono font-bold text-lg transition-colors",
        isCritical ? "bg-destructive/10 border-destructive text-destructive animate-pulse" :
        isWarning ? "bg-yellow-100 border-yellow-500 text-yellow-700" :
        "bg-primary/5 border-primary text-primary"
      )}
      role="timer"
      aria-live={seconds % 10 === 0 || seconds < 10 ? "polite" : "off"}
      aria-atomic="true"
      aria-label={`Time remaining: ${formatTime(seconds)}`}
    >
      <Clock size={20} aria-hidden="true" />
      <span>{formatTime(seconds)}</span>
    </div>
  );
};
