import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import type { ChecklistPriceBreakdown } from '../../../../shared/api/checklistPricingApi'
import { displayLocalized, useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { servicePriceSummaryMessages } from './ServicePriceSummary.messages'
import { isWithinAllowance, splitWorkAndMedia } from './servicePriceSplit'

type Line = ChecklistPriceBreakdown['lines'][number]
type Row = ChecklistPriceBreakdown & { rowId: string }

function LineDetail({ row }: { row: Row }) {
  const { t } = useI18n(servicePriceSummaryMessages)
  const columns: ColumnsType<Line> = [
    { key: 'description', dataIndex: 'description' },
    {
      key: 'qty',
      title: t.qty,
      render: (_, line) =>
        `${line.quantity}${line.blockSize ? ` ${t.block}` : ''}`,
    },
    {
      key: 'unit',
      title: t.unit,
      render: (_, line) => formatVnd(line.unitPrice),
    },
    {
      key: 'amount',
      title: t.amount,
      render: (_, line) => formatVnd(line.amount),
    },
  ]
  return (
    <div className="psum-detail">
      <span className="psum-detail-title">{t.details}</span>
      <Table<Line>
        size="small"
        pagination={false}
        columns={columns}
        dataSource={row.lines}
        rowKey={(line) => `${line.component}-${line.description}`}
      />
      {isWithinAllowance(row) && (
        <p className="psum-note">{t.withinAllowance}</p>
      )}
    </div>
  )
}

/** One compact row per checklist (work, media, subtotal); the full calculation opens inside the row. */
export function PriceChecklistTable({
  rows,
}: {
  rows: ChecklistPriceBreakdown[]
}) {
  const { t } = useI18n(servicePriceSummaryMessages)
  const quote = { props: { colSpan: 3 }, children: null }
  const columns: ColumnsType<Row> = [
    {
      key: 'checklist',
      title: t.columns.checklist,
      render: (_, row) => {
        const extra = row.extraImageCount > 0 || row.extraVideoCount > 0
        return (
          <span className="psum-name">
            <strong>{displayLocalized(row.content)}</strong>
            {row.custom && <Tag bordered={false}>{t.custom}</Tag>}
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
        )
      },
    },
    {
      key: 'work',
      title: t.columns.work,
      onCell: (row) => ({ colSpan: row.quotePending ? 3 : 1 }),
      render: (_, row) =>
        row.quotePending
          ? { ...quote, children: t.awaitingQuote }
          : formatVnd(splitWorkAndMedia(row).work),
    },
    {
      key: 'media',
      title: t.columns.media,
      onCell: (row) => ({ colSpan: row.quotePending ? 0 : 1 }),
      render: (_, row) =>
        row.quotePending ? null : formatVnd(splitWorkAndMedia(row).media),
    },
    {
      key: 'subtotal',
      title: t.columns.subtotal,
      onCell: (row) => ({ colSpan: row.quotePending ? 0 : 1 }),
      render: (_, row) =>
        row.quotePending ? null : <strong>{formatVnd(row.subtotal)}</strong>,
    },
  ]
  return (
    <Table<Row>
      size="small"
      pagination={false}
      aria-label={t.price}
      columns={columns}
      dataSource={rows.map((row, index) => ({
        ...row,
        rowId: `${row.checklistId ?? 'custom'}-${index}`,
      }))}
      rowKey="rowId"
      expandable={{
        rowExpandable: (row) => !row.quotePending,
        expandedRowRender: (row) => <LineDetail row={row} />,
      }}
    />
  )
}
