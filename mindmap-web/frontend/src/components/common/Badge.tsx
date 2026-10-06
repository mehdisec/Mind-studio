import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'amber' | 'crimson' | 'slate' | 'purple' | 'emerald';
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  className,
  onClick,
}) => {
  const variants = {
    cyan: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60 shadow-glow-cyan/20',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-800/60 shadow-glow-amber/20',
    crimson: 'bg-rose-950/80 text-rose-300 border-rose-800/60 shadow-glow-crimson/20',
    purple: 'bg-purple-950/80 text-purple-300 border-purple-800/60 shadow-glow-purple/20',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    slate: 'bg-slate-800/90 text-slate-300 border-slate-700',
  };

  return (
    <span
      onClick={onClick}
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-150',
          variants[variant],
          onClick && 'cursor-pointer hover:brightness-125',
          className
        )
      )}
    >
      {children}
    </span>
  );
};
