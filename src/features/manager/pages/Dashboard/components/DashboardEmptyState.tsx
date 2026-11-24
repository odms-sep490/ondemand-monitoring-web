import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  LockOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'
import type { ReactNode } from 'react'

export type EmptyStateVariant =
  | 'NO_DATA'
  | 'NO_DATA_FOR_FILTER'
  | 'NO_MISSIONS'
  | 'ALL_CAUGHT_UP'
  | 'ERROR'
  | 'NO_PERMISSION'

type Props = {
  variant?: EmptyStateVariant
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  compact?: boolean
  role?: 'status' | 'alert'
  className?: string
  extra?: ReactNode
}

function DroneCompactIcon() {
  return (
    <svg
      className="mgr-empty-drone-svg"
      width="44"
      height="44"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill="#EFF6FF" />
      <path
        d="M14 16h6m8 0h6M14 32h6m8 0h6M17 16l4 5m10-5l-4 5m-10 11l4-5m10 5l-4-5"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="20" y="20" width="8" height="8" rx="2.5" fill="#1565E8" />
      <circle cx="14" cy="16" r="2.2" fill="#93C5FD" />
      <circle cx="34" cy="16" r="2.2" fill="#93C5FD" />
      <circle cx="14" cy="32" r="2.2" fill="#93C5FD" />
      <circle cx="34" cy="32" r="2.2" fill="#93C5FD" />
    </svg>
  )
}

function renderVariantIcon(variant: EmptyStateVariant) {
  switch (variant) {
    case 'NO_MISSIONS':
      return <DroneCompactIcon />
    case 'ALL_CAUGHT_UP':
      return (
        <span className="mgr-empty-icon is-success" aria-hidden="true">
          <CheckCircleOutlined />
        </span>
      )
    case 'NO_DATA_FOR_FILTER':
      return (
        <span className="mgr-empty-icon is-info" aria-hidden="true">
          <FilterOutlined />
        </span>
      )
    case 'ERROR':
      return (
        <span className="mgr-empty-icon is-danger" aria-hidden="true">
          <ExclamationCircleOutlined />
        </span>
      )
    case 'NO_PERMISSION':
      return (
        <span className="mgr-empty-icon is-neutral" aria-hidden="true">
          <LockOutlined />
        </span>
      )
    default:
      return (
        <span className="mgr-empty-icon is-info" aria-hidden="true">
          <LineChartOutlined />
        </span>
      )
  }
}

/** Compact, reusable empty/error/filter state for dashboard command-center panels. */
export function DashboardEmptyState({
  variant = 'NO_DATA',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  compact = true,
  role = 'status',
  className = '',
  extra,
}: Props) {
  return (
    <div
      className={`mgr-cmd-empty${compact ? ' is-compact' : ''} is-${variant.toLowerCase()} ${className}`.trim()}
      role={role}
    >
      <div className="mgr-cmd-empty-visual">{renderVariantIcon(variant)}</div>
      <div className="mgr-cmd-empty-copy">
        <p className="mgr-cmd-empty-title">{title}</p>
        {description ? (
          <p className="mgr-cmd-empty-desc">{description}</p>
        ) : null}
      </div>
      {(actionLabel && (actionHref || onAction)) || extra ? (
        <div className="mgr-cmd-empty-actions">
          {actionLabel && actionHref ? (
            <Button size="small" href={actionHref}>
              {actionLabel}
            </Button>
          ) : actionLabel && onAction ? (
            <Button size="small" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {extra}
        </div>
      ) : null}
    </div>
  )
}
