import { useI18n } from '../../../../shared/i18n'
import { busyScheduleMessages } from '../../../busy-schedule/busySchedule.messages'
import { StaffAvatar } from './StaffAvatar'
import { unavailableStaffMessages } from './UnavailableStaffOptions.messages'
import type { UnavailableOperator } from './dispatchUnavailableStaff'

/** Disabled picker rows for staff the BE excluded from the available list. */
export function UnavailableStaffOptions({
  items,
}: {
  items: UnavailableOperator[]
}) {
  const { t } = useI18n(unavailableStaffMessages)
  const { t: b } = useI18n(busyScheduleMessages)
  if (items.length === 0) return null
  return (
    <div role="group" aria-label={t.heading}>
      <div className="mgr-pk-empty">{t.heading}</div>
      {items.map((item) => {
        const busy = item.busySessions.length > 0
        const detail = busy
          ? t.busyDetail(
              item.busySessions
                .map(
                  (s) =>
                    `${b.sessionsShort[s.session]} ${s.date.slice(8)}/${s.date.slice(5, 7)}`,
                )
                .join(', '),
            )
          : t.missionDetail
        return (
          <button
            key={item.id}
            type="button"
            className="mgr-pk-option is-unavailable"
            disabled
            aria-disabled="true"
          >
            <StaffAvatar staff={item} />
            <span className="mgr-pk-text">
              <span className="mgr-pk-name-row">
                <span className="mgr-pk-name">{item.fullName}</span>
                <span className="mgr-pk-roletag">
                  {busy ? t.badgeBusy : t.badgeMission}
                </span>
              </span>
              <span className="mgr-pk-sub">{detail}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
