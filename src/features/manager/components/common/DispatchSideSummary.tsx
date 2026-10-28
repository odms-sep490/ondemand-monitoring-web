import type { Mission, MissionStaffRole } from '../../../mission/types/mission'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import { Card, StatusBadge } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { missionStatusLabel } from './liveDispatchHelpers'

/** Sidebar cards: mission summary and what is selected so far. */
export function DispatchSideSummary({
  current,
  scheduleText,
  roleSummary,
  selectedDrones,
  showSelection = true,
}: {
  current: Mission
  scheduleText: string
  roleSummary: { role: MissionStaffRole; names: string[] }[]
  selectedDrones: AvailableDrone[]
  /** The confirm step already lists the selection in its main column. */
  showSelection?: boolean
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  return (
    <>
      <Card title={t.sideMission}>
        <dl className="mgr-kv">
          <div className="mgr-kv-row">
            <dt>{t.missionImplementation}</dt>
            <dd>{current.missionCode}</dd>
          </div>
          <div className="mgr-kv-row">
            <dt>{t.status}</dt>
            <dd>
              <StatusBadge tone="info">
                {missionStatusLabel(current.status, t.missionStatuses)}
              </StatusBadge>
            </dd>
          </div>
          <div className="mgr-kv-row">
            <dt>{t.scheduleLabel}</dt>
            <dd>{scheduleText}</dd>
          </div>
        </dl>
      </Card>
      {showSelection ? (
        <Card title={t.sideSelection}>
          <dl className="mgr-kv">
            {roleSummary.map((item) => (
              <div className="mgr-kv-row" key={item.role}>
                <dt>{t.roles[item.role]}</dt>
                <dd>
                  {item.names.length > 0
                    ? item.names.join(', ')
                    : t.notSelected}
                </dd>
              </div>
            ))}
            <div className="mgr-kv-row">
              <dt>{t.step2}</dt>
              <dd>
                {selectedDrones.length > 0
                  ? selectedDrones.map((drone) => drone.label).join(', ')
                  : t.notSelected}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </>
  )
}
