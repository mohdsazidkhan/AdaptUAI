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
      {text && <p className="text-sm text-surface-500 font-medium">{text}</p>}
    </div>
  );
}

/**
 * Full-screen loader overlay
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
      <div className="fb-card flex flex-col items-center justify-center gap-3 px-8 py-6 animate-fade-in">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-3xl">🦉</span>
        <Loader size="md" />
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
    <div className="flex items-center gap-1.5 py-1">
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
