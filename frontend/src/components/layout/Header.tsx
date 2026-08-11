import React from 'react';
import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border md:hidden hover:bg-muted"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 font-bold text-primary text-xl">
          <span className="hidden md:inline">Quiz System</span>
          <span className="md:hidden">QS</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
};
