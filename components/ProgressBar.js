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
    brand: 'bg-brand-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]',
    ocean: 'bg-ocean-500 shadow-[0_0_12px_rgba(14,165,233,0.4)]',
    accent: 'bg-accent-400',
    coral: 'bg-coral-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
    purple: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
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
      <div className={clsx('w-full bg-surface-200 rounded-full overflow-hidden', heights[height])}>
        <div
          className={`${heights[height]} ${colors[color]} rounded-full transition-all duration-700 ease-out ${animated ? 'animate-slide-in-right' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
