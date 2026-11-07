import { useEffect, useRef, useState, type RefObject } from 'react'

const DESKTOP_VIDEO =
  '/assets/cinematic-drone/living-mission-industrial-v5.mp4?v=7'
const MOBILE_VIDEO =
  '/assets/cinematic-drone/living-mission-mobile-industrial-v5.mp4?v=7'
const DESKTOP_POSTER =
  '/assets/cinematic-drone/living-mission-industrial-v5-poster.webp?v=7'
const MOBILE_POSTER =
  '/assets/cinematic-drone/living-mission-mobile-industrial-v5-poster.webp?v=7'

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>
  onReady: (ready: boolean) => void
}

export function CinematicDroneSequence({ videoRef, onReady }: Props) {
  const onReadyRef = useRef(onReady)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileViewport = window.matchMedia('(max-width: 700px)')

    const updateReady = (value: boolean) => {
      setReady(value)
      onReadyRef.current(value)
    }

    const handleLoadedData = () => {
      if (reducedMotion.matches) return
      updateReady(true)
    }

    const handleVideoError = () => updateReady(false)

    const loadVideoForViewport = () => {
      if (reducedMotion.matches) {
        if (video.dataset.source) {
          delete video.dataset.source
          video.pause()
          video.removeAttribute('src')
          video.load()
        }
        updateReady(false)
        return
      }

      const source = mobileViewport.matches ? MOBILE_VIDEO : DESKTOP_VIDEO
      if (video.dataset.source === source) return

      updateReady(false)
      video.dataset.source = source
      video.poster = mobileViewport.matches ? MOBILE_POSTER : DESKTOP_POSTER
      video.preload = 'auto'
      video.src = source
      video.load()
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleVideoError)
    reducedMotion.addEventListener('change', loadVideoForViewport)
    mobileViewport.addEventListener('change', loadVideoForViewport)
    loadVideoForViewport()

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleVideoError)
      reducedMotion.removeEventListener('change', loadVideoForViewport)
      mobileViewport.removeEventListener('change', loadVideoForViewport)
      video.pause()
      delete video.dataset.source
      video.removeAttribute('src')
      video.load()
    }
  }, [])

  return (
    <div
      className={'lp-cinematic-sequence' + (ready ? ' is-active' : '')}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        poster={DESKTOP_POSTER}
        muted
        playsInline
        preload="none"
        tabIndex={-1}
      />
    </div>
  )
}
