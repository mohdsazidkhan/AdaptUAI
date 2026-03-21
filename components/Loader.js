'use client';

export default function Loader({ size = 'md', text = '' }) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${dotSizes[size]} rounded-full bg-brand-500 animate-bounce`}
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
          />
        ))}
      </div>
      {text && <p className="text-sm text-surface-700 font-medium animate-pulse">{text}</p>}
    </div>
  );
}

/**
 * Full-screen loader overlay
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-50/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center p-8 bg-surface-50/50 backdrop-blur-sm rounded-[2.5rem] border-2 border-surface-200 shadow-2xl animate-fade-in transition-colors">
        {/* Owl mascot */}
        <div className="text-6xl animate-float">🦉</div>
        <Loader size="lg" />
        <p className="text-brand-600 font-bold text-lg">Loading AdaptUAI...</p>
      </div>
    </div>
  );
}

/**
 * Inline skeleton loader
 */
export function SkeletonLine({ width = 'full', height = 4 }) {
  return (
    <div
      className={`w-${width} h-${height} bg-surface-200 rounded-full animate-pulse`}
    />
  );
}

/**
 * Typing indicator for AI responses
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-surface-100 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-surface-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}
