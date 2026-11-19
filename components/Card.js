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
    sm: 'p-3',
    md: 'p-3 sm:p-4',
    lg: 'p-3 sm:p-4',
  };

  // Every variant is the same white card on the grey page (Facebook style); kept for old call sites.
  const variants = {
    default: '',
    elevated: '',
    colored: '',
    dark: '',
    glass: '',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'fb-card bg-surface-50 rounded-lg border border-transparent dark:border-surface-200 transition-colors duration-200',
        paddings[padding],
        variants[variant],
        hover && 'cursor-pointer hover:bg-surface-100',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
