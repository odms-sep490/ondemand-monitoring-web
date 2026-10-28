// Vitest setup: extends `expect` with jest-dom matchers (toBeInTheDocument,
// etc) for every test file, per vite.config.ts `test.setupFiles`.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import { setLanguage } from '../shared/i18n/languageStore'

// vite.config.ts does not set `test.globals: true`, so @testing-library/react
// cannot auto-detect a global `afterEach` to register its DOM cleanup. Without
// this, multiple `render()` calls across tests in the same file pile up in
// the same document and every query that should match one element starts
// matching N.
afterEach(() => {
  cleanup()
  // Reset the i18n language store between tests so a test that switches to
  // English never leaks into the next test file (localStorage persists the
  // pick, and languageStore is a module-level singleton).
  localStorage.clear()
  setLanguage('vi')
})

// jsdom does not implement window.matchMedia. Several components probe
// prefers-reduced-motion / pointer capabilities (e.g. useParallax), so give
// every test a default implementation (nothing matches) unless a test
// stubs its own via vi.stubGlobal('matchMedia', ...).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom does not implement ResizeObserver, which recharts' ResponsiveContainer
// (and some antd internals) rely on.
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverStub,
  })
}
