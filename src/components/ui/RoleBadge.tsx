import React from 'react';
import { cn } from './GlassCard';
import { type UserRole } from '@/store/useAuthStore';

interface RoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: UserRole;
}

export function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  const roleStyles = {
    Admin: "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-300",
    Manager: "bg-gradient-to-r from-slate-400 to-slate-600 text-white border-slate-300",
    User: "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm border",
        roleStyles[role],
        className
      )}
      {...props}
    >
      {role}
    </span>
  );
}
