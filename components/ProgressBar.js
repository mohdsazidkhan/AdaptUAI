'use client';

import clsx from 'clsx';

export default function ProgressBar({
  value = 0,
  max = 100,
  label = '',
  showPercent = false,
  color = 'brand',
  height = 'md',
  animated = true,
  className = '',
}) {
  const percent = Math.min(Math.round((value / max) * 100), 100);

  const colors = {
    brand: 'bg-brand-500',
    ocean: 'bg-brand-500',
    accent: 'bg-accent-500',
    coral: 'bg-coral-500',
    purple: 'bg-brand-500',
  };

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-5',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-semibold text-surface-700">{label}</span>}
          {showPercent && (
            <span className="text-sm font-bold text-surface-500">{percent}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-surface-100 rounded-full overflow-hidden', heights[height])}>
        <div
          className={`${heights[height]} ${colors[color]} rounded-full transition-all duration-700 ease-out ${animated ? 'animate-slide-in-right' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
