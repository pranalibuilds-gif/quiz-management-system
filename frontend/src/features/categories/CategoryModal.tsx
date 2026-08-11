import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoriesApi } from './api';
import { categorySchema, CategoryFormData } from './types';
import { Category } from '@/types/quiz';
import { ApiError } from '@/lib/api/error';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category || {
      name: '',
      description: '',
      is_active: true,
    },
  });

  // Reset form when modal opens with a category or for a new one
  React.useEffect(() => {
    if (isOpen) {
      reset(category || { name: '', description: '', is_active: true });
    }
  }, [isOpen, category, reset]);

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      isEditing
        ? categoriesApi.update(category!.id, data)
        : categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      onClose();
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Create Category'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mutation.isError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {(mutation.error as ApiError).message}
          </div>
        )}

        <Input
          label="Category Name"
          placeholder="e.g. Programming, Mathematics"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium leading-none">Description</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="What kind of quizzes belong here?"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium leading-none">
            Category is active and visible to students
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
