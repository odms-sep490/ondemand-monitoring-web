import { useI18n } from '../../../../shared/i18n'
import { missionListMessages } from '../i18n/missionList'
import type { Mission, Screen } from '../../types/omss'
import { MissionBadge, PriorityBadge } from '../components/StatusBadge'

interface Props {
  missions: Mission[]
  onSelect: (m: Mission) => void
  onScreen: (s: Screen) => void
}

function fmtDate(iso: string, locale: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  )
}

const PENDING_STATES = new Set([
  'WAITING_CREW_CONFIRMATION',
  'WAITING_OPERATOR_ACCEPTANCE',
  'RESOURCE_ASSIGNING',
  'SCHEDULED',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'FAILED_PREFLIGHT',
  'PENDING_APPROVAL',
])

export default function MissionList({ missions, onSelect, onScreen }: Props) {
  const { t, locale } = useI18n(missionListMessages)
  const awaiting = missions.filter(
    (m) =>
      m.state === 'WAITING_OPERATOR_ACCEPTANCE' ||
      m.state === 'WAITING_CREW_CONFIRMATION',
  ).length
  const scheduledToday = missions.filter(
    (m) =>
      PENDING_STATES.has(m.state) &&
      m.state !== 'WAITING_OPERATOR_ACCEPTANCE' &&
      m.state !== 'WAITING_CREW_CONFIRMATION',
  ).length
  const inFlight = missions.filter(
    (m) => m.state === 'IN_FLIGHT' || m.state === 'RETURNING',
  ).length
  const completed = missions.filter((m) => m.state === 'COMPLETED').length

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 4px',
            }}
          >
            {t.title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            {t.description}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="1.5"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <circle cx="7" cy="7" r="5" />
            <line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input
            placeholder={t.searchPlaceholder}
            style={{ padding: '8px 12px 8px 32px', width: 220, fontSize: 14 }}
          />
        </div>
      </div>

      {/* Alert banner */}
      {awaiting > 0 && (
        <div
          style={{
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M8 1L15 13H1L8 1z"
              stroke="var(--amber)"
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
            <line
              x1="8"
              y1="6"
              x2="8"
              y2="10"
              stroke="var(--amber)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="12" r=".7" fill="var(--amber)" />
          </svg>
          <span style={{ fontSize: 14, color: 'var(--amber-text)' }}>
            <strong>{t.alertPrefix(awaiting)}</strong> {t.alertSuffix(awaiting)}
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: t.summary.awaitingAcceptance,
            value: awaiting,
            color: 'var(--amber)',
            dotColor: 'var(--amber-bg)',
          },
          {
            label: t.summary.scheduledToday,
            value: scheduledToday,
            color: 'var(--blue)',
            dotColor: 'var(--blue-bg)',
          },
          {
            label: t.summary.inFlight,
            value: inFlight,
            color: 'var(--green)',
            dotColor: 'var(--green-bg)',
          },
          {
            label: t.summary.completedToday,
            value: completed,
            color: 'var(--text-2)',
            dotColor: 'var(--surface-2)',
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: c.dotColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: c.color,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 100px 130px 1fr 90px 90px',
            gap: 0,
            padding: '10px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
        >
          {[
            t.tableHeaders.mission,
            t.tableHeaders.customer,
            t.tableHeaders.drone,
            t.tableHeaders.scheduled,
            t.tableHeaders.status,
            t.tableHeaders.priority,
            t.tableHeaders.action,
          ].map((h) => (
            <div
              key={h}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}
            >
              {h}
            </div>
          ))}
        </div>

        {missions.map((m, i) => (
          <div
            key={m.id}
            onClick={() => {
              onSelect(m)
              onScreen('mission-detail')
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 100px 130px 1fr 90px 90px',
              gap: 0,
              padding: '14px 20px',
              cursor: 'pointer',
              borderBottom:
                i < missions.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background .1s',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                'var(--surface-2)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                'transparent')
            }
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                }}
              >
                {m.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-3)',
                  marginTop: 2,
                  fontFamily: 'var(--font-data)',
                }}
              >
                {m.id}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-2)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {m.customer}
            </div>
            <div
              style={{
                fontSize: 13,
                fontFamily: 'var(--font-data)',
                color: 'var(--text-2)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {m.droneId}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-2)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {fmtDate(m.scheduledAt, locale)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <MissionBadge state={m.state} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <PriorityBadge priority={m.priority} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(m)
                  onScreen('mission-detail')
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-2)',
                  background: 'var(--surface)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {t.review}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
