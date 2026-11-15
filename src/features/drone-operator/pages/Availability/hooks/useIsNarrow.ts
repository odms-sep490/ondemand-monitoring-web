import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 639px)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const snapshot = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia) && window.matchMedia(QUERY).matches

/** True on phone widths, where the week is shown as a per-day list instead of a 7-column table. */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
