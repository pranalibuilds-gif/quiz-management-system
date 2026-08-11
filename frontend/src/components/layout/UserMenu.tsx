import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils/cn';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-full p-1 hover:bg-muted transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserIcon size={18} />
        </div>
        <div className="hidden text-left md:block">
          <p className="text-sm font-medium leading-none">{user.full_name}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in duration-100 z-50">
          <div className="px-2 py-1.5 text-sm font-semibold border-b">My Account</div>
          <button className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
            <UserCircle className="mr-2 h-4 w-4" />
            Profile
          </button>
          <button
            onClick={() => logout()}
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};
