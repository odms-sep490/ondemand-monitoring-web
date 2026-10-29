import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { Typography } from 'antd'

export type CheckGlyphTone = 'success' | 'warning' | 'danger' | 'neutral'

const TEXT_TYPE = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'secondary',
} as const

/** Status icon (tick / warning / cross / dash) coloured through antd text tokens. */
export function CheckGlyph({ tone }: { tone: CheckGlyphTone }) {
  const icon =
    tone === 'success' ? (
      <CheckCircleFilled />
    ) : tone === 'danger' ? (
      <CloseCircleFilled />
    ) : tone === 'warning' ? (
      <ExclamationCircleFilled />
    ) : (
      <MinusCircleOutlined />
    )
  return (
    <Typography.Text type={TEXT_TYPE[tone]} aria-hidden="true">
      {icon}
    </Typography.Text>
  )
}

/** Maps PASS / WARN / FAIL style statuses onto a glyph tone. */
export function checkTone(status?: string | null): CheckGlyphTone {
  if (status === 'PASS' || status === 'READY') return 'success'
  if (status === 'WARN') return 'warning'
  if (status === 'FAIL' || status === 'FAILED') return 'danger'
  return 'neutral'
}
