import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { LANDING_MOTION } from '../landingMotion'

export type LandingCatalogItem = {
  id: string
  code: string
  name: string
  summary: string
  deliverables: string
  image: string
  imageAlt: string
}

type Props = {
  eyebrow: string
  heading: string
  subtitle: string
  items: readonly LandingCatalogItem[]
  ctaLabel: string
  ctaHref: string
}

/**
 * Interactive 4-service asymmetric showcase grounded in the platform's verified monitoring categories.
 * Uses authentic project aerial imagery; avoids unverified pricing or fabricated metrics.
 */
export function InteractiveServiceShowcase({
  eyebrow,
  heading,
  subtitle,
  items,
  ctaLabel,
  ctaHref,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const active = items.find((item) => item.id === activeId) ?? items[0]

  if (!active) return null

  return (
    <section
      id="catalog"
      className="lp2-catalog"
      aria-labelledby="lp2-catalog-heading"
    >
      <div className="lpx-container">
        <div className="lp2-catalog-head">
          <div>
            <div className="lpx-section-eyebrow lpx-section-eyebrow--light">
              {eyebrow}
            </div>
            <h2
              id="lp2-catalog-heading"
              className="lpx-section-title lpx-section-title--dark"
            >
              {heading}
            </h2>
          </div>
          <p className="lp2-catalog-sub">{subtitle}</p>
        </div>

        <div className="lp2-catalog-grid">
          <div
            className="lp2-catalog-list"
            role="tablist"
            aria-label={heading}
          >
            {items.map((item) => {
              const isSelected = item.id === active.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`lp2-catalog-tab${isSelected ? ' is-active' : ''}`}
                  onClick={() => setActiveId(item.id)}
                  onMouseEnter={() => setActiveId(item.id)}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="lp2-catalog-indicator"
                      className="lp2-catalog-indicator"
                      transition={LANDING_MOTION.spring}
                      aria-hidden="true"
                    />
                  )}
                  <span className="lp2-catalog-code">{item.code}</span>
                  <span className="lp2-catalog-tab-copy">
                    <strong>{item.name}</strong>
                    <span>{item.summary}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="lp2-catalog-stage" role="tabpanel">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="lp2-catalog-preview"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{
                  duration: 0.55,
                  ease: LANDING_MOTION.easeOut,
                }}
              >
                <div className="lp2-catalog-media">
                  <motion.img
                    src={active.image}
                    alt={active.imageAlt}
                    width={1280}
                    height={800}
                    loading="lazy"
                    initial={reduceMotion ? false : { scale: 1.04 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.4, ease: LANDING_MOTION.easeOut }}
                  />
                  <span className="lp2-catalog-badge">{active.code}</span>
                </div>
                <div className="lp2-catalog-detail">
                  <h3>{active.name}</h3>
                  <p>{active.summary}</p>
                  <p className="lp2-catalog-deliverables">{active.deliverables}</p>
                  <a className="lpx-cta-mint lp2-catalog-cta" href={ctaHref}>
                    <span>{ctaLabel}</span>
                    <Icon name="arrow-up-right" className="lpx-cta-icon" />
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
