'use client';

import clsx from 'clsx';

const variants = {
  primary:
    'bg-brand-500 hover:bg-brand-600 text-white border-brand-700 shadow-button active:shadow-button-press',
  secondary:
    'bg-ocean-500 hover:bg-ocean-600 text-white border-ocean-700 shadow-button active:shadow-button-press',
  accent:
    'bg-accent-400 hover:bg-accent-500 active:bg-accent-600 text-surface-900 shadow-button hover:shadow-button-press active:translate-y-[2px] border-b-4 border-accent-600',
  ghost:
    'bg-transparent text-surface-500 hover:bg-surface-100 hover:text-surface-700',
  danger:
    'bg-coral-500 hover:bg-coral-600 text-white border-coral-700 shadow-button active:shadow-button-press',
  outline:
    'bg-transparent hover:bg-brand-50 active:bg-brand-100 text-brand-600 border-2 border-brand-400 hover:border-brand-500',
};

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
  xl: 'px-10 py-5 text-xl rounded-3xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 select-none',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none shadow-none border-b-2 translate-y-0',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
