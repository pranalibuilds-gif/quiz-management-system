import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Lock, UserPlus, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api/error';
import { authApi } from './api';
import { registerSchema, RegisterCredentials } from './types';

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error: ApiError) => {
      setServerError(error.message);
    },
  });

  const onSubmit = (data: RegisterCredentials) => {
    setServerError(null);
    // Remove confirm_password before sending to API
    const { confirm_password, ...payload } = data;
    mutation.mutate(payload as any);
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Registration Successful!</CardTitle>
            <CardDescription>
              Your account has been created. Redirecting you to the login page...
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/login">
              <Button variant="outline">Go to Login Now</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>Enter your details below to register as a student</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  className="pl-10"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />
              </div>

              <div className="relative">
                <UserPlus className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  label="Username"
                  placeholder="johndoe"
                  className="pl-10"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  error={errors.confirm_password?.message}
                  {...register('confirm_password')}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={mutation.isPending}>
              Register
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
