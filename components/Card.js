'use client';

import React from 'react';
import clsx from 'clsx';

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
  variant = 'default',
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variants = {
    default: 'bg-surface-50 border border-surface-200',
    elevated: 'bg-surface-50 shadow-card border border-surface-100',
    colored: 'bg-gradient-to-br from-brand-50 to-ocean-50 border border-brand-100',
    dark: 'bg-surface-800 border border-surface-700 text-surface-50',
    glass: 'bg-surface-50/70 backdrop-blur-md border border-surface-200/50 shadow-lg',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-50 border-2 border-surface-200 rounded-[2rem] transition-all duration-200',
        paddings[padding],
        variants[variant],
        hover && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
