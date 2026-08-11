import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Info, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { quizFormSchema, QuizFormData } from './types';
import { adminQuizApi } from './api';
import { quizApi } from '../quiz-browser/api';
import { Quiz } from '@/types/quiz';
import { ApiError } from '@/lib/api/error';
import { ThumbnailUploader } from './ThumbnailUploader';

interface QuizFormProps {
  initialData?: Quiz | null;
}

export const QuizForm: React.FC<QuizFormProps> = ({ initialData }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEditing = !!initialData;
  const isPublished = initialData?.status === 'PUBLISHED';

  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-active'],
    queryFn: () => quizApi.getCategories(true)
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      category_id: initialData.category_id,
      difficulty: initialData.difficulty,
      duration_minutes: initialData.duration_minutes,
      passing_percentage: initialData.passing_percentage,
      maximum_attempts: initialData.maximum_attempts,
      negative_marking: initialData.negative_marking,
      randomize_questions: initialData.randomize_questions,
      randomize_options: initialData.randomize_options,
    } : {
      difficulty: 'MEDIUM',
      duration_minutes: 30,
      passing_percentage: 40,
      maximum_attempts: 1,
      negative_marking: 0,
      randomize_questions: true,
      randomize_options: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: QuizFormData) =>
      isEditing
        ? adminQuizApi.update(initialData!.id, data)
        : adminQuizApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });

      // If versioning was triggered (New ID returned), we should navigate to the new draft
      if (isPublished && res.data.id !== initialData!.id) {
         navigate(`/admin/quizzes/${res.data.id}/edit`, { replace: true });
      } else if (!isEditing) {
         navigate(`/admin/quizzes/${res.data.id}/edit`);
      }
    },
  });

  const onSubmit = (data: QuizFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form id="quiz-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isPublished && (
            <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              <Info className="h-5 w-5 mr-3 shrink-0" />
              <div>
                <p className="font-bold">Versioning Alert</p>
                <p>This quiz is currently <strong>PUBLISHED</strong>. Saving any changes will automatically create <strong>Version {initialData.version + 1} (Draft)</strong>. The current version will remain available to students until you publish the new one.</p>
              </div>
            </div>
          )}

          {mutation.isError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              {(mutation.error as ApiError).message}
            </div>
          )}

          <div className="grid gap-4 bg-card border p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-2">Basic Information</h3>
            <Input
              label="Quiz Title"
              placeholder="e.g. Python Fundamentals"
              error={errors.title?.message}
              {...register('title')}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none">Description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                placeholder="What will students learn from this assessment?"
                {...register('description')}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full bg-background border rounded-md p-2 text-sm"
                  {...register('category_id')}
                >
                  <option value="">Select Category</option>
                  {categoriesRes?.data.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Difficulty</label>
                <select className="w-full bg-background border rounded-md p-2 text-sm" {...register('difficulty')}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-card border p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-2">Scoring & Configuration</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Duration (Minutes)"
                type="number"
                error={errors.duration_minutes?.message}
                {...register('duration_minutes')}
              />
              <Input
                label="Passing Percentage (%)"
                type="number"
                error={errors.passing_percentage?.message}
                {...register('passing_percentage')}
              />
              <Input
                label="Max Attempts"
                type="number"
                error={errors.maximum_attempts?.message}
                {...register('maximum_attempts')}
              />
              <Input
                label="Negative Marking (Points per wrong answer)"
                type="number"
                step="0.25"
                error={errors.negative_marking?.message}
                {...register('negative_marking')}
              />
            </div>

            <div className="flex gap-6 pt-2">
               <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" {...register('randomize_questions')} className="h-4 w-4 rounded border-gray-300 text-primary" />
                  <span className="text-sm font-medium">Randomize Questions</span>
               </label>
               <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" {...register('randomize_options')} className="h-4 w-4 rounded border-gray-300 text-primary" />
                  <span className="text-sm font-medium">Randomize Options</span>
               </label>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button
               form="quiz-form"
               type="submit"
               className="w-full"
               isLoading={mutation.isPending}
             >
               <Save className="mr-2 h-4 w-4" />
               {isPublished ? 'Create New Version' : isEditing ? 'Save Changes' : 'Create Quiz'}
             </Button>
             <Button variant="outline" className="w-full" onClick={() => navigate('/admin/quizzes')}>
               Cancel
             </Button>
          </CardContent>
        </Card>

        {isEditing && (
           <Card>
             <CardContent className="pt-6">
               <ThumbnailUploader
                 quizId={initialData.id}
                 currentThumbnail={initialData.thumbnail_path}
               />
             </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
};
