import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import type { MediaFile, MediaFileStatus } from '../../../types/mission'
import { mediaTableMessages } from './MediaTable.messages'
import { successfullyUploadedStatuses } from '../uploadMediaHelpers'

const STATUS_TONE: Record<MediaFileStatus, 'gray' | 'blue' | 'green' | 'red'> =
  {
    UPLOADED: 'green',
    UPLOADING: 'blue',
    FAILED: 'red',
    PENDING_UPLOAD: 'gray',
    VALIDATING: 'blue',
    PENDING_MANAGER_APPROVAL: 'blue',
    AVAILABLE: 'green',
    REJECTED: 'red',
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
    return (
      <div
        className="odm-card"
        style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}
      >
        <div
          className="odm-card-body"
          style={{ padding: '48px 24px', textAlign: 'center' }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.emptyTitle}</div>
          <div style={{ color: 'var(--tx3)' }}>{t.emptyBody}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="odm-card"
      style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}
    >
      <table className="odm-table">
        <thead>
          <tr>
            <th>{t.columns.name}</th>
            <th style={{ width: 90 }}>{t.columns.type}</th>
            <th style={{ width: 100 }}>{t.columns.size}</th>
            <th style={{ width: 160 }}>{t.columns.progress}</th>
            <th style={{ width: 90 }}>{t.columns.attempt}</th>
            <th style={{ width: 190 }}>{t.columns.status}</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>
                <span className="odm-mono" style={{ fontWeight: 600 }}>
                  {file.name}
                </span>
              </td>
              <td>
                <StatusBadge tone={file.type === 'VIDEO' ? 'blue' : 'gray'}>
                  {t.typeLabel[file.type]}
                </StatusBadge>
              </td>
              <td className="odm-tn">{formatSize(file.sizeBytes)}</td>
              <td>
                {successfullyUploadedStatuses.has(file.status) ? (
                  <>
                    <div
                      className="upload-file-progress"
                      role="progressbar"
                      aria-label={t.columns.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={100}
                    >
                      <span style={{ width: '100%' }} />
                    </div>
                    <div className="upload-file-progress-label">
                      {file.status === 'VALIDATING'
                        ? t.validating
                        : t.uploadComplete}
                    </div>
                  </>
                ) : file.status === 'UPLOADING' ? (
                  <>
                    <div
                      className="upload-file-progress is-indeterminate"
                      role="progressbar"
                      aria-label={
                        file.validationPending ? t.validating : t.uploading
                      }
                    >
                      <span />
                    </div>
                    <div className="upload-file-progress-label">
                      {file.validationPending ? t.validating : t.uploading}
                    </div>
                  </>
                ) : (
                  <div className="upload-file-progress-label">
                    {file.status === 'PENDING_UPLOAD'
                      ? t.notStarted
                      : t.incomplete}
                  </div>
                )}
              </td>
              <td className="odm-mono">
                {file.attempt > 0 ? `${file.attempt}/${file.maxAttempts}` : '—'}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge tone={STATUS_TONE[file.status]}>
                    {file.validationPending || file.status === 'VALIDATING'
                      ? t.validating
                      : t.statusLabel[file.status]}
                  </StatusBadge>
                  {file.manualTaskCreated ? (
                    <span style={{ fontSize: 11, color: 'var(--tx3)' }}>
                      {t.manualTaskCreated}
                    </span>
                  ) : null}
                  {onRetry &&
                  file.status === 'FAILED' &&
                  file.attempt < file.maxAttempts ? (
                    <button
                      type="button"
                      className="odm-btn odm-btn-sm"
                      disabled={retryingId === file.id}
                      onClick={() => onRetry(file.id)}
                    >
                      {retryingId === file.id ? t.retrying : t.retry}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
