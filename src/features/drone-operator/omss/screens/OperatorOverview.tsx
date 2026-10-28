import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../../shared/types/domain'
import { operatorOverviewMessages } from '../i18n/operatorOverview'
import type { Mission } from '../../types/omss'

interface Props {
  allMissions: Mission[]
  operatorName: string
  operatorId: string
  onGoMissions: () => void
  onGoMission: (m: Mission) => void
}

const TERMINAL_STATES = new Set(['COMPLETED', 'FAILED', 'CANCELLED'])

function formatSchedule(value: string, notScheduledLabel: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? notScheduledLabel
    : date.toLocaleString()
}

const RESULT_CFG = {
  completed: {
    color: 'var(--green-text)',
    dot: 'var(--green)',
  },
  failed: { color: 'var(--red-text)', dot: 'var(--red)' },
  cancelled: {
    color: 'var(--text-3)',
    dot: 'var(--text-3)',
  },
}

export default function OperatorOverview({
  allMissions,
  operatorName,
  operatorId,
  onGoMissions,
  onGoMission,
}: Props) {
  const { t, lang, locale } = useI18n(operatorOverviewMessages)
  const activeMission = allMissions.find(
    (m) =>
      m.state === 'WAITING_OPERATOR_ACCEPTANCE' ||
      m.state === 'READY',
  )
  const assignedMission = allMissions.find(
    (mission) => mission.droneId && !TERMINAL_STATES.has(mission.state),
  )
  const droneId = assignedMission?.droneId
  const STATS = [
    {
      label: t.stats.assignedMissions,
      value: String(allMissions.length),
      sub: t.stats.assignedMissionsSub,
    },
    {
      label: t.stats.awaitingAcceptance,
      value: String(
        allMissions.filter(
          (mission) =>
            mission.state === 'WAITING_OPERATOR_ACCEPTANCE' ||
            mission.state === 'READY',
        ).length,
      ),
      sub: t.stats.awaitingAcceptanceSub,
    },
    {
      label: t.stats.activeFlights,
      value: String(
        allMissions.filter((mission) =>
          ['IN_FLIGHT', 'RETURNING'].includes(mission.state),
        ).length,
      ),
      sub: t.stats.activeFlightsSub,
    },
    {
      label: t.stats.missionsCompleted,
      value: String(
        allMissions.filter((mission) => mission.state === 'COMPLETED').length,
      ),
      sub: t.stats.missionsCompletedSub,
    },
  ]
  const UPCOMING = allMissions
    .filter((mission) => !TERMINAL_STATES.has(mission.state))
    .slice(0, 5)
    .map((mission) => ({
      id: mission.id,
      title: mission.title,
      time: formatSchedule(mission.scheduledAt, t.notScheduled),
      loc: mission.location,
      priority: mission.priority,
    }))
  const RECENT = allMissions
    .filter((mission) => TERMINAL_STATES.has(mission.state))
    .slice(0, 5)
    .map((mission) => ({
      id: mission.id,
      title: mission.title,
      date: formatSchedule(mission.scheduledAt, t.notScheduled),
      result: mission.state.toLowerCase() as
        'completed' | 'failed' | 'cancelled',
    }))

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            {t.welcome(operatorName)}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            {new Date().toLocaleDateString(locale)} · {t.operatorId}:{' '}
            {operatorId}
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 18px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-2)',
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: 'var(--font-data)',
                  color: 'var(--text)',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Active / pending alert */}
            {activeMission && (
              <div
                style={{
                  background: 'var(--amber-bg)',
                  border: '1px solid var(--amber-border)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--amber-text)',
                      marginBottom: 3,
                    }}
                  >
                    {t.missionAwaiting}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--amber-text)',
                      opacity: 0.8,
                    }}
                  >
                    {activeMission.id} · {activeMission.title}
                  </div>
                </div>
                <button
                  onClick={() => onGoMission(activeMission)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--amber)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginLeft: 16,
                  }}
                >
                  {t.reviewNow}
                </button>
              </div>
            )}

            {/* Upcoming missions */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}
                >
                  {t.upcomingToday}
                </span>
                <button
                  onClick={onGoMissions}
                  style={{
                    fontSize: 12,
                    color: 'var(--accent)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {t.viewAllMissions}
                </button>
              </div>
              {UPCOMING.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom:
                      i < UPCOMING.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                  }}
                >
                  <div
                    style={{ width: 42, textAlign: 'center', flexShrink: 0 }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-data)',
                        color: 'var(--text)',
                      }}
                    >
                      {m.time}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {t.today}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 1,
                      height: 32,
                      background: 'var(--border)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-2)',
                        marginTop: 2,
                      }}
                    >
                      {m.loc}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          m.priority === 'HIGH'
                            ? 'var(--amber-text)'
                            : 'var(--text-3)',
                        background:
                          m.priority === 'HIGH'
                            ? 'var(--amber-bg)'
                            : 'var(--surface-2)',
                        border: `1px solid ${m.priority === 'HIGH' ? 'var(--amber-border)' : 'var(--border)'}`,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {m.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {t.recentMissions}
              </div>
              {RECENT.map((m, i) => {
                const cfg = RESULT_CFG[m.result]
                const resultLabel = getMissionStatusLabel(
                  m.result.toUpperCase() as MissionStatus,
                  lang,
                )
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '11px 20px',
                      borderBottom:
                        i < RECENT.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: cfg.dot,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-3)',
                          marginTop: 2,
                        }}
                      >
                        {m.date}
                      </div>
                    </div>
                    <span
                      style={{ fontSize: 12, color: cfg.color, flexShrink: 0 }}
                    >
                      {resultLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-data)',
                        color: 'var(--text-3)',
                        flexShrink: 0,
                      }}
                    >
                      {m.id}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right column — drone assignment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {t.assignedDrone}
              </div>
              <div style={{ padding: '16px' }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 2,
                  }}
                >
                  {droneId ?? t.noDroneAssigned}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-2)',
                    marginBottom: 14,
                  }}
                >
                  {assignedMission
                    ? t.missionRef(assignedMission.id)
                    : t.selectMissionHint}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-2)',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                  }}
                >
                  {t.liveTelemetryHint}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                {t.quickActions}
              </div>
              {[{ label: t.viewAllMissions, action: onGoMissions }].map(
                (q, i) => (
                  <button
                    key={i}
                    onClick={q.action}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--text)',
                      textAlign: 'left',
                    }}
                  >
                    {q.label}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 2l5 5-5 5" />
                    </svg>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
