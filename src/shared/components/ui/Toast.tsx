import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useI18n } from '../../i18n'
import { toastMessages } from './Toast.messages'

export type ToastKind = 'success' | 'error' | 'info'

type ToastItem = { id: number; kind: ToastKind; message: ReactNode }

export type ToastApi = {
  success: (message: ReactNode) => void
  error: (message: ReactNode) => void
  info: (message: ReactNode) => void
}

const AUTO_HIDE_MS = 4000

const NOOP_API: ToastApi = { success: () => {}, error: () => {}, info: () => {} }

const ToastContext = createContext<ToastApi>(NOOP_API)

/** Returns toast helpers; a silent no-op when no ToastProvider is mounted. */
export function useToast(): ToastApi {
  return useContext(ToastContext)
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const { t } = useI18n(toastMessages)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onClose(item.id), AUTO_HIDE_MS)
  }, [item.id, onClose])
  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => {
    start()
    return stop
  }, [start, stop])

  return (
    <div
      className={`ui-toast is-${item.kind}`}
      role={item.kind === 'error' ? 'alert' : 'status'}
      aria-live={item.kind === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      <div className="ui-toast-text">{item.message}</div>
      <button
        type="button"
        className="ui-toast-close"
        aria-label={t.close}
        onClick={() => onClose(item.id)}
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: ReactNode) => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, kind, message }].slice(-5))
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toast-region">
        {items.map((item) => (
          <ToastView key={item.id} item={item} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
