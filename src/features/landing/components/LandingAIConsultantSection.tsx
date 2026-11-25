import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { AIAnimatedMascot } from '../../customer/pages/CreateOrder/components/AIAnimatedMascot'
import { LANDING_MOTION } from '../landingMotion'

type Props = {
  eyebrow: string
  heading: string
  body: string
  bullets: readonly string[]
  ctaHref: string
  ctaLabel: string
  statusBadge: string
}

/**
 * Introduces the real OnDemand Monitor AI Consultant (OrderConversation + MissionDescriptionAssistant)
 * using the authentic robot mascot and linking straight into the real create-request flow.
 */
export function LandingAIConsultantSection({
  eyebrow,
  heading,
  body,
  bullets,
  ctaHref,
  ctaLabel,
  statusBadge,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const canObserveViewport = typeof IntersectionObserver !== 'undefined'

  return (
    <section
      id="ai-consultant"
      className="lp2-ai"
      aria-labelledby="lp2-ai-heading"
    >
      <div className="lpx-container">
        <motion.div
          className="lp2-ai-card"
          initial={reduceMotion || !canObserveViewport ? false : { opacity: 0, y: 18 }}
          whileInView={canObserveViewport ? { opacity: 1, y: 0 } : undefined}
          animate={!canObserveViewport ? { opacity: 1, y: 0 } : undefined}
          viewport={canObserveViewport ? LANDING_MOTION.viewport : undefined}
          transition={{ duration: LANDING_MOTION.duration.medium, ease: LANDING_MOTION.easeOut }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="lp2-ai-stage">
            <div className="lp2-ai-orbit" aria-hidden="true" />
            <AIAnimatedMascot
              state={hovered ? 'welcome' : 'idle'}
              size="hero"
              animated={!reduceMotion}
            />
            <span className="lp2-ai-badge">{statusBadge}</span>
          </div>

          <div className="lp2-ai-copy">
            <div className="lpx-section-eyebrow lpx-section-eyebrow--dark">
              {eyebrow}
            </div>
            <h2
              id="lp2-ai-heading"
              className="lpx-section-title lpx-section-title--light"
            >
              {heading}
            </h2>
            <p className="lp2-ai-body">{body}</p>

            <ul className="lp2-ai-list">
              {bullets.map((bullet) => (
                <li key={bullet}>
                  <Icon name="check" className="lp2-ai-check" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="lp2-ai-actions">
              <a className="lpx-cta-mint" href={ctaHref}>
                <span>{ctaLabel}</span>
                <Icon name="arrow-up-right" className="lpx-cta-icon" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
