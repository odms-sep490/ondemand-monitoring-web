import { useI18n } from '../../../../shared/i18n'
import { missionCompletedMessages } from '../i18n/missionCompleted'
import type { Mission, Drone } from '../../types/omss'

interface Props {
  mission: Mission
  drone: Drone
  onMedia: () => void
  onMissions: () => void
}

export default function MissionCompleted({
  mission,
  drone,
  onMedia,
  onMissions,
}: Props) {
  const { t } = useI18n(missionCompletedMessages)
  const stats = [
    { key: 'flightTime', l: t.statLabels.flightTime, v: '42:18', u: 'mm:ss' },
    { key: 'distance', l: t.statLabels.distance, v: '4.1', u: 'km' },
    { key: 'maxAltitude', l: t.statLabels.maxAltitude, v: '48.2', u: 'm AGL' },
    { key: 'avgSpeed', l: t.statLabels.avgSpeed, v: '8.4', u: 'm/s' },
    {
      key: 'batteryUsed',
      l: t.statLabels.batteryUsed,
      v: '61%',
      u: t.statUnits.consumed,
    },
    { key: 'photos', l: t.statLabels.photos, v: '847', u: t.statUnits.files },
    {
      key: 'video',
      l: t.statLabels.video,
      v: '42:18',
      u: t.statUnits.duration,
    },
    { key: 'mediaSize', l: t.statLabels.mediaSize, v: '4.2', u: 'GB' },
  ]

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 600 }}>
        {/* Success hero */}
        <div
          style={{
            background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
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
              background: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <polyline
                points="4,11 9,16 18,6"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--green-text)',
              }}
            >
              {t.missionCompleted}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--green-text)',
                opacity: 0.8,
                marginTop: 2,
              }}
            >
              {mission.title} · {mission.id}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            marginBottom: 16,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: 16,
            }}
          >
            {t.missionStatistics}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 16,
            }}
          >
            {stats.map((s) => (
              <div key={s.key}>
                <div
                  style={{
                    fontSize: 22,
                    fontFamily: 'var(--font-data)',
                    fontWeight: 700,
                    color: 'var(--text)',
                    lineHeight: 1,
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}
                >
                  {s.u}
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Record */}
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
            {t.missionRecord}
          </div>
          {[
            ['mission', t.fields.mission, mission.id],
            ['customer', t.fields.customer, mission.customer],
            ['drone', t.fields.drone, drone.name || drone.id],
            [
              'operator',
              t.fields.operator,
              mission.operatorId || t.currentOperator,
            ],
            ['postflight', t.fields.postflight, t.inspectionCompleted],
            ['media', t.fields.media, t.openMediaReview],
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

        {/* Media prompt */}
        <div
          style={{
            background: 'var(--blue-bg)',
            border: '1px solid var(--blue-border)',
            borderRadius: 8,
            padding: '14px',
            marginBottom: 20,
            fontSize: 14,
            color: 'var(--blue-text)',
          }}
        >
          <strong>{t.nextStep}</strong> {t.nextStepBody(847, '4.2')}
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
            onClick={onMedia}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {t.uploadMissionMedia}
          </button>
        </div>
      </div>
    </div>
  )
}
