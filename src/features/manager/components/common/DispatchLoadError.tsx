import type { Mission } from '../../../mission/types/mission'
import { OrderIcon } from './OrderIcon'
import { missionStatusLabel } from './liveDispatchHelpers'
import { managerHref } from '../../routes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'

export function DispatchLoadError({
  current,
  scheduleText,
  assignedDeviceText,
}: {
  current: Mission
  scheduleText: string
  assignedDeviceText: string
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  return (
    <section className="odm-or-card">
      <div className="odm-or-card-body odm-or-result">
        <span className="odm-or-result-icon" aria-hidden="true">
          <OrderIcon name="check" size={26} />
        </span>
        <h2 className="odm-or-result-title">{t.assignedTitle}</h2>
        <p className="odm-or-muted">
          {t.assignedBody(
            current.missionCode,
            missionStatusLabel(current.status, t.missionStatuses),
          )}
        </p>
        <dl className="odm-or-summary-list odm-or-result-list">
          <div>
            <dt>
              <OrderIcon name="calendar" size={16} />
              {t.scheduleLabel}
            </dt>
            <dd>{scheduleText}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="drone" size={16} />
              {t.assignedDevice}
            </dt>
            <dd>{assignedDeviceText}</dd>
          </div>
        </dl>
        <div className="odm-or-result-actions">
          <a
            className="odm-or-btn odm-or-btn-ghost"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.backToOrders}
          </a>
          <a
            className="odm-or-btn odm-or-btn-primary"
            href={managerHref({
              screen: 'missions',
              missionId: current.id,
            })}
          >
            {t.viewMission}
            <OrderIcon name="chevron-right" size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
