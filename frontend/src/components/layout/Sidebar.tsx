import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, className }) => {
  return (
    <aside className={cn("flex h-full flex-col border-r bg-card", className)}>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
