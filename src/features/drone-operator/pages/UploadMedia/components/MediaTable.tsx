import { Button, Progress, type TableColumnsType } from 'antd'

import {
  EmptyState,
  StatusTag,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaFile, MediaFileStatus } from '../../../types/mission'
import { mediaTableMessages } from './MediaTable.messages'

const STATUS_TONE: Record<
  MediaFileStatus,
  'neutral' | 'info' | 'success' | 'danger'
> = {
  UPLOADED: 'success',
  UPLOADING: 'info',
  FAILED: 'danger',
  PENDING_UPLOAD: 'neutral',
}

function formatSize(bytes: number): string {
  const mb = bytes / 1_000_000
  if (mb >= 1000) return `${(mb / 1000).toFixed(1).replace('.', ',')} GB`
  return `${mb.toFixed(1).replace('.', ',')} MB`
}

export function MediaTable({
  files,
  retryingId,
  onRetry,
}: {
  files: MediaFile[]
  retryingId: string | null
  onRetry?: (fileId: string) => void
}) {
  const { t } = useI18n(mediaTableMessages)
  if (files.length === 0) {
    return <EmptyState title={t.emptyTitle} description={t.emptyBody} />
  }

  const columns: TableColumnsType<MediaFile> = [
    {
      title: t.columns.name,
      dataIndex: 'name',
      render: (name: string) => (
        <span className="stf-mono" style={{ fontWeight: 600 }}>
          {name}
        </span>
      ),
    },
    {
      title: t.columns.type,
      dataIndex: 'type',
      width: 100,
      render: (type: MediaFile['type']) => (
        <StatusTag tone={type === 'VIDEO' ? 'info' : 'neutral'}>
          {type}
        </StatusTag>
      ),
    },
    {
      title: t.columns.size,
      dataIndex: 'sizeBytes',
      width: 110,
      render: (bytes: number) => formatSize(bytes),
    },
    {
      title: t.columns.progress,
      dataIndex: 'progressPct',
      width: 170,
      render: (pct: number, file) => (
        <Progress
          size="small"
          percent={pct}
          status={file.status === 'FAILED' ? 'exception' : 'normal'}
        />
      ),
    },
    {
      title: t.columns.attempt,
      width: 90,
      render: (_: unknown, file) => (
        <span className="stf-mono">
          {file.attempt > 0 ? `${file.attempt}/${file.maxAttempts}` : '—'}
        </span>
      ),
    },
    {
      title: t.columns.status,
      width: 230,
      render: (_: unknown, file) => (
        <div className="stf-row" style={{ flexWrap: 'nowrap' }}>
          <StatusTag tone={STATUS_TONE[file.status]}>
            {file.validationPending ? t.validating : t.statusLabel[file.status]}
          </StatusTag>
          {file.manualTaskCreated ? (
            <span className="stf-muted" style={{ fontSize: 11 }}>
              {t.manualTaskCreated}
            </span>
          ) : null}
          {onRetry &&
          file.status === 'FAILED' &&
          file.attempt < file.maxAttempts ? (
            <Button
              size="small"
              disabled={retryingId === file.id}
              onClick={() => onRetry(file.id)}
            >
              {retryingId === file.id ? t.retrying : t.retry}
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="stf-table-scroll">
      <TableComponent<MediaFile>
        rowKey="id"
        columns={columns}
        dataSource={files}
        pagination={false}
      />
    </div>
  )
}
