import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api/error';
import { useAuth } from './AuthContext';
import { authApi } from './api';
import { loginSchema, LoginCredentials } from './types';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      login(response.data);
      const targetPath = response.data.user.role === 'ADMIN' ? '/admin' : from;
      navigate(targetPath, { replace: true });
    },
    onError: (error: ApiError) => {
      setServerError(error.message);
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}
            <div className="relative">
              <User className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
              <Input
                label="Username or Email"
                placeholder="john@example.com"
                className="pl-10"
                error={errors.identifier?.message}
                {...register('identifier')}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Sign In
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline underline-offset-4">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
