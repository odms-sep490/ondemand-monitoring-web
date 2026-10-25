import { defineMessages, useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type {
  ChecklistPriceBreakdown,
  ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import './servicePriceSummary.css'

const messages = defineMessages({
  vi: {
    price: 'Giá mặc định của dịch vụ',
    heroLabel: 'Tổng giá dịch vụ',
    policy: 'Chính sách giá',
    draft: 'bản nháp',
    checklistCount: (n: number) => `${n} checklist`,
    columns: {
      checklist: 'Checklist',
      work: 'Công việc',
      media: 'Media',
      subtotal: 'Tạm tính',
    },
    images: 'ảnh',
    videos: 'video',
    extra: 'thêm',
    custom: 'Ngoài danh mục',
    awaitingQuote: 'Chờ Manager báo giá',
    details: 'Chi tiết cách tính',
    qty: 'SL',
    unit: 'Đơn giá',
    amount: 'Thành tiền',
    block: 'khối',
    withinAllowance:
      'Số lượng yêu cầu nằm trong định mức đã bao gồm nên không tính thêm.',
    checklistsTotal: 'Tổng các checklist',
    addOns: 'Dịch vụ bổ sung',
    total: 'Giá mặc định',
    excludes:
      'Chưa gồm các yếu tố theo từng đơn như quãng đường và diện tích. Manager báo giá khi duyệt đơn.',
    warnings: 'Chưa tính được giá cho một số checklist',
    quotePending:
      'Các yêu cầu đang chờ Manager báo giá chưa được tính vào tổng này.',
    unpriced:
      'Dịch vụ này chưa có checklist mặc định nào có giá. Hãy cấu hình giá checklist để dịch vụ có giá.',
    none: 'Chưa có checklist trong cấu hình này.',
  },
  en: {
    price: 'Default service price',
    heroLabel: 'Service total',
    policy: 'Pricing policy',
    draft: 'draft',
    checklistCount: (n: number) => `${n} checklist${n === 1 ? '' : 's'}`,
    columns: {
      checklist: 'Checklist',
      work: 'Work',
      media: 'Media',
      subtotal: 'Subtotal',
    },
    images: 'images',
    videos: 'videos',
    extra: 'extra',
    custom: 'Custom',
    awaitingQuote: 'Awaiting manager quote',
    details: 'How it is calculated',
    qty: 'Qty',
    unit: 'Unit price',
    amount: 'Amount',
    block: 'block',
    withinAllowance:
      'The requested quantity is within the included allowance, so nothing extra is charged.',
    checklistsTotal: 'Checklists total',
    addOns: 'Add-ons',
    total: 'Default price',
    excludes:
      'Excludes order-specific factors such as distance and area. The Manager quotes these when approving an order.',
    warnings: 'Some checklists cannot be priced yet',
    quotePending:
      'Requirements awaiting a manager quote are excluded from this total.',
    unpriced:
      'This service has no priced default checklist yet. Price its checklists to give the service a price.',
    none: 'No checklist in this configuration.',
  },
})

const MEDIA = new Set([
  'INCLUDED_IMAGE',
  'INCLUDED_VIDEO',
  'EXTRA_IMAGE',
  'EXTRA_VIDEO',
])

/** Work and media are shown as two figures; every line of the breakdown belongs to exactly one of them. */
function split(row: ChecklistPriceBreakdown) {
  let work = 0
  let media = 0
  for (const line of row.lines) {
    if (MEDIA.has(line.component)) media += line.amount
    else work += line.amount
  }
  return { work, media }
}

/**
 * Admin view of a service's default price: the figure first, then one compact line per checklist,
 * with the full calculation one click away instead of repeated for every checklist.
 */
export function ServicePriceSummary({
  preview,
}: {
  preview: ServicePricePreview
}) {
  const { t } = useI18n(messages)
  return (
    <div className="psum">
      <div className="psum-hero">
        <div>
          <span className="psum-hero-label">{t.heroLabel}</span>
          <strong className="psum-hero-value">
            {formatVnd(preview.total)}
          </strong>
        </div>
        <div className="psum-chips">
          <span className="psum-chip">
            {t.policy} v{preview.policyVersion}
            {preview.draftPolicy ? ` (${t.draft})` : ''}
          </span>
          <span className="psum-chip">
            {t.checklistCount(preview.checklists.length)}
          </span>
        </div>
      </div>

      {preview.warnings.length > 0 && (
        <div role="alert" className="psum-notice is-warn">
          <strong>{t.warnings}</strong>
          <ul>
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {preview.quotePending && (
        <p role="status" className="psum-notice is-warn">
          {t.quotePending}
        </p>
      )}
      {preview.priceSource === 'UNPRICED' && (
        <p role="status" className="psum-notice is-warn">
          {t.unpriced}
        </p>
      )}

      {preview.checklists.length === 0 ? (
        <p className="psum-empty">{t.none}</p>
      ) : (
        <div className="psum-table" role="table" aria-label={t.price}>
          <div className="psum-row is-head" role="row">
            <span role="columnheader">{t.columns.checklist}</span>
            <span role="columnheader">{t.columns.work}</span>
            <span role="columnheader">{t.columns.media}</span>
            <span role="columnheader">{t.columns.subtotal}</span>
          </div>
          {preview.checklists.map((row, index) => (
            <ChecklistLine
              key={`${row.checklistId ?? 'custom'}-${index}`}
              row={row}
            />
          ))}
        </div>
      )}

      <dl className="psum-totals">
        <div>
          <dt>{t.checklistsTotal}</dt>
          <dd>{formatVnd(preview.checklistSubtotal)}</dd>
        </div>
        {(preview.addOns ?? []).map((addOn) => (
          <div key={addOn.key}>
            <dt>
              {t.addOns}: {addOn.description}
            </dt>
            <dd>{formatVnd(addOn.amount)}</dd>
          </div>
        ))}
        <div className="is-total">
          <dt>{t.total}</dt>
          <dd>{formatVnd(preview.total)}</dd>
        </div>
      </dl>
      <p className="psum-note">{t.excludes}</p>
    </div>
  )
}

function ChecklistLine({ row }: { row: ChecklistPriceBreakdown }) {
  const { t } = useI18n(messages)
  const { work, media } = split(row)
  const extra = row.extraImageCount > 0 || row.extraVideoCount > 0
  const withinAllowance =
    (row.requestedImageCount > 0 || row.requestedVideoCount > 0) && !extra
  return (
    <details className="psum-item" role="rowgroup">
      <summary className="psum-row" role="row">
        <span className="psum-name" role="cell">
          <strong>{row.content}</strong>
          {row.custom && <span className="psum-chip is-soft">{t.custom}</span>}
          <small>
            {row.includedImageCount} {t.images} · {row.includedVideoCount}{' '}
            {t.videos}
            {extra && (
              <span className="psum-extra">
                {' '}
                (+{row.extraImageCount} {t.images} · +{row.extraVideoCount}{' '}
                {t.videos} {t.extra})
              </span>
            )}
          </small>
        </span>
        {row.quotePending ? (
          <span className="psum-wide" role="cell">
            {t.awaitingQuote}
          </span>
        ) : (
          <>
            <span role="cell">{formatVnd(work)}</span>
            <span role="cell">{formatVnd(media)}</span>
            <strong role="cell">{formatVnd(row.subtotal)}</strong>
          </>
        )}
      </summary>
      {!row.quotePending && (
        <div className="psum-detail">
          <span className="psum-detail-title">{t.details}</span>
          <table>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">{t.qty}</th>
                <th scope="col">{t.unit}</th>
                <th scope="col">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {row.lines.map((line, index) => (
                <tr key={`${line.component}-${index}`}>
                  <td>{line.description}</td>
                  <td>
                    {line.quantity}
                    {line.blockSize ? ` ${t.block}` : ''}
                  </td>
                  <td>{formatVnd(line.unitPrice)}</td>
                  <td>{formatVnd(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {withinAllowance && <p className="psum-note">{t.withinAllowance}</p>}
        </div>
      )}
    </details>
  )
}
