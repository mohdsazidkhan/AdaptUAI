'use client';

import clsx from 'clsx';

export default function AUBadge({ xp = 0, level = 1, streak = 0, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-accent-400 text-surface-900 rounded-full px-2.5 py-1 text-xs font-bold transition-all">
          ⚡ {xp} AU
        </span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 bg-coral-100 text-coral-600 rounded-full px-2.5 py-1 text-xs font-bold">
            🔥 {streak}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Level badge */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg viewBox="0 0 48 48" className="w-12 h-12">
          <polygon
            points="24,2 45,13 45,35 24,46 3,35 3,13"
            fill="var(--brand-500)"
            stroke="var(--brand-700)"
            strokeWidth="2"
          />
        </svg>
        <div className="absolute -top-1 -right-1 bg-brand-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface-50 shadow-sm">
          {level}
        </div>
      </div>

      {/* AU & streak */}
      <div className="flex flex-col">
        <span className="text-xs text-surface-500 font-semibold uppercase tracking-wide">Level {level}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full border border-surface-200">
            <span className="text-xs font-black text-surface-700">{xp}</span>
            <span className="text-[10px] font-bold text-surface-400">AU</span>
          </div>
          {streak > 0 && (
            <span className="text-sm font-bold text-coral-500">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AUPopup({ xp, show }) {
  if (!show) return null;
  return (
    <div
      className={clsx(
        'fixed bottom-20 right-6 z-50 bg-coral-500 text-white font-black px-4 py-2 rounded-full text-lg shadow-lg animate-xp-pop',
        'flex items-center gap-1.5'
      )}
    >
      -{xp} AU ⚡
    </div>
  );
}
