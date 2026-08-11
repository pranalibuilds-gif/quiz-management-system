import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  Archive,
  Trash2,
  MoreVertical,
  Clock,
  BarChart,
  Trophy
} from 'lucide-react';
import { adminQuizApi, QuizAdminFilters } from '@/features/admin-quizzes/api';
import { quizApi } from '@/features/quiz-browser/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { QuizStatus, DifficultyLevel } from '@/types/quiz';
import { cn } from '@/lib/utils/cn';

export const QuizManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<QuizAdminFilters>({
    skip: 0,
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Categories for Filter
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories-all'],
    queryFn: () => quizApi.getCategories(false)
  });

  // 2. Fetch Quizzes (Server-side filtering)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-quizzes', filters],
    queryFn: () => adminQuizApi.list(filters),
  });

  const publishMutation = useMutation({
    mutationFn: adminQuizApi.publish,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] })
  });

  const archiveMutation = useMutation({
    mutationFn: adminQuizApi.archive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] })
  });

  if (isLoading && !data) return <LoadingState message="Loading assessments..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const categories = categoriesRes?.data || [];
  const quizzes = data?.data || [];

  const handleFilterChange = (key: keyof QuizAdminFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'ALL' ? undefined : value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FileText className="mr-3 h-8 w-8 text-primary" />
            Quiz Management
          </h1>
          <p className="text-muted-foreground">Manage assessmet metadata, lifecycle, and questions.</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Status</label>
               <select
                 className="w-full bg-background border rounded-md p-2 text-sm"
                 onChange={(e) => handleFilterChange('status', e.target.value as QuizStatus)}
                 value={filters.status || 'ALL'}
               >
                 <option value="ALL">All Statuses</option>
                 <option value="DRAFT">Draft</option>
                 <option value="PUBLISHED">Published</option>
                 <option value="ARCHIVED">Archived</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Category</label>
               <select
                 className="w-full bg-background border rounded-md p-2 text-sm"
                 onChange={(e) => handleFilterChange('category_id', e.target.value)}
                 value={filters.category_id || 'ALL'}
               >
                 <option value="ALL">All Categories</option>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Difficulty</label>
               <select
                 className="w-full bg-background border rounded-md p-2 text-sm"
                 onChange={(e) => handleFilterChange('difficulty', e.target.value as DifficultyLevel)}
                 value={filters.difficulty || 'ALL'}
               >
                 <option value="ALL">All Levels</option>
                 <option value="EASY">Easy</option>
                 <option value="MEDIUM">Medium</option>
                 <option value="HARD">Hard</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Search</label>
               <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Quick find..."
                   className="pl-9 h-9"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Table */}
      <Card>
        <CardContent className="p-0">
          {quizzes.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">No quizzes found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Quiz Detail</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Config</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            {quiz.thumbnail_path ? (
                              <img src={`http://localhost:8000/${quiz.thumbnail_path}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20"><Trophy size={20} /></div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground leading-none mb-1">{quiz.title}</div>
                            <div className="flex items-center text-[10px] text-muted-foreground space-x-2">
                                <span className="font-mono uppercase">v{quiz.version}</span>
                                <span>•</span>
                                <span>{quiz.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                          {categories.find(c => c.id === quiz.category_id)?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          quiz.status === 'PUBLISHED' ? "bg-green-100 text-green-700" :
                          quiz.status === 'DRAFT' ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {quiz.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                           <div className="flex items-center"><Clock size={10} className="mr-1" /> {quiz.duration_minutes}m</div>
                           <div className="flex items-center"><BarChart size={10} className="mr-1" /> {quiz.passing_percentage}% pass</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" title="Edit Metadata"><Edit size={16} /></Button>
                          {quiz.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => publishMutation.mutate(quiz.id)}
                              isLoading={publishMutation.isPending}
                              title="Publish Quiz"
                            >
                              <Send size={16} />
                            </Button>
                          )}
                          {quiz.status === 'PUBLISHED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-600 hover:bg-yellow-50"
                              onClick={() => archiveMutation.mutate(quiz.id)}
                              isLoading={archiveMutation.isPending}
                              title="Archive Quiz"
                            >
                              <Archive size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
