import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  UserCheck,
  UserMinus,
  Trash2,
  Mail,
  User as UserIcon,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { adminUserApi, UserFilters } from '@/features/users/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils/cn';

export const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({
    skip: 0,
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', filters, searchTerm],
    queryFn: () => adminUserApi.list({ ...filters, search: searchTerm }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminUserApi.updateStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const deleteMutation = useMutation({
    mutationFn: adminUserApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user? Existing sessions will be revoked.`)) {
      statusMutation.mutate({ id, isActive: !currentStatus });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently soft-delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading && !data) return <LoadingState message="Loading student list..." />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const students = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Student Management
          </h1>
          <p className="text-muted-foreground">Monitor registrations and manage student account statuses.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="bg-background border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.value === 'ALL' ? undefined : e.target.value === 'ACTIVE' }))}
              value={filters.is_active === undefined ? 'ALL' : filters.is_active ? 'ACTIVE' : 'INACTIVE'}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{student.full_name}</div>
                            <div className="text-xs text-muted-foreground">@{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-muted-foreground">
                          <Mail className="mr-2 h-3.5 w-3.5" />
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          student.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-3.5 w-3.5" />
                          {new Date(student.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(student.id, student.is_active)}
                            title={student.is_active ? 'Deactivate Account' : 'Activate Account'}
                            className={cn(student.is_active ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50")}
                          >
                            {student.is_active ? <UserMinus size={18} /> : <UserCheck size={18} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(student.id, student.full_name)}
                            title="Delete Account"
                          >
                            <Trash2 size={18} />
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <ShieldAlert className="h-5 w-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
           <p className="font-bold mb-1">Administrative Note</p>
           <p>Deactivating a student account immediately revokes all active refresh tokens. The student will be required to log in again if reactivated.</p>
        </div>
      </div>
    </div>
  );
};
