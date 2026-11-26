import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { LANDING_MOTION } from '../landingMotion'

type Props = {
  titleLine1: string
  titleLine2: string
  subtitle: string
  imageAlt: string
  createRequestHref: string
  createRequestLabel: string
  seeHowItWorksLabel: string
  badgeLabel: string
  scrollHintLabel: string
  sceneLabels?: readonly string[]
  proofItems: readonly string[]
}

const HERO_VIDEOS = [
  {
    id: 'wind-farm',
    src: '/assets/landing/hero/hero-drone.mp4',
    poster: '/images/landing/wind-farm.webp',
  },
  {
    id: 'factory-solar',
    src: '/assets/landing/hero/hero-factory.mp4',
    poster: '/assets/landing/services/factory-inspection.jpg',
  },
  {
    id: 'solar-inspection',
    src: '/assets/landing/hero/hero-solar.mp4',
    poster: '/assets/landing/services/factory-inspection.jpg',
  },
  {
    id: 'forest-monitoring',
    src: '/assets/landing/hero/hero-forest.mp4',
    poster: '/assets/landing/services/forest-monitoring.jpg',
  },
] as const

const SCENE_DURATION_MS = 9000
const CROSSFADE_LEAD_SECONDS = 1.25
const CROSSFADE_PAUSE_DELAY_MS = 1350

/**
 * Full-bleed cinematic multi-scene aerial video hero with smooth opacity cross-fades,
 * interactive scene switcher, scroll-linked parallax, offscreen auto-pause,
 * and reduced-motion static poster fallback.
 */
export function CinematicDroneHero({
  titleLine1,
  titleLine2,
  subtitle,
  imageAlt,
  createRequestHref,
  createRequestLabel,
  seeHowItWorksLabel,
  badgeLabel,
  scrollHintLabel,
  sceneLabels,
  proofItems,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const transitionLockRef = useRef(false)
  const pauseTimersRef = useRef<number[]>([])
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [inView, setInView] = useState(true)

  // Track viewport visibility so offscreen hero videos pause cleanly.
  useEffect(() => {
    if (reduceMotion) return
    const section = sectionRef.current
    const observer =
      section && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              setInView(entries[0]?.isIntersecting ?? true)
            },
            { threshold: 0.08 },
          )
        : null
    if (section) observer?.observe(section)
    return () => observer?.disconnect()
  }, [reduceMotion])

  // Sync play/pause: start incoming clip immediately, keep outgoing clip moving during the 1.25s crossfade.
  useEffect(() => {
    if (reduceMotion) return
    transitionLockRef.current = false
    pauseTimersRef.current.forEach((id) => window.clearTimeout(id))
    pauseTimersRef.current = []

    const syncPlayback = () => {
      const shouldPlay = inView && !document.hidden
      videoRefs.current.forEach((video, idx) => {
        if (!video) return
        if (!shouldPlay) {
          video.pause?.()
          return
        }
        if (idx === activeIndex) {
          const result = video.play?.()
          if (result && typeof result.catch === 'function') {
            void result.catch(() => {
              // Ignore autoplay restriction errors; poster remains visible.
            })
          }
        } else {
          // Delay pausing outgoing clips until the cross-dissolve completes so motion never freezes.
          const tid = window.setTimeout(() => {
            video.pause?.()
          }, CROSSFADE_PAUSE_DELAY_MS)
          pauseTimersRef.current.push(tid)
        }
      })
    }

    const onVisibility = () => syncPlayback()
    document.addEventListener('visibilitychange', onVisibility)
    syncPlayback()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      pauseTimersRef.current.forEach((id) => window.clearTimeout(id))
      pauseTimersRef.current = []
    }
  }, [activeIndex, inView, reduceMotion])

  // Fallback timer if video metadata/timeupdate doesn't trigger early crossfade.
  useEffect(() => {
    if (reduceMotion || !inView) return
    const timer = window.setTimeout(() => {
      if (!document.hidden) {
        selectScene((activeIndex + 1) % HERO_VIDEOS.length)
      }
    }, SCENE_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [activeIndex, inView, reduceMotion])

  const selectScene = (idx: number) => {
    if (idx === activeIndex) return
    transitionLockRef.current = true
    const nextVideo = videoRefs.current[idx]
    if (nextVideo) {
      try {
        nextVideo.currentTime = 0
      } catch {
        // Ignore if metadata not loaded yet.
      }
      const result = nextVideo.play?.()
      if (result && typeof result.catch === 'function') {
        void result.catch(() => {})
      }
    }
    setActiveIndex(idx)
  }

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.07])

  return (
    <section
      ref={sectionRef}
      className="lpx-hero lp2-hero"
      aria-labelledby="lpx-hero-heading"
    >
      <motion.div
        className="lp2-hero-stage"
        style={reduceMotion ? undefined : { y: mediaY, scale: mediaScale }}
        aria-hidden="true"
      >
        {reduceMotion ? (
          <img
            className="lpx-hero-media"
            src={HERO_VIDEOS[activeIndex]?.poster ?? HERO_VIDEOS[0].poster}
            alt={imageAlt}
            width={1600}
            height={900}
            fetchPriority="high"
          />
        ) : (
          HERO_VIDEOS.map((clip, idx) => {
            const isCurrent = idx === activeIndex
            return (
              <video
                key={clip.id}
                ref={(el) => {
                  videoRefs.current[idx] = el
                }}
                className={`lpx-hero-media lp3-hero-video${isCurrent ? ' is-active' : ''}`}
                src={clip.src}
                poster={clip.poster}
                autoPlay={isCurrent}
                muted
                playsInline
                preload="auto"
                onTimeUpdate={(e) => {
                  if (idx !== activeIndex || transitionLockRef.current) return
                  const v = e.currentTarget
                  if (
                    Number.isFinite(v.duration) &&
                    v.duration > CROSSFADE_LEAD_SECONDS * 2 &&
                    v.duration - v.currentTime <= CROSSFADE_LEAD_SECONDS
                  ) {
                    selectScene((idx + 1) % HERO_VIDEOS.length)
                  }
                }}
                onEnded={() => {
                  if (idx === activeIndex && !transitionLockRef.current) {
                    selectScene((idx + 1) % HERO_VIDEOS.length)
                  }
                }}
              />
            )
          })
        )}
      </motion.div>

      <div className="lpx-hero-scrim lp2-hero-scrim" aria-hidden="true" />

      {/* Subtle aviation framing reticle — decorative framing only */}
      <div className="lp2-hero-hud" aria-hidden="true">
        <span className="lp2-hud-corner is-tl" />
        <span className="lp2-hud-corner is-tr" />
        <span className="lp2-hud-corner is-bl" />
        <span className="lp2-hud-corner is-br" />
      </div>

      <div className="lpx-container lpx-hero-inner">
        <motion.div
          className="lpx-hero-content"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: LANDING_MOTION.duration.cinematic, ease: LANDING_MOTION.easeOut }}
        >
          <span className="lp2-hero-pill">
            <span className="lp2-hero-pill-dot" aria-hidden="true" />
            {badgeLabel}
          </span>

          <h1 id="lpx-hero-heading" className="lpx-hero-title">
            <span>{titleLine1}</span>{' '}
            <span>{titleLine2}</span>
          </h1>
          <p className="lpx-hero-subtitle">{subtitle}</p>
          <div className="lpx-hero-actions">
            <a className="lpx-cta-mint" href={createRequestHref}>
              <span>{createRequestLabel}</span>
              <Icon name="arrow-up-right" className="lpx-cta-icon" />
            </a>
            <a className="lpx-text-link" href="#how-it-works">
              {seeHowItWorksLabel}
            </a>
          </div>

          <ul className="lp3-hero-proofs" aria-label={badgeLabel}>
            {proofItems.map((item) => (
              <li key={item}>
                <span className="lp3-hero-proof-dot" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="lp3-hero-scenes" role="tablist" aria-label={imageAlt}>
        {HERO_VIDEOS.map((clip, idx) => {
          const isCurrent = idx === activeIndex
          const label = sceneLabels?.[idx] ?? `CAM ${idx + 1}`
          return (
            <button
              key={clip.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              className={`lp3-scene-btn${isCurrent ? ' is-active' : ''}`}
              onClick={() => selectScene(idx)}
            >
              <span className="lp3-scene-idx">{`CAM ${idx + 1}`}</span>
              <span className="lp3-scene-name">{label}</span>
              <span className="lp3-scene-bar" aria-hidden="true">
                {isCurrent && (
                  <motion.span
                    key={`bar-${activeIndex}`}
                    className="lp3-scene-bar-fill"
                    initial={reduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : SCENE_DURATION_MS / 1000,
                      ease: 'linear',
                    }}
                  />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <a className="lp2-scroll-cue" href="#interactive-3d" aria-label={scrollHintLabel}>
        <span className="lp2-scroll-cue-line" aria-hidden="true" />
        <span>{scrollHintLabel}</span>
      </a>
    </section>
  )
}
