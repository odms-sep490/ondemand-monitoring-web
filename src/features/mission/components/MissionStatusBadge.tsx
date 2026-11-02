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
      case 'PLANNING':
      case 'CREATED':
        return {
          bg: '#f1f5f9',
          color: '#475569',
          label: status === 'PLANNING' ? t.mission.PLANNING : t.mission.CREATED,
          icon: 'activity' as const,
        }
      case 'WAITING_DEPOSIT':
        return {
          bg: '#fff7ed',
          color: '#9a3412',
          label: t.mission.WAITING_DEPOSIT,
          icon: 'lock' as const,
        }
      case 'PENDING_PAYMENT':
        return {
          bg: '#fff7ed',
          color: '#9a3412',
          label: t.mission.PENDING_PAYMENT,
          icon: 'lock' as const,
        }
      case 'PENDING_CONFIRMATION':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          label: t.mission.PENDING_CONFIRMATION,
          icon: 'lock' as const,
        }
      case 'WAITING_OPERATOR_ACCEPTANCE':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          label: t.mission.WAITING_OPERATOR_ACCEPTANCE,
          icon: 'clock' as const,
        }
      case 'READY':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          label: t.mission.READY,
          icon: 'check' as const,
        }
      case 'SCHEDULED':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          label: t.mission.SCHEDULED,
          icon: 'check' as const,
        }
      case 'IN_PROGRESS':
        return {
          bg: '#0284c7',
          color: '#ffffff',
          label: t.mission.IN_PROGRESS,
          icon: 'route' as const,
        }
      case 'AWAITING_REVIEW':
        return {
          bg: '#dbeafe',
          color: '#1d4ed8',
          label: t.mission.AWAITING_REVIEW,
          icon: 'clock' as const,
        }
      case 'PENDING_REVIEW':
        return {
          bg: '#dbeafe',
          color: '#1d4ed8',
          label: t.mission.PENDING_REVIEW,
          icon: 'clock' as const,
        }
      case 'COMPLETED':
        return {
          bg: '#d1fae5',
          color: '#065f46',
          label: t.mission.COMPLETED,
          icon: 'check' as const,
        }
      case 'FAILED':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          label: t.mission.FAILED,
          icon: 'x' as const,
        }
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
