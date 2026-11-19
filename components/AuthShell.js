import Link from 'next/link';
import Footer from './Footer';

// Field style shared by the auth forms: one grey fill, thin brand ring on focus.
export const authInput =
  'w-full h-12 rounded-lg border border-transparent bg-surface-100 px-4 text-[15px] text-surface-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15';

/**
 * Facebook-style auth layout: brand + tagline on the left (desktop), the form card on the right,
 * stacked on phones, footer with the legal links below.
 */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-page flex-1 flex-col items-center justify-center gap-6 p-3 pt-[calc(var(--navbar-h)+0.75rem)] lg:p-4 lg:pt-[calc(var(--navbar-h)+1rem)] lg:flex-row lg:justify-between lg:gap-12">
        <div className="max-w-md text-center lg:text-left">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-2xl">🦉</span>
            <span className="text-4xl font-bold sm:text-5xl">
              <span className="text-surface-900">AdaptU</span><span className="text-brand-500">AI</span>
            </span>
          </Link>
          <p className="mt-3 hidden text-2xl leading-snug text-surface-900 sm:block">
            The AI tutor that adapts to how <span className="text-brand-500">you</span> learn.
          </p>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="fb-card p-4 sm:p-5">
            <h1 className="text-xl font-bold text-surface-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-surface-500">{subtitle}</p>}
            <div className="mt-4">{children}</div>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-surface-500">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="font-semibold text-surface-900 hover:underline">Terms</Link>,{' '}
            <Link href="/privacy" className="font-semibold text-surface-900 hover:underline">Privacy Policy</Link> and{' '}
            <Link href="/disclaimer" className="font-semibold text-surface-900 hover:underline">Disclaimer</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
