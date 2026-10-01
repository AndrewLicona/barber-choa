import React from 'react';

export type BadgeVariant = 'gold' | 'green' | 'zinc' | 'rose' | 'blue';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'gold', className = '', size = 'sm' }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    gold: 'bg-[#d4af37]/15 text-[#f3e5ab] border-[#d4af37]/35',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    zinc: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded-full border tracking-wide uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
