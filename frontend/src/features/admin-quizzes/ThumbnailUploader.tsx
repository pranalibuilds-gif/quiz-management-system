import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQuizApi } from './api';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/error';

interface ThumbnailUploaderProps {
  quizId: string;
  currentThumbnail?: string;
}

export const ThumbnailUploader: React.FC<ThumbnailUploaderProps> = ({ quizId, currentThumbnail }) => {
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => adminQuizApi.uploadThumbnail(quizId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      setError(null);
    },
    onError: (err: ApiError) => {
      setError(err.message);
    }
  });

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit');
      return;
    }
    mutation.mutate(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium leading-none">Quiz Thumbnail</label>

      {currentThumbnail && !mutation.isPending && (
        <div className="relative aspect-video w-full max-w-sm rounded-lg border overflow-hidden group">
          <img
            src={`http://localhost:8000/${currentThumbnail}`}
            alt="Thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-xs font-bold">Replace Image</p>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center w-full max-w-sm aspect-video rounded-lg border-2 border-dashed transition-all
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 bg-muted/5'}
          ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/10'}
        `}
      >
        {mutation.isPending ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-center px-4">
              <p className="text-sm font-medium">Click or drag image to upload</p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WEBP (Max 2MB)</p>
            </div>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              accept="image/*"
            />
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center text-xs text-destructive font-medium">
          <AlertCircle className="mr-1 h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
};
