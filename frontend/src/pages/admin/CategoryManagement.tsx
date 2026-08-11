import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Layers, Search, MoreVertical } from 'lucide-react';
import { categoriesApi } from '@/features/categories/api';
import { CategoryModal } from '@/features/categories/CategoryModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Category } from '@/types/quiz';
import { cn } from '@/lib/utils/cn';

export const CategoryManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.list(false),
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will hide it from students.`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  if (isLoading) return <LoadingState message="Loading categories..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const categories = data?.data || [];
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Layers className="mr-3 h-8 w-8 text-primary" />
            Category Management
          </h1>
          <p className="text-muted-foreground">Create and organize quiz categories.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter categories..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {searchTerm ? 'No categories match your search.' : 'No categories created yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{category.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          category.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        )}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(category.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(category)}
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(category.id, category.name)}
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </Button>
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

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
      />
    </div>
  );
};
