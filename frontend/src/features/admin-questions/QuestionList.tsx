import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, GripVertical, CheckCircle2, HelpCircle } from 'lucide-react';

import { adminQuestionApi } from './api';
import { QuestionModal } from './QuestionModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils/cn';

interface QuestionListProps {
  quizId: string;
  isReadOnly?: boolean;
}

export const QuestionList: React.FC<QuestionListProps> = ({ quizId, isReadOnly }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['questions', quizId],
    queryFn: () => adminQuestionApi.list(quizId),
  });

  const deleteMutation = useMutation({
    mutationFn: adminQuestionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
    },
  });

  if (isLoading) return <LoadingState message="Loading question bank..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const questions = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Question Bank ({questions.length})</h2>
        {!isReadOnly && (
          <Button onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <HelpCircle className="h-12 w-12 opacity-20 mb-4" />
            <p>No questions added to this quiz version yet.</p>
            {!isReadOnly && <p className="text-sm mt-1">Start building your assessment by adding your first question.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id} className="group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start">
                  <div className="w-12 bg-muted/50 self-stretch flex items-center justify-center border-r group-hover:bg-primary/5 transition-colors">
                    <span className="font-mono font-bold text-muted-foreground">#{q.question_order || idx + 1}</span>
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                             {q.marks} Mark{q.marks !== 1 ? 's' : ''}
                           </span>
                        </div>
                        <p className="font-semibold text-lg">{q.question_text}</p>
                      </div>

                      {!isReadOnly && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }}>
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => window.confirm("Delete this question?") && deleteMutation.mutate(q.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center p-3 rounded-lg border text-sm",
                            opt.is_correct ? "bg-green-50 border-green-200 text-green-700" : "bg-background"
                          )}
                        >
                          <span className="mr-3 font-bold opacity-40">{String.fromCharCode(65 + optIdx)}</span>
                          <span className="flex-1">{opt.option_text}</span>
                          {opt.is_correct && <CheckCircle2 size={16} className="ml-2 shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                       <div className="mt-4 p-3 bg-muted/30 rounded text-xs text-muted-foreground flex">
                          <HelpCircle className="h-3.5 w-3.5 mr-2 shrink-0 mt-0.5" />
                          <p><span className="font-bold uppercase mr-1">Explanation:</span> {q.explanation}</p>
                       </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <QuestionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          quizId={quizId}
          question={editingQuestion}
        />
      )}
    </div>
  );
};
