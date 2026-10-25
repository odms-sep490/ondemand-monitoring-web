import type { OperatorMission } from '../../../types/mission'
import { formatVnDate, formatHm } from '../missionFormat'

// ─── Manager note card ────────────────────────────────────────────────────────

export function ManagerNoteCard({ mission }: { mission: OperatorMission }) {
  return (
    <div
      className="odm-card"
      style={{
        background: 'var(--yellow-bg)',
        borderColor: 'var(--yellow-dot)',
      }}
    >
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            marginBottom: 5,
            color: 'var(--yellow-fg)',
          }}
        >
          Ghi chú của quản lý · {mission.managerName ?? ''}
        </div>
        <div
          style={{ fontSize: 12.5, color: 'var(--yellow-fg)', marginBottom: 6 }}
        >
          {mission.managerNote}
        </div>
        {mission.respondBy && mission.status === 'PENDING' && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--yellow-fg)',
            }}
          >
            Hãy phản hồi trước {formatVnDate(mission.respondBy.slice(0, 10))}{' '}
            {formatHm(mission.respondBy)}
          </div>
        )}
      </div>
    </div>
  )
}
