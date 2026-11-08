import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../api/httpClient'

export type MediaRecoveryProps = {
  src: string
  alternateSrc?: string
  mediaId?: string
  fallbackUrl?: string | null
  fileSize?: number | null
  original?: boolean
}
const LARGE_FILE = 20 * 1024 * 1024

/** One automatic recovery per displayed source; manual retry obtains a new signed URL. */
export function useMediaRecovery(props: MediaRecoveryProps) {
  const [source, setSource] = useState(props.src)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(
    Boolean(props.original && (props.fileSize ?? 0) > LARGE_FILE),
  )
  const loadedSource = useRef<string | null>(null)
  const approved = useRef(false)
  const attempted = useRef(false)
  const alternateAttempted = useRef(false)
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function stopLoad() {
    if (loadTimer.current) clearTimeout(loadTimer.current)
    loadTimer.current = null
  }
  const generation = useRef(0)
  const busy = useRef(false)
  const request = useRef<AbortController | null>(null)
  useEffect(() => {
    generation.current++
    request.current?.abort()
    busy.current = false
    loadedSource.current = null
    setSource(props.src)
    setLoading(false)
    setFailed(false)
    setPaused(Boolean(props.original && (props.fileSize ?? 0) > LARGE_FILE))
    attempted.current = false
    alternateAttempted.current = false
    approved.current = false
    return () => {
      generation.current++
      request.current?.abort()
      stopLoad()
    }
  }, [props.src, props.mediaId, props.original, props.fileSize])

  async function refresh() {
    stopLoad()
    loadedSource.current = null
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const timeout = setTimeout(() => controller.abort(), 15_000)
    const token = ++generation.current
    busy.current = true
    attempted.current = true
    setLoading(true)
    setFailed(false)
    try {
      const response = props.mediaId
        ? await apiRequest<{ viewUrl: string; fileSize: number }>(
            `/api/customer/media/${encodeURIComponent(props.mediaId)}/view-url`,
            { method: 'POST', signal: controller.signal },
          )
        : props.fallbackUrl
          ? { viewUrl: props.fallbackUrl, fileSize: props.fileSize ?? 0 }
          : null
      if (token !== generation.current) return
      if (!response?.viewUrl) throw new Error('No viewing fallback')
      setSource(response.viewUrl)
      setPaused(response.fileSize > LARGE_FILE && !approved.current)
    } catch {
      if (token === generation.current) setFailed(true)
    } finally {
      clearTimeout(timeout)
      if (token === generation.current) {
        busy.current = false
        setLoading(false)
      }
    }
  }
  function onError() {
    stopLoad()
    if (busy.current || failed) return
    if (
      !alternateAttempted.current &&
      props.alternateSrc &&
      props.alternateSrc !== source
    ) {
      alternateAttempted.current = true
      setSource(props.alternateSrc)
      return
    }
    if (attempted.current) {
      setFailed(true)
      return
    }
    void refresh()
  }
  return {
    source,
    loading,
    failed,
    paused,
    onError,
    stopLoad,
    startLoad: () => {
      stopLoad()
      if (loadedSource.current !== source)
        loadTimer.current = setTimeout(onError, 30_000)
    },
    completeLoad: () => {
      loadedSource.current = source
      stopLoad()
    },
    restartLoad: () => {
      stopLoad()
      loadTimer.current = setTimeout(onError, 30_000)
    },
    retry: () => {
      void refresh()
    },
    allow: () => {
      approved.current = true
      setPaused(false)
    },
  }
}
