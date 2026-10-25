import { useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { productMessages, productTabs } from './productMessages'
import { InspectionMedia } from './InspectionMedia'
import { mediaSource } from '../media'
import { useViewportActivity } from './useViewportActivity'

export function ProductShowcase() {
  const { t } = useI18n(productMessages)
  const [active, setActive] = useState<(typeof productTabs)[number]>('request')
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useViewportActivity(ref)
  const reduced = useReducedMotion()
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!inView || reduced || held) return
    const timer = window.setTimeout(
      () =>
        setActive(
          (current) =>
            productTabs[
              (productTabs.indexOf(current) + 1) % productTabs.length
            ],
        ),
      6000,
    )
    return () => window.clearTimeout(timer)
  }, [active, inView, reduced, held])
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = productTabs.indexOf(active)
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % productTabs.length
        : event.key === 'ArrowLeft'
          ? (index + productTabs.length - 1) % productTabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? productTabs.length - 1
              : -1
    if (next < 0) return
    event.preventDefault()
    const selected = productTabs[next]
    setActive(selected)
    document.getElementById(`${id}-tab-${selected}`)?.focus()
  }
  return (
    <div
      className="lp-product-showcase"
      ref={ref}
      data-media-motion={inView && !held}
      onFocusCapture={(event) => {
        if (event.target.matches(':focus-visible')) setHeld(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setHeld(false)
      }}
    >
      <div className="lp-product-tabs" role="tablist" aria-label={t.label}>
        {productTabs.map((tab) => (
          <button
            key={tab}
            id={`${id}-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={active === tab}
            aria-controls={`${id}-panel`}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={onKeyDown}
          >
            <span>
              <b className="lp-product-tab-index">
                0{productTabs.indexOf(tab) + 1}
              </b>
              {t.tabs[tab].label}
              <Icon name="arrow-up-right" />
            </span>
            <small>{t.tabs[tab].description}</small>
          </button>
        ))}
      </div>
      <div
        key={active}
        className="lp-product-panel"
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
      >
        <span className="lp-product-panel-kicker">{t.panelLabel}</span>
        <h3>{t.tabs[active].title}</h3>
        <p>{t.tabs[active].body}</p>
        <div
          className={`lp-product-visual lp-product-visual--${active}`}
          aria-hidden="true"
        >
          <InspectionMedia
            variant={
              active === 'request'
                ? 'request'
                : active === 'progress'
                  ? 'inspection'
                  : 'report'
            }
          />
          {active === 'request' && (
            <div className="lp-floating-card lp-request-summary">
              <span className="lp-floating-icon">
                <Icon name="clipboard" />
              </span>
              <small>{t.visual.requestReady}</small>
              <strong>{t.visual.objective}</strong>
              <span className="lp-summary-location">
                <Icon name="map-pin" />
                {t.visual.site}
              </span>
              <span className="lp-summary-ready">
                <Icon name="check" />
                {t.visual.review}
              </span>
            </div>
          )}
          {active === 'progress' && (
            <div className="lp-floating-card lp-progress-summary">
              <span className="lp-floating-icon">
                <Icon name="activity" />
              </span>
              <small>{t.visual.fieldUpdate}</small>
              <ol>
                {[
                  t.visual.scopeConfirmed,
                  t.visual.inspection,
                  t.visual.reportPending,
                ].map((label, index) => (
                  <li
                    className={
                      index === 0 ? 'is-done' : index === 1 ? 'is-current' : ''
                    }
                    key={index}
                  >
                    <span>
                      {index === 0 ? <Icon name="check" /> : index + 1}
                    </span>
                    <b>{label}</b>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {active === 'report' && (
            <div className="lp-floating-card lp-report-summary">
              <span className="lp-floating-icon">
                <Icon name="file-text" />
              </span>
              <small>{t.visual.reportTitle}</small>
              <strong>{t.visual.finding}</strong>
              <p>{t.visual.findingCopy}</p>
              <div className="lp-report-thumbnails">
                <img
                  {...mediaSource('construction')}
                  sizes="90px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <img
                  {...mediaSource('construction')}
                  className="lp-report-detail-thumb"
                  sizes="90px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span>
                  <Icon name="camera" />
                  {t.visual.images}
                </span>
              </div>
              <span className="lp-summary-ready">
                <Icon name="check" />
                {t.visual.notes}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
