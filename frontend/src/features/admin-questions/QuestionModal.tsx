import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { questionSchema, QuestionFormData } from './types';
import { adminQuestionApi } from './api';
import { AttemptQuestion } from '@/types/quiz';
import { ApiError } from '@/lib/api/error';
import { cn } from '@/lib/utils/cn';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  question?: AttemptQuestion | null;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  quizId,
  question
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!question;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: '',
      explanation: '',
      marks: 1,
      order: 0,
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options"
  });

  React.useEffect(() => {
    if (isOpen) {
      if (question) {
        reset({
          text: question.question_text,
          explanation: question.explanation || '',
          marks: question.marks,
          order: question.question_order,
          options: question.options.map(o => ({ text: o.option_text, is_correct: o.is_correct || false }))
        });
      } else {
        reset({
          text: '',
          explanation: '',
          marks: 1,
          order: 0,
          options: [
            { text: '', is_correct: true },
            { text: '', is_correct: false },
          ]
        });
      }
    }
  }, [isOpen, question, reset]);

  const mutation = useMutation({
    mutationFn: (data: QuestionFormData) =>
      isEditing
        ? adminQuestionApi.update(question!.id, data)
        : adminQuestionApi.create(quizId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
      onClose();
    },
  });

  const handleCorrectToggle = (index: number) => {
    const currentOptions = watch("options");
    const updatedOptions = currentOptions.map((opt, i) => ({
      ...opt,
      is_correct: i === index
    }));
    setValue("options", updatedOptions);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Question' : 'Add New Question'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {mutation.isError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {(mutation.error as ApiError).message}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Question Text"
            placeholder="e.g. What is the capital of France?"
            error={errors.text?.message}
            {...register('text')}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Marks"
              type="number"
              step="0.5"
              error={errors.marks?.message}
              {...register('marks')}
            />
            <Input
              label="Canonical Order"
              type="number"
              error={errors.order?.message}
              {...register('order')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Explanation (Optional)</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Explain why the correct answer is right..."
              {...register('explanation')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Options</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ text: '', is_correct: false })}
              disabled={fields.length >= 10}
            >
              <Plus className="mr-1 h-3 w-3" /> Add Option
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleCorrectToggle(index)}
                  className={cn(
                    "mt-2 h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
                    watch(`options.${index}.is_correct`)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-transparent"
                  )}
                >
                  <CheckCircle2 size={14} />
                </button>

                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    error={errors.options?.[index]?.text?.message}
                    {...register(`options.${index}.text`)}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 2}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {errors.options?.root && (
              <p className="text-xs font-medium text-destructive">{errors.options.root.message}</p>
            )}
            {errors.options && !errors.options.root && (
               <p className="text-xs font-medium text-destructive text-center">Please ensure exactly one correct option is selected.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Add Question'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
