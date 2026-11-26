import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { LANDING_MOTION } from '../landingMotion'

export type EvidencePinItem = {
  id: string
  code: string
  label: string
  statusLabel: string
  tone: string
  xPercent: number
  yPercent: number
  captureMeta: string
  finding: string
  deliverable: string
}

type Props = {
  eyebrow: string
  heading: string
  subtitle: string
  imageAlt: string
  frameLabel: string
  hintLabel: string
  pins: readonly EvidencePinItem[]
  ctaLabel: string
  ctaHref: string
}

/**
 * Interactive aerial inspection frame where visitors click/hover pinned inspection zones
 * on a real factory aerial view to inspect how checklist items, coordinates, and evidence link together.
 */
export function MissionEvidencePreview({
  eyebrow,
  heading,
  subtitle,
  imageAlt,
  frameLabel,
  hintLabel,
  pins,
  ctaLabel,
  ctaHref,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState(pins[0]?.id ?? '')
  const active = pins.find((p) => p.id === activeId) ?? pins[0]

  if (!active) return null

  return (
    <section
      id="evidence-preview"
      className="lp3-evidence"
      aria-labelledby="lp3-evidence-heading"
    >
      <div className="lpx-container">
        <div className="lp3-evidence-head">
          <div>
            <div className="lpx-section-eyebrow lpx-section-eyebrow--dark">
              {eyebrow}
            </div>
            <h2
              id="lp3-evidence-heading"
              className="lpx-section-title lpx-section-title--light"
            >
              {heading}
            </h2>
          </div>
          <p className="lp3-evidence-sub">{subtitle}</p>
        </div>

        <div className="lp3-evidence-grid">
          <div className="lp3-evidence-canvas">
            <img
              className="lp3-evidence-img"
              src="/assets/landing/services/factory-inspection.jpg"
              alt={imageAlt}
              width={1400}
              height={900}
              loading="lazy"
            />
            <div className="lp3-evidence-scrim" aria-hidden="true" />

            <div className="lp3-evidence-topbar" aria-hidden="true">
              <span className="lp3-evidence-frame-tag">
                <span className="lp3-evidence-dot" />
                {frameLabel}
              </span>
              <span className="lp3-evidence-hint">{hintLabel}</span>
            </div>

            {pins.map((pin) => {
              const isSelected = pin.id === active.id
              return (
                <button
                  key={pin.id}
                  type="button"
                  className={`lp3-pin${isSelected ? ' is-active' : ''}${
                    pin.tone === 'review' ? ' is-review' : ''
                  }`}
                  style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                  aria-pressed={isSelected}
                  aria-label={`${pin.code} ${pin.label}`}
                  onClick={() => setActiveId(pin.id)}
                  onMouseEnter={() => setActiveId(pin.id)}
                >
                  <span className="lp3-pin-ring" aria-hidden="true" />
                  <span className="lp3-pin-code">{pin.code}</span>
                </button>
              )
            })}

            <div className="lp3-evidence-footerbar">
              <span className="lp3-evidence-meta">{active.captureMeta}</span>
              <span
                className={`lp3-evidence-status${
                  active.tone === 'review' ? ' is-review' : ''
                }`}
              >
                {active.statusLabel}
              </span>
            </div>
          </div>

          <div className="lp3-evidence-panel">
            <div className="lp3-evidence-list" role="tablist" aria-label={heading}>
              {pins.map((pin) => {
                const isSelected = pin.id === active.id
                return (
                  <button
                    key={pin.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`lp3-evidence-tab${isSelected ? ' is-active' : ''}`}
                    onClick={() => setActiveId(pin.id)}
                  >
                    <span className="lp3-evidence-tab-code">{pin.code}</span>
                    <span className="lp3-evidence-tab-title">{pin.label}</span>
                    <span
                      className={`lp3-evidence-pill${
                        pin.tone === 'review' ? ' is-review' : ''
                      }`}
                    >
                      {pin.statusLabel}
                    </span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="lp3-evidence-detail"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: LANDING_MOTION.easeOut }}
              >
                <div className="lp3-evidence-detail-meta">{active.captureMeta}</div>
                <h3>{active.label}</h3>
                <p className="lp3-evidence-finding">{active.finding}</p>
                <div className="lp3-evidence-deliverable">{active.deliverable}</div>
              </motion.div>
            </AnimatePresence>

            <div className="lp3-evidence-cta-row">
              <a className="lpx-cta-mint" href={ctaHref}>
                <span>{ctaLabel}</span>
                <Icon name="arrow-up-right" className="lpx-cta-icon" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
