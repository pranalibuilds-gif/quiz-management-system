import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegistrationPage } from '@/features/auth/RegistrationPage';
import { AppLayout } from '@/components/layout/AppLayout';

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
            element: <div className="space-y-4">
              <h1 className="text-3xl font-bold">Student Dashboard</h1>
              <p className="text-muted-foreground">Welcome back! Ready to test your knowledge?</p>
            </div>,
          },
          {
            path: '/quizzes',
            element: <div>Browse Quizzes</div>,
          },
          {
            path: '/attempts',
            element: <div>My Attempts</div>,
          },
          {
            path: '/leaderboard',
            element: <div>Leaderboard</div>,
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
