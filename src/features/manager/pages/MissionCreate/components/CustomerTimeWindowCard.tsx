import { OrderIcon } from '../../../components/common/OrderIcon'
import { preferredRangeLabel } from '../../../lib/viLabels'
import { timePart } from '../createMissionHelpers'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderMissionBrief } from '../../../types/orders'

export function CustomerTimeWindowCard({
  brief,
}: {
  brief: OrderMissionBrief
}) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="calendar" size={18} />
          {t.customerTimeWindow}
        </span>
      </header>
      <div className="odm-or-card-body">
        <div className="odm-or-bigvalue">
          {preferredRangeLabel(
            brief.preferredDateFrom || brief.preferredDate,
            brief.preferredDateTo,
            brief.preferredTimeName,
          )}
          {timePart(brief.preferredDateFrom)
            ? ` · ${timePart(brief.preferredDateFrom)}${timePart(brief.preferredDateTo) ? `–${timePart(brief.preferredDateTo)}` : ''}`
            : ''}
        </div>
        <p className="odm-or-muted">{t.customerTimeWindowHint}</p>
      </div>
    </section>
  )
}
