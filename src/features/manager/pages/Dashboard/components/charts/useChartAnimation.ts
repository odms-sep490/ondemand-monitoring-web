import { useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  if (media.addEventListener) media.addEventListener('change', onChange)
  else media.addListener?.(onChange)
  return () => {
    if (media.removeEventListener) media.removeEventListener('change', onChange)
    else media.removeListener?.(onChange)
  }
}

function getSnapshot() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
}

/** Chart transitions are enabled by default and disabled for reduced-motion users. */
export function useChartAnimation() {
  return !useSyncExternalStore(subscribe, getSnapshot, () => false)
}
