import { OrderIcon } from '../../../components/common/OrderIcon'
import type { MinistryFlightBan } from '../areaTypes'
import { useI18n } from '../../../../../shared/i18n'
import { areaDecisionSummaryMessages } from './AreaDecisionSummary.messages'

export function AreaDecisionSummary({
  ministry,
}: {
  ministry: MinistryFlightBan
}) {
  const { t } = useI18n(areaDecisionSummaryMessages)
  const hasConflict =
    ministry.violatedZones.length > 0 ||
    (ministry.violatedAreaSquareMeters ?? 0) > 0
  const level = hasConflict ? 'needs_review' : 'favorable'
  const title = hasConflict ? t.conflictTitle : t.clearTitle
  const guidance = hasConflict ? t.conflictGuidance : t.clearGuidance

  return (
    <div className={`odm-or-area-decision is-${level}`}>
      <span className="odm-or-area-decision-icon" aria-hidden="true">
        <OrderIcon name={hasConflict ? 'alert' : 'check'} size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{guidance}</p>
      </div>
    </div>
  )
}
