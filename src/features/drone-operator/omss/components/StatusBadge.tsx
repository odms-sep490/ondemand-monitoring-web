import type { MissionState, DroneState, CheckStatus } from '../../types/omss'
import { useLanguage } from '../../../../shared/i18n'
import {
  getDroneStatusLabel,
  getMissionStatusLabel,
} from '../../../../shared/lib/statusTone'
import { statusBadgeMessages } from './StatusBadge.messages'

/* ── Status dot helper ─────────────────────────────────────── */
function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}

/* ── Mission status ────────────────────────────────────────── */
// Colours only — labels come from the bilingual `getMissionStatusLabel`
// accessor (src/shared/lib/statusTone.ts, Phase 1) so this stays in sync
// with every other screen's mission status colour/label pairing.
const MISSION_CFG: Record<MissionState, { color: string; dot: string }> = {
  WAITING_DEPOSIT: { color: 'var(--amber)', dot: 'var(--amber)' },
  WAITING_CREW_CONFIRMATION: { color: 'var(--amber)', dot: 'var(--amber)' },
  WAITING_OPERATOR_ACCEPTANCE: { color: 'var(--amber)', dot: 'var(--amber)' },
  RESOURCE_ASSIGNING: { color: 'var(--blue)', dot: 'var(--blue)' },
  SCHEDULED: { color: 'var(--blue)', dot: 'var(--blue)' },
  CONNECTED: { color: 'var(--green)', dot: 'var(--green)' },
  PREFLIGHT_CHECKING: { color: 'var(--blue)', dot: 'var(--blue)' },
  READY_TO_FLY: { color: 'var(--green)', dot: 'var(--green)' },
  FAILED_PREFLIGHT: { color: 'var(--red)', dot: 'var(--red)' },
  PENDING_APPROVAL: { color: 'var(--amber)', dot: 'var(--amber)' },
  IN_FLIGHT: { color: 'var(--green)', dot: 'var(--green)' },
  RETURNING: { color: 'var(--blue)', dot: 'var(--blue)' },
  POSTFLIGHT_CHECKING: { color: 'var(--blue)', dot: 'var(--blue)' },
  COMPLETED: { color: 'var(--green-text)', dot: 'var(--green)' },
  FAILED: { color: 'var(--red-text)', dot: 'var(--red)' },
  CANCELLED: { color: 'var(--text-3)', dot: 'var(--text-3)' },
}

export function MissionBadge({ state }: { state: MissionState }) {
  const { lang } = useLanguage()
  const c = MISSION_CFG[state]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: c.color,
      }}
    >
      <Dot color={c.dot} />
      {getMissionStatusLabel(state, lang)}
    </span>
  )
}

/* ── Drone status ──────────────────────────────────────────── */
// Colours only — labels come from `getDroneStatusLabel` (Phase 1 accessor).
const DRONE_CFG: Record<DroneState, { color: string; dot: string }> = {
  AVAILABLE: { color: 'var(--green)', dot: 'var(--green)' },
  PREFLIGHT: { color: 'var(--blue)', dot: 'var(--blue)' },
  ACTIVE_MISSION: { color: 'var(--green)', dot: 'var(--green)' },
  IDLE_CHARGING: { color: 'var(--amber)', dot: 'var(--amber)' },
  MAINTENANCE: { color: 'var(--red-text)', dot: 'var(--red)' },
}

export function DroneBadge({ state }: { state: DroneState }) {
  const { lang } = useLanguage()
  const c = DRONE_CFG[state]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: c.color,
      }}
    >
      <Dot color={c.dot} />
      {getDroneStatusLabel(state, lang)}
    </span>
  )
}

/* ── Check status ──────────────────────────────────────────── */
const CHECK_CFG: Record<CheckStatus, { color: string; icon: string }> = {
  PASS: { color: 'var(--green)', icon: '✓' },
  FAIL: { color: 'var(--red-text)', icon: '✕' },
  WARNING: { color: 'var(--amber)', icon: '⚠' },
  PENDING: { color: 'var(--text-3)', icon: '—' },
}

export function CheckBadge({ status }: { status: CheckStatus }) {
  const { lang } = useLanguage()
  const t = statusBadgeMessages[lang]
  const c = CHECK_CFG[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 13,
        fontWeight: 500,
        color: c.color,
      }}
    >
      <span>{c.icon}</span>
      {t.check[status]}
    </span>
  )
}

/* ── Priority ──────────────────────────────────────────────── */
const PRI_CFG = {
  CRITICAL: { color: 'var(--red-text)', bg: 'var(--red-bg)' },
  HIGH: { color: 'var(--amber-text)', bg: 'var(--amber-bg)' },
  NORMAL: { color: 'var(--text-2)', bg: 'var(--surface-2)' },
  LOW: { color: 'var(--text-3)', bg: 'var(--surface-2)' },
}

export function PriorityBadge({
  priority,
}: {
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
}) {
  const { lang } = useLanguage()
  const t = statusBadgeMessages[lang]
  const c = PRI_CFG[priority]
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: c.color,
        padding: '2px 7px',
        borderRadius: 4,
        background: c.bg,
      }}
    >
      {t.priority[priority]}
    </span>
  )
}
