import { AreaDecisionSummary } from './AreaDecisionSummary'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { openMinistryMap } from '../areaHelpers'
import { ManagerAreaReview } from './ManagerAreaReview'
import type { OrderDetail } from '../../../types/orders'
import type { ManagerAreaAssessment, SavedAreaReview } from '../areaTypes'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { areaAssessmentBodyMessages } from './AreaAssessmentBody.messages'

export function AreaAssessmentBody({
  data,
  hasMinistryViolations,
  ministryViolatedZones,
  order,
  review,
  setReviewOpen,
}: {
  data: ManagerAreaAssessment
  hasMinistryViolations: boolean
  ministryViolatedZones: string[]
  order: OrderDetail
  review: SavedAreaReview | null
  setReviewOpen: Dispatch<SetStateAction<boolean>>
}) {
  const { t } = useI18n(areaAssessmentBodyMessages)
  const ministry = data.ministryFlightBan?.available
    ? data.ministryFlightBan
    : undefined
  return (
    <>
      {ministry ? <AreaDecisionSummary ministry={ministry} /> : null}
      {hasMinistryViolations ? (
        <div className="odm-or-area-findings">
          <strong>{t.zonesToCheck}</strong>
          <ul>
            {ministryViolatedZones.map((zone) => (
              <li key={zone} className="is-high odm-or-area-zone-row">
                <code>{zone}</code>
                <button
                  type="button"
                  className="odm-or-area-zone-link"
                  title={t.openMapTitle(zone)}
                  onClick={() => openMinistryMap(zone)}
                >
                  {t.viewOnMap}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {ministry ? (
        <a
          className="odm-or-area-source"
          href={ministry.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <OrderIcon name="plane" size={18} />
          <span>{t.openMinistryMap}</span>
          <OrderIcon name="chevron-right" size={18} />
        </a>
      ) : null}
      <ManagerAreaReview
        order={order}
        review={review}
        onEdit={() => setReviewOpen(true)}
      />
    </>
  )
}
