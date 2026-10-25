import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { mediaSource, type LandingMediaId } from '../media'
import { productMessages } from './productMessages'

// Decorative stock imagery is always labeled as illustration by its parent.
// Only transform/opacity animate; the journey's playback control pauses them.
export function InspectionMedia({
  variant = 'area',
  image = 'construction',
  eager = false,
}: {
  variant?: 'request' | 'area' | 'inspection' | 'report'
  image?: LandingMediaId
  eager?: boolean
}) {
  const { t } = useI18n(productMessages)
  return (
    <div
      className={`lp-site-media lp-site-media--${variant}`}
      aria-hidden="true"
    >
      <img
        {...mediaSource(image)}
        sizes="(max-width: 620px) 120vw, 760px"
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className="lp-media-shade" />
      <span className="lp-media-tag">
        <i /> {t.visual.illustrative}
      </span>
      <span className="lp-media-corner lp-media-corner--tl" />
      <span className="lp-media-corner lp-media-corner--tr" />
      <span className="lp-media-corner lp-media-corner--bl" />
      <span className="lp-media-corner lp-media-corner--br" />
      {variant === 'request' && (
        <span className="lp-request-location">
          <Icon name="map-pin" />
          <span>
            <small>{t.visual.area}</small>
            <strong>{t.visual.site}</strong>
          </span>
        </span>
      )}
      {variant === 'area' && (
        <svg
          className="lp-area-boundary"
          viewBox="0 0 500 360"
          preserveAspectRatio="none"
        >
          <path d="M85 85 365 55 430 245 125 290Z" />
          <circle cx="85" cy="85" r="5" />
          <circle cx="365" cy="55" r="5" />
          <circle cx="430" cy="245" r="5" />
          <circle cx="125" cy="290" r="5" />
        </svg>
      )}
      {variant === 'inspection' && (
        <>
          <span className="lp-media-scan" />
          <svg
            className="lp-media-route"
            viewBox="0 0 500 360"
            preserveAspectRatio="none"
          >
            <path d="M75 95H405V170H110V245H375" />
          </svg>
          <span className="lp-media-target">
            <i />
            <Icon name="search" />
          </span>
        </>
      )}
      {variant === 'report' && (
        <span className="lp-media-annotation">
          <b>01</b>
        </span>
      )}
      <div className="lp-media-caption">
        <span className="lp-media-caption-icon">
          <Icon name={variant === 'report' ? 'camera' : 'map-pin'} />
        </span>
        <span>
          <small>
            {variant === 'report' ? t.visual.imageLabel : t.visual.area}
          </small>
          <strong>{t.visual.site}</strong>
        </span>
        <span className="lp-media-index">
          {variant === 'report' ? '01 / 03' : '04'}
        </span>
      </div>
    </div>
  )
}
