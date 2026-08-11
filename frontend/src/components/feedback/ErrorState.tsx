import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  extraAction?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Something went wrong. Please try again.",
  onRetry,
  extraAction
}) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
    <AlertCircle className="h-12 w-12 text-destructive" />
    <div className="space-y-1">
      <p className="font-semibold text-lg">Error</p>
      <p className="text-muted-foreground">{message}</p>
    </div>
    <div className="flex gap-2">
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
      {extraAction}
    </div>
  </div>
);
