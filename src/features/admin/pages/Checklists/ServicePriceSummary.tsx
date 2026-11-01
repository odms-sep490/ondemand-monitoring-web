import { Alert, Card, Descriptions, Empty, Statistic, Tag } from 'antd'

import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import { decodeLocalizedInText, useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { PriceChecklistTable } from './PriceChecklistTable'
import { servicePriceSummaryMessages } from './ServicePriceSummary.messages'
import './servicePriceSummary.css'

/**
 * Admin view of a service's default price: the figure first, then one compact line per checklist,
 * with the full calculation one click away instead of repeated for every checklist.
 */
export function ServicePriceSummary({
  preview,
}: {
  preview: ServicePricePreview
}) {
  const { t } = useI18n(servicePriceSummaryMessages)
  return (
    <div className="psum">
      <Card size="small" className="psum-hero">
        <div className="psum-hero-body">
          <Statistic title={t.heroLabel} value={formatVnd(preview.total)} />
          <div className="psum-chips">
            <Tag bordered={false} color="processing">
              {t.policy} v{preview.policyVersion}
              {preview.draftPolicy ? ` (${t.draft})` : ''}
            </Tag>
            <Tag bordered={false}>
              {t.checklistCount(preview.checklists.length)}
            </Tag>
          </div>
        </div>
      </Card>

      {preview.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          role="alert"
          message={t.warnings}
          description={
            <ul>
              {preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          }
        />
      )}
      {preview.quotePending && (
        <Alert type="warning" showIcon role="status" message={t.quotePending} />
      )}
      {preview.priceSource === 'UNPRICED' && (
        <Alert type="warning" showIcon role="status" message={t.unpriced} />
      )}

      {preview.checklists.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.none} />
      ) : (
        <PriceChecklistTable rows={preview.checklists} />
      )}

      <Descriptions size="small" column={1} bordered className="psum-totals">
        <Descriptions.Item label={t.checklistsTotal}>
          {formatVnd(preview.checklistSubtotal)}
        </Descriptions.Item>
        {(preview.addOns ?? []).map((addOn) => (
          <Descriptions.Item
            key={addOn.key}
            label={`${t.addOns}: ${decodeLocalizedInText(addOn.description)}`}
          >
            {formatVnd(addOn.amount)}
          </Descriptions.Item>
        ))}
        <Descriptions.Item label={t.total}>
          <strong>{formatVnd(preview.total)}</strong>
        </Descriptions.Item>
      </Descriptions>
      <p className="psum-note">{t.excludes}</p>
    </div>
  )
}
