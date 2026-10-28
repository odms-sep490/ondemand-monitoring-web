import type { MissionStatus, DeviceStatus } from '../types/mission'
import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { missionStatusBadgeMessages } from './MissionStatusBadge.messages'

interface MissionStatusBadgeProps {
  status: MissionStatus
}

export function MissionStatusBadge({ status }: MissionStatusBadgeProps) {
  const { t } = useI18n(missionStatusBadgeMessages)

  const getBadgeConfig = () => {
    switch (status) {
      case 'WAITING_DEPOSIT':
        return {
          bg: '#fff7ed',
          color: '#9a3412',
          label: t.mission.WAITING_DEPOSIT,
          icon: 'lock' as const,
        }
      case 'WAITING_OPERATOR_ACCEPTANCE':
      case 'READY':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          label:
            status === 'READY'
              ? t.mission.READY
              : t.mission.WAITING_OPERATOR_ACCEPTANCE,
          icon: 'clock' as const,
        }
      case 'SCHEDULED':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          label: t.mission.SCHEDULED,
          icon: 'check' as const,
        }
      case 'CONNECTED':
        return {
          bg: '#e0e7ff',
          color: '#3730a3',
          label: t.mission.CONNECTED,
          icon: 'radio' as const,
        }
      case 'PREFLIGHT_CHECKING':
        return {
          bg: '#fae8ff',
          color: '#86198f',
          label: t.mission.PREFLIGHT_CHECKING,
          icon: 'activity' as const,
        }
      case 'READY_TO_FLY':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          label: t.mission.READY_TO_FLY,
          icon: 'shield' as const,
        }
      case 'IN_FLIGHT':
      case 'IN_PROGRESS':
        return {
          bg: '#0284c7',
          color: '#ffffff',
          label: t.mission.IN_FLIGHT,
          icon: 'route' as const,
        }
      case 'RETURNING':
        return {
          bg: '#fed7aa',
          color: '#c2410c',
          label: t.mission.RETURNING,
          icon: 'route' as const,
        }
      case 'COMPLETED':
        return {
          bg: '#d1fae5',
          color: '#065f46',
          label: t.mission.COMPLETED,
          icon: 'check' as const,
        }
      case 'FAILED_PREFLIGHT':
      case 'PENDING_APPROVAL':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          label: t.mission.FAILED_PREFLIGHT,
          icon: 'x' as const,
        }
      case 'FAILED':
      case 'CANCELLED':
        return {
          bg: '#f3f4f6',
          color: '#4b5563',
          label: t.mission.CANCELLED,
          icon: 'x' as const,
        }
      default:
        return {
          bg: '#e2e8f0',
          color: '#334155',
          label: status,
          icon: 'activity' as const,
        }
    }
  }

  const { bg, color, label, icon } = getBadgeConfig()

  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        backgroundColor: bg,
        color: color,
        fontWeight: 700,
        fontSize: '0.74rem',
        letterSpacing: '0.02em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <Icon name={icon} style={{ width: '14px', height: '14px' }} />
      <span>{label}</span>
    </span>
  )
}

interface DeviceStatusBadgeProps {
  status: DeviceStatus
}

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const { t } = useI18n(missionStatusBadgeMessages)

  const getBadgeConfig = () => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: '#dcfce7',
          color: '#166534',
          label: t.device.AVAILABLE,
        }
      case 'PREFLIGHT':
        return {
          bg: '#e0f2fe',
          color: '#075985',
          label: t.device.PREFLIGHT,
        }
      case 'ACTIVE_MISSION':
        return {
          bg: '#0284c7',
          color: '#ffffff',
          label: t.device.ACTIVE_MISSION,
        }
      case 'IDLE_CHARGING':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          label: t.device.IDLE_CHARGING,
        }
      case 'MAINTENANCE':
        return {
          bg: '#fee2e2',
          color: '#991b1b',
          label: t.device.MAINTENANCE,
        }
      case 'OFFLINE':
      default:
        return { bg: '#f1f5f9', color: '#64748b', label: 'OFFLINE' }
    }
  }

  const { bg, color, label } = getBadgeConfig()

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: '6px',
        backgroundColor: bg,
        color: color,
        fontWeight: 700,
        fontSize: '0.68rem',
        fontFamily: 'var(--mono)',
        border: '1px solid color-mix(in srgb, currentColor 20%, transparent)',
      }}
    >
      {label}
    </span>
  )
}
