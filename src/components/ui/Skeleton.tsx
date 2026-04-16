import React from 'react';
import { cn } from './GlassCard';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-full bg-glass-border/50", className)}
      {...props}
    />
  );
}
