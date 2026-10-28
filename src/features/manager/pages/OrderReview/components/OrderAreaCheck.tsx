import { useEffect, useState } from 'react'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import type { LegalReviewStatus, OrderDetail } from '../../../types/orders'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { OrderLocationCard } from './OrderLocationCard'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'
import { areaReviewFromOrder } from '../areaHelpers'
import { useCachedAreaAssessment } from '../useCachedAreaAssessment'
import { AreaReviewDialog } from './AreaReviewDialog'
import { AreaAssessmentBody } from './AreaAssessmentBody'
import { useI18n } from '../../../../../shared/i18n'
import { orderAreaCheckMessages } from './OrderAreaCheck.messages'

export function OrderAreaCheck({
  order,
  t,
  onReviewSaved,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  onReviewSaved?: (status: LegalReviewStatus) => void
}) {
  const { t: ta } = useI18n(orderAreaCheckMessages)
  const [review, setReview] = useState(() => areaReviewFromOrder(order))
  const [reviewOpen, setReviewOpen] = useState(false)
  useEffect(() => {
    setReview(areaReviewFromOrder(order))
  }, [
    order.id,
    order.legalReviewStatus,
    order.requestedScopeFeasible,
    order.flightAreaReviewReason,
    order.flightAreaReviewNote,
    order.flightAreaReviewedByName,
    order.flightAreaReviewedAt,
    order.updatedAt,
  ])
  const resolved = resolveOrderGpsCenter(order.center)
  const latitude = resolved?.center.lat
  const longitude = resolved?.center.lon
  const radiusM = order.radiusM ?? 0
  const altitudeM = order.altitudeM ?? undefined
  const assessment = useCachedAreaAssessment({
    latitude,
    longitude,
    radiusM,
    altitudeM,
  })

  const data = assessment.data
  const ministryViolatedZones = data?.ministryFlightBan?.available
    ? data.ministryFlightBan.violatedZones
    : []
  const hasMinistryViolations = ministryViolatedZones.length > 0

  return (
    <section className="odm-or-area-check" aria-label={ta.title}>
      <div className="odm-or-area-check-head">
        <div>
          <h2>{ta.title}</h2>
          <p>{ta.intro}</p>
        </div>
      </div>

      <div className="odm-or-area-check-grid">
        <OrderLocationCard order={order} t={t} showAreaAddress />
        <section className="odm-or-card">
          <header className="odm-or-card-head">
            <span className="odm-or-card-title odm-or-area-title">
              <span className="odm-or-area-title-icon" aria-hidden="true">
                <OrderIcon name="chart" size={20} />
              </span>
              {ta.resultTitle}
            </span>
            {order.status === 'PENDING' ? (
              <button
                type="button"
                className={`odm-or-area-refresh${assessment.loading ? ' is-loading' : ''}`}
                onClick={assessment.reload}
                disabled={assessment.loading}
                aria-label={assessment.loading ? ta.checking : ta.recheck}
                title={assessment.loading ? ta.checking : ta.recheck}
              >
                <OrderIcon name="refresh" size={18} />
              </button>
            ) : null}
          </header>
          <div className="odm-or-card-body odm-or-area-results">
            {!resolved || radiusM <= 0 ? (
              <p className="odm-or-empty">{ta.missingCoords}</p>
            ) : assessment.error ? (
              <p className="odm-or-area-error" role="alert">
                {ta.loadFailed}
              </p>
            ) : assessment.loading && !data ? (
              <p className="odm-or-empty">{ta.analyzing}</p>
            ) : data ? (
              <AreaAssessmentBody
                data={data}
                hasMinistryViolations={hasMinistryViolations}
                ministryViolatedZones={ministryViolatedZones}
                order={order}
                review={review}
                setReviewOpen={setReviewOpen}
              />
            ) : null}
          </div>
        </section>
      </div>
      {reviewOpen ? (
        <AreaReviewDialog
          order={order}
          initial={review}
          zoneCount={ministryViolatedZones.length}
          onClose={() => setReviewOpen(false)}
          onSaved={(next) => {
            setReview(next)
            setReviewOpen(false)
            onReviewSaved?.(next.status)
          }}
        />
      ) : null}
    </section>
  )
}
