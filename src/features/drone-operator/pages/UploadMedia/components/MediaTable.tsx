import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import type { MediaFile, MediaFileStatus } from '../../../types/mission'
import { mediaTableMessages } from './MediaTable.messages'

const STATUS_TONE: Record<MediaFileStatus, 'gray' | 'blue' | 'green' | 'red'> =
  {
    UPLOADED: 'green',
    UPLOADING: 'blue',
    FAILED: 'red',
    PENDING_UPLOAD: 'gray',
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
                  {file.type}
                </StatusBadge>
              </td>
              <td className="odm-tn">{formatSize(file.sizeBytes)}</td>
              <td>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--sf3)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${file.progressPct}%`,
                      background:
                        file.status === 'FAILED'
                          ? 'var(--red-dot)'
                          : 'var(--blue-dot)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div
                  className="odm-tn"
                  style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}
                >
                  {file.progressPct}%
                </div>
              </td>
              <td className="odm-mono">
                {file.attempt > 0 ? `${file.attempt}/${file.maxAttempts}` : '—'}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge tone={STATUS_TONE[file.status]}>
                    {file.validationPending
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
