import { useI18n } from '../../../../../shared/i18n'
import { availabilityPageMessages } from '../AvailabilityPage.messages'

const fmt = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

export function WeekNav({
  weekStart,
  weekEnd,
  onShift,
  onToday,
}: {
  weekStart: string
  weekEnd: string
  onShift: (weeks: number) => void
  onToday: () => void
}) {
  const { t } = useI18n(availabilityPageMessages)
  return (
    <div className="odm-opr-week-nav">
      <button
        type="button"
        className="odm-btn odm-btn-sm"
        aria-label={t.prevWeek}
        onClick={() => onShift(-1)}
      >
        ‹
      </button>
      <span style={{ fontWeight: 600, fontSize: 13.5 }}>
        {t.weekLabel(fmt(weekStart), fmt(weekEnd))}
      </span>
      <button
        type="button"
        className="odm-btn odm-btn-sm"
        aria-label={t.nextWeek}
        onClick={() => onShift(1)}
      >
        ›
      </button>
      <button type="button" className="odm-btn odm-btn-sm" onClick={onToday}>
        {t.thisWeek}
      </button>
    </div>
  )
}
