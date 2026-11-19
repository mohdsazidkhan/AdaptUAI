'use client';

import clsx from 'clsx';

// Facebook-style flat buttons: brand for the main action, grey for secondary, red only for danger.
const variants = {
  primary: 'bg-brand-500 text-white hover:brightness-110',
  secondary: 'bg-surface-100 text-surface-900 hover:bg-surface-200',
  accent: 'bg-brand-500 text-white hover:brightness-110',
  ghost: 'bg-transparent text-surface-500 hover:bg-surface-100 hover:text-surface-900',
  danger: 'bg-coral-500 text-white hover:brightness-110',
  outline: 'bg-brand-500/10 text-brand-600 hover:bg-brand-500/15',
};

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-[15px] rounded-lg',
  lg: 'h-11 px-5 text-base rounded-lg',
  xl: 'h-12 px-6 text-lg rounded-lg',
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
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 select-none',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
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
