import type { Mission } from '../../../mission/types/mission'
import { OrderIcon } from './OrderIcon'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { AvailableDrone } from '../../../staff/api/droneApi'

export function DispatchReviewStep({
  current,
  scheduleText,
  roleSummary,
  selectedDrones,
  missingRoles,
}: {
  current: Mission
  scheduleText: string
  roleSummary: { role: MissionStaffRole; names: string[] }[]
  selectedDrones: AvailableDrone[]
  missingRoles: number
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="check" size={18} />
          {t.readyToAssign}
        </span>
      </header>
      <div className="odm-or-card-body mgr-stack">
        <p className="odm-or-muted mgr-flush">{t.confirmBody}</p>
        <dl className="odm-or-summary-list">
          <div>
            <dt>
              <OrderIcon name="doc" size={16} />
              {t.orderTitle}
            </dt>
            <dd>{current.orderTitle ?? '—'}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="service" size={16} />
              {t.missionImplementation}
            </dt>
            <dd>{current.missionCode}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="calendar" size={16} />
              {t.scheduleLabel}
            </dt>
            <dd>{scheduleText}</dd>
          </div>
          {roleSummary.map((item) => (
            <div key={item.role}>
              <dt>
                <OrderIcon name="user" size={16} />
                {t.roles[item.role]}
              </dt>
              <dd>
                {item.names.length > 0 ? item.names.join(', ') : t.notSelected}
              </dd>
            </div>
          ))}
          <div>
            <dt>
              <OrderIcon name="drone" size={16} />
              {t.step2}
            </dt>
            <dd>
              {selectedDrones.length > 0
                ? selectedDrones.map((drone) => drone.label).join(', ')
                : t.notSelected}
            </dd>
          </div>
        </dl>
        <ul className="odm-or-checklist" aria-label={t.checklist}>
          <li className={missingRoles === 0 ? 'is-ok' : 'is-bad'}>
            <OrderIcon
              name={missingRoles === 0 ? 'check' : 'alert'}
              size={16}
            />
            {missingRoles === 0
              ? t.rolesComplete
              : t.rolesMissing(missingRoles)}
          </li>
          <li className={selectedDrones.length > 0 ? 'is-ok' : 'is-bad'}>
            <OrderIcon
              name={selectedDrones.length > 0 ? 'check' : 'alert'}
              size={16}
            />
            {selectedDrones.length > 0
              ? t.deviceSelectedCount(selectedDrones.length)
              : t.deviceMissing}
          </li>
        </ul>
      </div>
    </section>
  )
}
