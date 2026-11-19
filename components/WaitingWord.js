'use client';

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { TypingIndicator } from './Loader';
import { DICTIONARY } from '@/lib/dictionary';

const ROTATE_MS = 3500;

/**
 * Shown in the AI bubble while the answer is loading: typing dots plus one English -> Hindi word
 * from the 100-word dictionary, changing every few seconds (random start so it is not always the same).
 */
export default function WaitingWord() {
  const [index, setIndex] = useState(null);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * DICTIONARY.length));
    const t = setInterval(() => setIndex((i) => ((i ?? 0) + 1) % DICTIONARY.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const entry = index == null ? null : DICTIONARY[index];

  return (
    <div className="min-w-[200px]" aria-live="polite">
      <TypingIndicator />
      {entry && (
        <div key={index} className="mt-2 border-t border-surface-200 pt-2 animate-fade-in">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-surface-500">
            <BookOpen className="h-3.5 w-3.5 text-brand-500" /> Learn while you wait
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-surface-900">{entry[0]}</span>
            <span className="text-surface-400">→</span>
            <span lang="hi" className="text-base font-semibold text-brand-600">{entry[1]}</span>
          </p>
          <p className="text-xs text-surface-500">{entry[2]}</p>
        </div>
      )}
    </div>
  );
}
