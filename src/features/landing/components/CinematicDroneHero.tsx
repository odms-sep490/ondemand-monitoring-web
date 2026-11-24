import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
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
}

/** Curated high-resolution aerial scenes cycling slowly with smooth cross-fades (9s per scene). */
const HERO_SLIDES = [
  '/images/landing/wind-farm.webp',
  '/assets/landing/services/factory-inspection.jpg',
  '/assets/landing/services/forest-monitoring.jpg',
  '/images/landing/landing-apron.webp',
] as const

const SLIDE_INTERVAL_MS = 9000

/**
 * Full-bleed cinematic aerial hero with ultra-slow 9s cross-fade transitions,
 * gentle Ken Burns drift, scroll-linked parallax, offscreen auto-pause, and reduced-motion safety.
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
}: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const [slideIndex, setSlideIndex] = useState(0)

  // Slowly advance aerial slides every 9 seconds; pause when offscreen, hidden, or reduced-motion.
  useEffect(() => {
    if (reduceMotion) return
    const section = sectionRef.current
    let inView = true

    const observer =
      section && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? true
            },
            { threshold: 0.1 },
          )
        : null
    if (section) observer?.observe(section)

    const timer = window.setInterval(() => {
      if (inView && !document.hidden) {
        setSlideIndex((current) => (current + 1) % HERO_SLIDES.length)
      }
    }, SLIDE_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
      observer?.disconnect()
    }
  }, [reduceMotion])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.07])

  const activeSlide = HERO_SLIDES[slideIndex] ?? HERO_SLIDES[0]

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
        <AnimatePresence mode="sync">
          <motion.img
            key={activeSlide}
            className="lpx-hero-media"
            src={activeSlide}
            alt={imageAlt}
            width={1600}
            height={900}
            fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{
              opacity: { duration: 1.8, ease: 'easeInOut' },
              scale: { duration: 9.5, ease: 'linear' },
            }}
          />
        </AnimatePresence>
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
        </motion.div>
      </div>

      <a className="lp2-scroll-cue" href="#catalog" aria-label={scrollHintLabel}>
        <span className="lp2-scroll-cue-line" aria-hidden="true" />
        <span>{scrollHintLabel}</span>
      </a>
    </section>
  )
}
