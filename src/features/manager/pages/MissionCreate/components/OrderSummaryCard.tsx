import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderIconName } from '../../../components/common/OrderIcon'
import type { ReactNode } from 'react'
import type { OrderMissionBrief } from '../../../types/orders'

export function OrderSummaryCard({
  summaryRows,
  brief,
  localizeMediaLabel,
}: {
  summaryRows: { icon: OrderIconName; label: string; value: ReactNode }[]
  brief: OrderMissionBrief
  localizeMediaLabel: (label: string) => string
}) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {t.orderSummary}
        </span>
      </header>
      <dl className="odm-or-card-body odm-or-summary-list">
        {summaryRows.map((row) => (
          <div key={row.label}>
            <dt>
              <OrderIcon name={row.icon} size={16} />
              {row.label}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        {brief.mediaRequirements && brief.mediaRequirements.length > 0 ? (
          <div>
            <dt>
              <OrderIcon name="media" size={16} />
              {t.mediaLabel}
            </dt>
            <dd className="odm-or-info-lines">
              {brief.mediaRequirements.map((req, i) => (
                <span key={i}>{localizeMediaLabel(req.label)}</span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
