import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegistrationPage } from '@/features/auth/RegistrationPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { StudentDashboard } from '@/pages/StudentDashboard';
import { QuizBrowser } from '@/pages/QuizBrowser';
import { QuizDetails } from '@/pages/QuizDetails';
import { QuizRunner } from '@/pages/QuizRunner';
import { QuizResult } from '@/pages/QuizResult';
import { MyAttempts } from '@/pages/MyAttempts';
import { Leaderboard } from '@/pages/Leaderboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegistrationPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <StudentDashboard />,
          },
          {
            path: '/quizzes',
            element: <QuizBrowser />,
          },
          {
            path: '/quizzes/:id',
            element: <QuizDetails />,
          },
          {
            path: '/attempts/:id/runner',
            element: <QuizRunner />,
          },
          {
            path: '/attempts/:id/result',
            element: <QuizResult />,
          },
          {
            path: '/attempts',
            element: <MyAttempts />,
          },
          {
            path: '/leaderboard',
            element: <Leaderboard />,
          },
        ]
      }
    ],
  },
  {
    element: <ProtectedRoute adminOnly />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/admin',
            element: <div className="space-y-4">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview of system performance and activity.</p>
            </div>,
          },
          {
            path: '/admin/quizzes',
            element: <div>Manage Quizzes</div>,
          },
          {
            path: '/admin/categories',
            element: <div>Manage Categories</div>,
          },
          {
            path: '/admin/users',
            element: <div>Manage Students</div>,
          },
          {
            path: '/admin/settings',
            element: <div>System Settings</div>,
          },
        ]
      }
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
