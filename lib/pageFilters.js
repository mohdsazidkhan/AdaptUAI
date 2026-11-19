'use client';

import { useSyncExternalStore } from 'react';

/*
 * Tiny shared store for the phone "Filters" drawer.
 * - The navbar registers its drawer body element (`slot`) through a ref callback.
 * - A page with filters mounts <MobileFilters> (count > 0) -> the navbar shows a Filters button,
 *   and MobileFilters portals its controls into the CURRENT slot. Reading the slot from the store
 *   (instead of looking it up once) matters: if React re-creates the navbar DOM (e.g. after a
 *   hydration retry) every portal follows the new element instead of a detached old one.
 */
let state = { count: 0, open: false, slot: null };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => { state = { ...state, ...patch }; emit(); };

export const pageFilters = {
  register() { set({ count: state.count + 1 }); },
  unregister() { set({ count: Math.max(state.count - 1, 0), open: state.count - 1 > 0 ? state.open : false }); },
  open() { set({ open: true }); },
  close() { if (state.open) set({ open: false }); },
  toggle() { set({ open: !state.open }); },
  setSlot(el) { if (el !== state.slot) set({ slot: el }); },
};

export function usePageFilters() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state
  );
}
