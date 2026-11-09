import { StatusTag } from '../../../../shared/components/antd'
import { useLanguage } from '../../../../shared/i18n'
import type { MissionStatus } from '../../../../shared/types/domain'
import { getMissionStatusMeta } from '../../lib/orderStatus'

/** Mission status pill: label (vi/en) and tone come from lib/orderStatus. */
export function MissionStatusBadge({ status }: { status: MissionStatus }) {
  const { lang } = useLanguage()
  const meta = getMissionStatusMeta(status, lang)
  return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
}
