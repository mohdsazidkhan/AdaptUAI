import Link from 'next/link';
import Footer, { LEGAL_LINKS } from './Footer';

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com';
export const LAST_UPDATED = '19 November 2026';

/**
 * Shared layout for About / Terms / Privacy / Disclaimer: one white card on the grey page,
 * a chip row to switch between the pages, then plain sections.
 * sections: [{ heading, body: string | string[] | ReactNode }]
 */
export default function LegalPage({ title, intro, sections, current, showUpdated = true }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-page flex-1 p-3 pt-[calc(var(--navbar-h)+0.75rem)] lg:p-4 lg:pt-[calc(var(--navbar-h)+1rem)]">
        <nav aria-label="Legal pages" className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {LEGAL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.href === current ? 'page' : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${l.href === current ? 'bg-brand-500/15 text-brand-600' : 'bg-surface-50 text-surface-900 shadow-card hover:bg-surface-100'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <article className="fb-card p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">{title}</h1>
          {showUpdated && <p className="mt-1 text-sm text-surface-500">Last updated: {LAST_UPDATED}</p>}
          {intro && <p className="mt-4 text-[15px] leading-relaxed text-surface-700">{intro}</p>}

          <div className="mt-5 space-y-5">
            {sections.map((s, i) => (
              <section key={s.heading}>
                <h2 className="text-lg font-semibold text-surface-900">
                  {i + 1}. {s.heading}
                </h2>
                <div className="mt-1.5 space-y-2 text-[15px] leading-relaxed text-surface-700">
                  {Array.isArray(s.body) ? (
                    <ul className="list-disc space-y-1 pl-5">
                      {s.body.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                  ) : typeof s.body === 'string' ? (
                    <p>{s.body}</p>
                  ) : (
                    s.body
                  )}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-6 border-t border-surface-200 pt-4 text-sm text-surface-500">
            Questions? Write to us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-600 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </article>
      </div>
      <Footer />
    </div>
  );
}
