import { Tag } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { ServiceChecklist } from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'

/** Effective price and allowance of a row; marks which values are service overrides. */
export function PricingChips({ row }: { row: ServiceChecklist }) {
  const { t } = useI18n(checklistMessages)
  const chip = (text: string, override: boolean) => (
    <Tag
      bordered={false}
      color={override ? 'processing' : 'default'}
      title={override ? t.overrideValue : t.inheritedValue}
    >
      {text}
      {override ? ' *' : ''}
    </Tag>
  )
  return (
    <div className="checklist-chips">
      {chip(formatVnd(row.basePrice ?? 0), row.basePriceOverride != null)}
      {chip(
        `${row.includedImageCount ?? 0} ${t.imagesShort}`,
        row.includedImageCountOverride != null,
      )}
      {chip(
        `${row.includedVideoCount ?? 0} ${t.videosShort}`,
        row.includedVideoCountOverride != null,
      )}
      {chip(
        row.pricingProfile ?? 'DEFAULT',
        row.pricingProfileOverride != null,
      )}
    </div>
  )
}
