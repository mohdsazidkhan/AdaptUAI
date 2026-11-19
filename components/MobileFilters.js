'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { pageFilters, usePageFilters } from '@/lib/pageFilters';

/**
 * Renders its children inside the navbar's right-side Filters drawer (phones/tablets only;
 * desktop keeps the controls in the page). Several <MobileFilters> blocks on one page stack in
 * mount order, e.g. the header's search + filters, then the pagination.
 */
export default function MobileFilters({ children, title }) {
  const { slot } = usePageFilters();

  useEffect(() => {
    pageFilters.register();
    return () => pageFilters.unregister();
  }, []);

  if (!slot || !slot.isConnected) return null;
  return createPortal(
    <section className="in-drawer space-y-2 border-b border-surface-200 pb-3 last:border-0 [&_label]:flex [&_label]:w-full [&_select]:w-full">
      {title && <h3 className="text-sm font-semibold text-surface-500">{title}</h3>}
      {children}
    </section>,
    slot
  );
}
