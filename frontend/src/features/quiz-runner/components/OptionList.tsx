import React from 'react';
import { AttemptOption } from '@/types/quiz';
import { cn } from '@/lib/utils/cn';

interface OptionListProps {
  options: AttemptOption[];
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export const OptionList: React.FC<OptionListProps> = ({
  options,
  selectedOptionId,
  onSelect,
  disabled
}) => {
  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = option.option_id === selectedOptionId;
        const label = String.fromCharCode(65 + index); // A, B, C, D

        return (
          <button
            key={option.id}
            disabled={disabled}
            onClick={() => onSelect(option.option_id)}
            className={cn(
              "flex w-full items-center text-left p-4 rounded-xl border-2 transition-all group",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                : "border-muted bg-background hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold border-2 mr-4 transition-colors",
              isSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary group-hover:text-primary"
            )}>
              {label}
            </div>
            <span className={cn(
              "font-medium leading-snug",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {option.option_text}
            </span>
          </button>
        );
      })}
    </div>
  );
};
