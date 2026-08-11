import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Home Page (Landing)</div>,
  },
  {
    path: '/login',
    element: <div>Login Page</div>,
  },
  {
    path: '/register',
    element: <div>Register Page</div>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <div>Student Dashboard</div>,
      },
      {
        path: '/quizzes',
        element: <div>Browse Quizzes</div>,
      },
    ],
  },
  {
    element: <ProtectedRoute adminOnly />,
    children: [
      {
        path: '/admin',
        element: <div>Admin Dashboard</div>,
      },
      {
        path: '/admin/quizzes',
        element: <div>Manage Quizzes</div>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
