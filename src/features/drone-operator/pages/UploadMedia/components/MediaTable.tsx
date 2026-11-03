import { Button, Table, Tag } from 'antd'
import { FileImageOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaFile, MediaFileStatus } from '../../../types/mission'
import { mediaTableMessages } from './MediaTable.messages'

const STATUS_TONE: Record<MediaFileStatus, string> = {
  UPLOADED: 'success',
  UPLOADING: 'processing',
  FAILED: 'error',
  PENDING_UPLOAD: 'default',
  VALIDATING: 'processing',
  PENDING_MANAGER_APPROVAL: 'processing',
  AVAILABLE: 'success',
  REJECTED: 'error',
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
  const { t, locale } = useI18n(mediaTableMessages)
  const formatSize = (bytes: number) => {
    const unit =
      bytes >= 1_000_000_000 ? 'GB' : bytes >= 1_000_000 ? 'MB' : 'KB'
    const divisor =
      unit === 'GB' ? 1_000_000_000 : unit === 'MB' ? 1_000_000 : 1000
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / divisor)} ${unit}`
  }
  return (
    <Table<MediaFile>
      className="upload-transfer-table"
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={files}
      locale={{
        emptyText: (
          <div className="upload-transfer-empty">
            <strong>{t.emptyTitle}</strong>
            <span>{t.emptyBody}</span>
          </div>
        ),
      }}
      columns={[
        {
          title: t.columns.name,
          key: 'name',
          render: (_, file) => (
            <div className="upload-transfer-file">
              <span className="upload-transfer-icon" aria-hidden="true">
                {file.type === 'VIDEO' ? (
                  <VideoCameraOutlined />
                ) : (
                  <FileImageOutlined />
                )}
              </span>
              <div className="upload-transfer-file-info">
                <span className="upload-transfer-name" title={file.name}>
                  {file.name}
                </span>
                <span className="upload-transfer-meta">
                  {t.typeLabel[file.type]} · {formatSize(file.sizeBytes)}
                </span>
              </div>
            </div>
          ),
        },
        {
          title: t.columns.status,
          key: 'status',
          width: '34%',
          render: (_, file) => (
            <div className="upload-transfer-state">
              <Tag color={STATUS_TONE[file.status]}>
                {file.validationPending || file.status === 'VALIDATING'
                  ? t.validating
                  : t.statusLabel[file.status]}
              </Tag>
              {file.status === 'UPLOADING' && (
                <div
                  className="upload-file-progress is-indeterminate"
                  role="progressbar"
                  aria-label={
                    file.validationPending ? t.validating : t.uploading
                  }
                >
                  <span />
                </div>
              )}
              {file.status === 'PENDING_MANAGER_APPROVAL' && (
                <small>{t.uploadComplete}</small>
              )}
              {file.manualTaskCreated && <small>{t.manualTaskCreated}</small>}
              {(file.status === 'FAILED' || file.attempt > 1) && (
                <small>
                  {t.columns.attempt}: {file.attempt}/{file.maxAttempts}
                </small>
              )}
              {onRetry &&
                file.status === 'FAILED' &&
                file.attempt < file.maxAttempts && (
                  <Button
                    size="small"
                    loading={retryingId === file.id}
                    onClick={() => onRetry(file.id)}
                  >
                    {retryingId === file.id ? t.retrying : t.retry}
                  </Button>
                )}
            </div>
          ),
        },
      ]}
    />
  )
}
