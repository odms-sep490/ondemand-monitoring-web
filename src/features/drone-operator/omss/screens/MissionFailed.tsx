import { useI18n } from '../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../shared/types/domain'
import { missionFailedMessages } from '../i18n/missionFailed'
import type { Mission, Drone } from '../../types/omss'

interface Props {
  mission: Mission
  drone: Drone
  reason: string
  onMissions: () => void
}

export default function MissionFailed({
  mission,
  drone,
  reason,
  onMissions,
}: Props) {
  const { t, lang } = useI18n(missionFailedMessages)
  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 560 }}>
        {/* Failure header */}
        <div
          style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderRadius: 10,
            padding: '24px',
            marginBottom: 24,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line
                x1="5"
                y1="5"
                x2="15"
                y2="15"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="15"
                y1="5"
                x2="5"
                y2="15"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--red-text)',
              }}
            >
              {t.missionFailed}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--red-text)',
                opacity: 0.8,
                marginTop: 2,
              }}
            >
              {reason}
            </div>
          </div>
        </div>

        {/* Incident record */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 16,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: 12,
            }}
          >
            {t.incidentRecord}
          </div>
          {[
            ['mission', t.fields.mission, mission.id],
            ['failureReason', t.fields.failureReason, reason],
            ['drone', t.fields.drone, drone.name || drone.id],
            [
              'droneStatus',
              t.fields.droneStatus,
              getDroneStatusLabel(drone.state as DroneStatus, lang),
            ],
            [
              'operator',
              t.fields.operator,
              mission.operatorId || t.currentOperator,
            ],
            [
              'timestamp',
              t.fields.timestamp,
              new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
            ],
          ].map(([key, l, v]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                  fontFamily:
                    key === 'mission' ? 'var(--font-data)' : undefined,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Required actions */}
        <div
          style={{
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--amber-text)',
              marginBottom: 10,
            }}
          >
            {t.requiredActions}
          </div>
          {t.actions.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 6,
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--amber)',
                  minWidth: 18,
                }}
              >
                {i + 1}.
              </span>
              <span style={{ fontSize: 13, color: 'var(--amber-text)' }}>
                {a}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            {t.incidentNarrative}
          </div>
          <textarea
            value={reason}
            readOnly
            rows={4}
            aria-label={t.incidentNarrativeAria}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onMissions}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-2)',
              background: 'var(--surface)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            {t.backToMissions}
          </button>
          <button
            disabled
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--surface-2)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-3)',
            }}
          >
            {t.incidentRecorded}
          </button>
        </div>
      </div>
    </div>
  )
}
