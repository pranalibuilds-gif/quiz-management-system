import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LucideIcon, LayoutDashboard, FileText, ClipboardList, Trophy, Settings, Layers, BarChart3, Users } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils/cn';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();

  const studentItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse Quizzes', href: '/quizzes', icon: FileText },
    { label: 'My Attempts', href: '/attempts', icon: ClipboardList },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const adminItems = [
    { label: 'Admin Dashboard', href: '/admin', icon: BarChart3 },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Quizzes', href: '/admin/quizzes', icon: FileText },
    { label: 'Students', href: '/admin/users', icon: Users },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const sidebarItems = isAdmin ? adminItems : studentItems;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar items={sidebarItems} className="hidden w-64 md:flex shrink-0" />

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Content */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Header onMenuClick={() => setIsMobileMenuOpen(false)} />
          <Sidebar items={sidebarItems} className="h-full border-none" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
