import { useCallback, useEffect, useRef, useState } from 'react'

export type UseApiQueryState<T> = {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

/**
 * Runs `fn(signal)` whenever `deps` change, exposing loading/data/error plus
 * a manual `reload()`. Requests are aborted on unmount / dep change (via the
 * `AbortSignal` passed to `fn`), and a stale-guard drops responses that
 * resolve after a newer request has started.
 */
export function useApiQuery<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  isEqual?: (previous: T, next: T) => boolean,
): UseApiQueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)
  const fnRef = useRef(fn)
  const isEqualRef = useRef(isEqual)
  fnRef.current = fn
  isEqualRef.current = isEqual

  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  useEffect(() => {
    const id = ++requestId.current
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)

    fnRef
      .current(controller.signal)
      .then((result) => {
        if (requestId.current !== id) return
        setData((previous) =>
          previous !== undefined && isEqualRef.current?.(previous, result)
            ? previous
            : result,
        )
        setError(undefined)
      })
      .catch((err: unknown) => {
        if (requestId.current !== id) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err)
      })
      .finally(() => {
        if (requestId.current !== id) return
        setLoading(false)
      })

    return () => {
      // Invalidate this request so late results never reach setState after
      // unmount or after deps changed.
      if (requestId.current === id) requestId.current++
      controller.abort()
    }
    // deps is caller-controlled (mirrors useEffect's own contract); this
    // hook intentionally re-runs whenever any of its entries change.
  }, [...deps, reloadToken])

  return { data, error, loading, reload }
}
