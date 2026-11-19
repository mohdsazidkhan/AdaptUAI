'use client';

import clsx from 'clsx';

export default function AUBadge({ xp = 0, level = 1, streak = 0, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-surface-100 text-surface-900 rounded-full px-2.5 py-1 text-xs font-semibold">
          ⚡ {xp} AU
        </span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 bg-accent-100 text-accent-700 rounded-full px-2.5 py-1 text-xs font-semibold">
            🔥 {streak}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Level badge */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
        {level}
      </div>

      {/* AU & streak */}
      <div className="flex flex-col">
        <span className="text-xs text-surface-500 font-semibold">Level {level}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
            <span className="text-xs font-bold text-surface-900">{xp}</span>
            <span className="text-xs font-semibold text-surface-500">AU</span>
          </div>
          {streak > 0 && (
            <span className="text-sm font-semibold text-accent-600">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
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
        'fixed bottom-20 right-4 z-50 bg-surface-900 text-surface-50 font-semibold px-4 py-2 rounded-full text-sm shadow-menu animate-xp-pop',
        'flex items-center gap-1.5'
      )}
    >
      -{xp} AU ⚡
    </div>
  );
}
