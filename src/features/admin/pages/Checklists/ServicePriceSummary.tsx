import { defineMessages, useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import './servicePriceSummary.css'

const messages = defineMessages({
  vi: {
    heroLabel: 'Tổng giá các Base Checklist',
    checklistCount: (n: number) => `${n} checklist`,
    subtotal: 'Giá tính theo diện tích tiêu chuẩn',
    total: 'Tổng giá mặc định',
    warnings: 'Cần cấu hình diện tích tiêu chuẩn',
    pending: 'Chờ Manager báo giá',
  },
  en: {
    heroLabel: 'Base Checklist total',
    checklistCount: (n: number) => `${n} checklist${n === 1 ? '' : 's'}`,
    subtotal: 'Price at standard areas',
    total: 'Default total',
    warnings: 'Standard area needs configuration',
    pending: 'Awaiting manager quote',
  },
})

/** Concise service-level view of the shared Base Checklist prices. */
export function ServicePriceSummary({ preview }: { preview: ServicePricePreview }) {
  const { t } = useI18n(messages)
  return (
    <div className="psum">
      <div className="psum-hero">
        <div>
          <span className="psum-hero-label">{t.heroLabel}</span>
          <strong className="psum-hero-value">{formatVnd(preview.total)}</strong>
        </div>
        <span className="psum-chip">{t.checklistCount(preview.checklists.length)}</span>
      </div>

      {preview.warnings.length > 0 ? (
        <div role="alert" className="psum-notice is-warn">
          <strong>{t.warnings}</strong>
          <ul>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      ) : null}

      {preview.checklists.length > 0 ? (
        <div className="psum-simple-list">
          {preview.checklists.map((row, index) => (
            <section className="psum-simple-item" key={`${row.checklistId ?? 'custom'}-${index}`}>
              <div className="psum-row">
                <strong>{row.content}</strong>
                <b>{row.quotePending ? t.pending : formatVnd(row.subtotal)}</b>
              </div>
              {row.calculationDisplay ? <small>{row.calculationDisplay}</small> : null}
            </section>
          ))}
        </div>
      ) : null}

      <dl className="psum-totals">
        <div>
          <dt>{t.subtotal}</dt>
          <dd>{formatVnd(preview.checklistSubtotal)}</dd>
        </div>
        <div className="is-total">
          <dt>{t.total}</dt>
          <dd>{formatVnd(preview.total)}</dd>
        </div>
      </dl>
    </div>
  )
}
