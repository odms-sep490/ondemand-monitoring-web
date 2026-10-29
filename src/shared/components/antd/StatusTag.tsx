import { Tag } from 'antd'
import type { ReactNode } from 'react'

import type { StatusTone } from '../../types/domain'

export type StatusTagTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const FROM_STATUS_TONE: Record<StatusTone, StatusTagTone> = {
  green: 'success',
  yellow: 'warning',
  orange: 'warning',
  red: 'danger',
  blue: 'info',
  gray: 'neutral',
}

/** antd <Tag color> presets for each tone. */
const TAG_COLOR: Record<StatusTagTone, string> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'processing',
  neutral: 'default',
}

export function toStatusTagTone(tone: StatusTone | StatusTagTone): StatusTagTone {
  return tone in FROM_STATUS_TONE ? FROM_STATUS_TONE[tone as StatusTone] : (tone as StatusTagTone)
}

/** Pill-shaped status tag with a leading dot. Accepts the shared status tones or UI tones. */
export function StatusTag({ tone = 'neutral', children }: { tone?: StatusTone | StatusTagTone; children: ReactNode }) {
  return (
    <Tag bordered={false} className="mgr-status-tag" color={TAG_COLOR[toStatusTagTone(tone)]}>
      <span className="mgr-dot" aria-hidden="true" />
      {children}
    </Tag>
  )
}
