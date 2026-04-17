import React from 'react';
import { cn } from './GlassCard';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, rightElement, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-muted ml-2">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-base md:text-sm text-text transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
              error && "border-red-500 focus-visible:ring-red-500",
              rightElement && "pr-12",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
