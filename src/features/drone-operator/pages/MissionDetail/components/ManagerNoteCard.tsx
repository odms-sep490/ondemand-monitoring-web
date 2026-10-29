import type { OperatorMission } from '../../../types/mission'
import { formatVnDate, formatHm } from '../missionFormat'

// ─── Manager note card ────────────────────────────────────────────────────────

export function ManagerNoteCard({ mission }: { mission: OperatorMission }) {
  return (
    <section
      className="odm-card"
      aria-labelledby="mission-manager-note-heading"
      style={{
        background: 'var(--yellow-bg)',
        borderColor: 'var(--yellow-dot)',
      }}
    >
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <h2
          id="mission-manager-note-heading"
          className="mds-note-heading"
          style={{
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 5,
            color: 'var(--yellow-fg)',
          }}
        >
          Ghi chú của quản lý · {mission.managerName ?? ''}
        </h2>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--yellow-fg)',
            marginBottom: 6,
          }}
        >
          {mission.managerNote}
        </div>
        {mission.respondBy && mission.status === 'PENDING' && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--yellow-fg)',
            }}
          >
            Hãy phản hồi trước {formatVnDate(mission.respondBy.slice(0, 10))}{' '}
            {formatHm(mission.respondBy)}
          </div>
        )}
      </div>
    </section>
  )
}
