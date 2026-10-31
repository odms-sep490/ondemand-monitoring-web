import type { ReactNode } from 'react'

import { useLanguage, type Language } from '../../i18n'
import {
  getDroneStatusLabel,
  getMediaStatusLabel,
  getMissionStatusLabel,
  getOrderStatusLabel,
  getTicketSeverityLabel,
  getTicketStatusLabel,
} from '../../lib/statusTone'
import type {
  DroneStatus,
  MediaStatus,
  MissionStatus,
  OrderStatus,
  StatusTone,
  TicketSeverity,
  TicketStatus,
} from '../../types/domain'

const LABEL_GETTERS = {
  order: getOrderStatusLabel,
  mission: getMissionStatusLabel,
  drone: getDroneStatusLabel,
  ticketSeverity: getTicketSeverityLabel,
  ticketStatus: getTicketStatusLabel,
  media: getMediaStatusLabel,
} as const

type StatusKind = keyof typeof LABEL_GETTERS

type StatusForKind<K extends StatusKind> = K extends 'order'
  ? OrderStatus
  : K extends 'mission'
    ? MissionStatus
    : K extends 'drone'
      ? DroneStatus
        : K extends 'ticketSeverity'
          ? TicketSeverity
          : K extends 'ticketStatus'
            ? TicketStatus
            : MediaStatus

type StatusBadgeProps<K extends StatusKind = StatusKind> = {
  tone: StatusTone
  size?: 'md' | 'lg'
} & (
  | { children: ReactNode; kind?: undefined; status?: undefined }
  | { children?: undefined; kind: K; status: StatusForKind<K> }
)

/**
 * Renders a colour-toned status pill. Either:
 *   - pass `children` (existing usage, unchanged — any node, e.g. a label
 *     already resolved by the caller), or
 *   - pass `kind` + `status` (e.g. `kind="order" status="APPROVED"`) to have
 *     the badge resolve and render the label itself in the current
 *     language (via `useLanguage()` + the `get*Label` accessors in
 *     `shared/lib/statusTone.ts`), so it updates live when the user
 *     switches VI/EN.
 */
export function StatusBadge<K extends StatusKind>({
  tone,
  size = 'md',
  children,
  kind,
  status,
}: StatusBadgeProps<K>) {
  const { lang } = useLanguage()
  const sizeClass = size === 'lg' ? ' odm-badge-lg' : ''

  let content: ReactNode = children
  if (kind && status !== undefined) {
    const getLabel = LABEL_GETTERS[kind] as (
      status: StatusForKind<K>,
      lang: Language,
    ) => string
    content = getLabel(status, lang)
  }

  return (
    <span className={`odm-badge odm-badge-${tone}${sizeClass}`}>
      <span className="odm-badge-dot" aria-hidden="true" />
      {content}
    </span>
  )
}
