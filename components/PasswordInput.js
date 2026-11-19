'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password field with an eye button to show or hide what was typed.
 * Takes the same props as <input>; `className` styles the input itself.
 */
export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-surface-500 outline-none transition-colors hover:bg-surface-200 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}
