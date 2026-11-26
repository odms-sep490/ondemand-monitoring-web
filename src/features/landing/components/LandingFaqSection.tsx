import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'

export type LandingFaqItem = {
  id: string
  question: string
  answer: string
}

type Props = {
  eyebrow: string
  heading: string
  subtitle: string
  items: readonly LandingFaqItem[]
  supportLabel: string
  supportEmail: string
  ctaHref: string
  ctaLabel: string
}

/**
 * Editorial two-column FAQ accordion addressing customer objections around flight permits,
 * deliverables, checklist customization, AI drafting, and inspection acceptance.
 */
export function LandingFaqSection({
  eyebrow,
  heading,
  subtitle,
  items,
  supportLabel,
  supportEmail,
  ctaHref,
  ctaLabel,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <section id="faq" className="lp3-faq" aria-labelledby="lp3-faq-heading">
      <div className="lpx-container lp3-faq-layout">
        <div className="lp3-faq-intro">
          <div className="lpx-section-eyebrow lpx-section-eyebrow--light">
            {eyebrow}
          </div>
          <h2
            id="lp3-faq-heading"
            className="lpx-section-title lpx-section-title--dark"
          >
            {heading}
          </h2>
          <p className="lp3-faq-sub">{subtitle}</p>

          <div className="lp3-faq-side-actions">
            <a className="lpx-cta-mint" href={ctaHref}>
              <span>{ctaLabel}</span>
              <Icon name="arrow-up-right" className="lpx-cta-icon" />
            </a>
            <a className="lp3-faq-mail" href={`mailto:${supportEmail}`}>
              {supportLabel}: <strong>{supportEmail}</strong>
            </a>
          </div>
        </div>

        <div className="lp3-faq-list">
          {items.map((item, idx) => {
            const isOpen = openId === item.id
            const panelId = `lp3-faq-panel-${item.id}`
            return (
              <div
                key={item.id}
                className={`lp3-faq-item${isOpen ? ' is-open' : ''}`}
              >
                <button
                  type="button"
                  className="lp3-faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  <span className="lp3-faq-num">
                    {`Q${idx + 1}`}
                  </span>
                  <span className="lp3-faq-question">{item.question}</span>
                  <span className="lp3-faq-toggle" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={panelId}
                  className="lp3-faq-panel"
                  hidden={!isOpen}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
