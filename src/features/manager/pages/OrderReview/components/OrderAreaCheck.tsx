import { useEffect, useState } from 'react'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import type { LegalReviewStatus, OrderDetail } from '../../../types/orders'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { OrderLocationCard } from './OrderLocationCard'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'
import { areaReviewFromOrder, riskLabel } from '../areaHelpers'
import { useCachedAreaAssessment } from '../useCachedAreaAssessment'
import { AreaReviewDialog } from './AreaReviewDialog'
import { AreaAssessmentBody } from './AreaAssessmentBody'

export function OrderAreaCheck({
  order,
  t,
  onReviewSaved,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  onReviewSaved?: (status: LegalReviewStatus) => void
}) {
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
  const findings = data?.assessment.findings.filter(
    (item) =>
      !item.code.includes('UNAVAILABLE') &&
      item.code !== 'RESTRICTED_ZONE_DATA_MISSING',
  )
  const ministryViolatedZones = data?.ministryFlightBan?.available
    ? data.ministryFlightBan.violatedZones
    : []
  const hasMinistryViolations = ministryViolatedZones.length > 0
  const hasAssessmentData = Boolean(
    data &&
    (data.ministryFlightBan?.available ||
      data.restrictedZones.dataAvailable ||
      data.elevation.available ||
      data.osmContext.available),
  )

  return (
    <section className="odm-or-area-check" aria-label="Kiểm tra vùng giám sát">
      <div className="odm-or-area-check-head">
        <div>
          <h2>Kiểm tra vùng giám sát</h2>
          <p>
            Giúp xác định khu vực có cần kiểm tra thêm trước khi duyệt đơn hay
            không. Kết quả này chỉ là cảnh báo sơ bộ, không tự động từ chối đơn.
          </p>
        </div>
        {data && hasAssessmentData ? (
          <span
            className={`odm-or-area-risk is-${data.assessment.level.toLowerCase()}`}
          >
            {riskLabel(data.assessment.level)}
          </span>
        ) : null}
      </div>

      <div className="odm-or-area-check-grid">
        <OrderLocationCard order={order} t={t} showAreaAddress />
        <section className="odm-or-card">
          <header className="odm-or-card-head">
            <span className="odm-or-card-title odm-or-area-title">
              <span className="odm-or-area-title-icon" aria-hidden="true">
                <OrderIcon name="chart" size={20} />
              </span>
              Kết quả kiểm tra khu vực
            </span>
            {order.status === 'PENDING' ? (
              <button
                type="button"
                className={`odm-or-area-refresh${assessment.loading ? ' is-loading' : ''}`}
                onClick={assessment.reload}
                disabled={assessment.loading}
                aria-label={
                  assessment.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại'
                }
                title={assessment.loading ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
              >
                <OrderIcon name="refresh" size={18} />
              </button>
            ) : null}
          </header>
          <div className="odm-or-card-body odm-or-area-results">
            {!resolved || radiusM <= 0 ? (
              <p className="odm-or-empty">
                Đơn chưa có đủ tọa độ hoặc bán kính để kiểm tra vùng.
              </p>
            ) : assessment.error ? (
              <p className="odm-or-area-error" role="alert">
                Không tải được kết quả kiểm tra vùng. Vui lòng thử lại.
              </p>
            ) : assessment.loading && !data ? (
              <p className="odm-or-empty">Đang phân tích vùng giám sát…</p>
            ) : data ? (
              <AreaAssessmentBody
                data={data}
                hasMinistryViolations={hasMinistryViolations}
                ministryViolatedZones={ministryViolatedZones}
                findings={findings}
                hasAssessmentData={hasAssessmentData}
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
