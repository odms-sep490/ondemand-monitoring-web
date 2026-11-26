import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Image, Input, Modal, Select, Tag } from 'antd'
import {
  AimOutlined,
  SunOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  TeamOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { apiRequest } from '../../../shared/api/httpClient'
import './ImageQualityPanel.css'

type Result = {
  decision: string
  profileVersion: string
  algorithmVersion: string
  criteria: Array<{ code: string; status: string; message: string }>
  warnings: string[]
  unchecked: string[]
  classifier: { status: string }
  metrics: Record<string, unknown>
}

export type QualityJob = {
  id: string
  media_id: string
  status: string
  created_at: string
  decision?: string
  result?: Result
  error_code?: string
  reviews?: Array<{ decision: string; note: string; reviewed_at: string }>
}

const labels: Record<string, string> = {
  PASS: 'Đạt',
  REVIEW_REQUIRED: 'Cần xem lại',
  FAIL: 'Không đạt',
  INDETERMINATE: 'Chưa đủ thông tin',
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang phân tích',
  COMPLETED: 'Đã kiểm tra',
  FAILED: 'Kiểm tra thất bại',
  CANCELLED: 'Đã hủy',
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CriterionDetails({ criterion, metrics, fields }: {
  criterion?: Result['criteria'][number]
  metrics: Record<string, unknown>
  fields: Array<[string, string]>
}) {
  const [open, setOpen] = useState(false)
  const title = ({ BLUR: 'Độ nét', EXPOSURE: 'Độ sáng', RESOLUTION: 'Kích thước', INTEGRITY: 'Tệp ảnh' } as Record<string, string>)[criterion?.code ?? ''] ?? 'Chi tiết đánh giá'
  return <>
    <Button type="link" size="small" className="iq-criterion-detail-button" onClick={() => setOpen(true)}>Xem chi tiết</Button>
    <Modal open={open} onCancel={() => setOpen(false)} title={title} width={460}
      footer={<Button type="primary" onClick={() => setOpen(false)}>Đóng</Button>}>
    <div className="iq-criterion-details">
    <p>{criterion ? ({
      BLUR: criterion.status === 'PASS' ? 'Ảnh có độ nét phù hợp.' : 'Ảnh có thể mờ hoặc ít chi tiết. Hãy phóng to để kiểm tra.',
      EXPOSURE: criterion.status === 'PASS' ? 'Độ sáng phù hợp.' : 'Ảnh có vùng quá tối hoặc quá sáng. Hãy kiểm tra lại.',
      RESOLUTION: criterion.message,
      INTEGRITY: criterion.status === 'PASS' ? 'Tệp ảnh mở được và thông tin tệp phù hợp.' : 'Tệp ảnh cần được kiểm tra lại.',
    } as Record<string, string>)[criterion.code] ?? criterion.message : 'Chưa kiểm tra ảnh này.'}</p>
    <dl>
      {fields.map(([key, label]) => {
        const value = metrics[key]
        if (value == null) return null
        const display = typeof value === 'number'
          ? key === 'bytes'
            ? formatFileSize(value)
            : key.endsWith('Ratio')
            ? (value * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '%'
            : value.toLocaleString('vi-VN', { maximumFractionDigits: 3 })
          : String(value)
        return <div key={key}><dt>{label}</dt><dd>{display}</dd></div>
      })}
    </dl>
    </div>
    </Modal>
  </>
}
const pending = (job?: QualityJob) => job && ['PENDING', 'PROCESSING'].includes(job.status)

export function ImageQualityPanel({
  mediaId,
  customer = false,
  onChanged,
  thumbnailUrl,
  previewUrl,
  fileName,
}: {
  mediaId: string
  customer?: boolean
  onChanged?: () => void
  thumbnailUrl?: string | null
  previewUrl?: string | null
  fileName?: string
}) {
  return (
    <Panel
      key={`${mediaId}:${customer}`}
      mediaId={mediaId}
      customer={customer}
      onChanged={onChanged}
      thumbnailUrl={thumbnailUrl}
      previewUrl={previewUrl}
      fileName={fileName}
    />
  )
}

function Panel({
  mediaId,
  customer,
  onChanged,
  thumbnailUrl,
  previewUrl,
  fileName,
}: {
  mediaId: string
  customer: boolean
  onChanged?: () => void
  thumbnailUrl?: string | null
  previewUrl?: string | null
  fileName?: string
}) {
  const base = `/api/${customer ? 'customer/media' : 'mission-media'}/${encodeURIComponent(mediaId)}/quality-checks`
  const [history, setHistory] = useState<QualityJob[]>([])
  const [job, setJob] = useState<QualityJob>()
  const profile = 'PANORAMA'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState('REVIEW_REQUIRED')
  const [showDetails, setShowDetails] = useState(false)
  const requestKey = useRef<string | null>(null)
  const reviewReady = job?.status === 'COMPLETED'
  const reviewHint = pending(job)
    ? 'Đang kiểm tra chất lượng ảnh. Bạn có thể lưu quyết định khi có kết quả.'
    : job
      ? 'Chọn Kiểm tra lại và chờ kết quả để lưu quyết định.'
      : 'Chọn Kiểm tra chất lượng AI và chờ kết quả để lưu quyết định.'

  useEffect(() => {
    setDecision(job?.reviews?.[0]?.decision ?? 'REVIEW_REQUIRED')
  }, [job?.id, job?.reviews])

  useEffect(() => {
    const abort = new AbortController()
    apiRequest<QualityJob[]>(base, { signal: abort.signal })
      .then(rows => {
        setHistory(rows)
        setJob(rows[0])
        if (!customer && rows[0]) {
          void apiRequest<QualityJob>(`/api/image-quality/checks/${rows[0].id}`, {
            signal: abort.signal,
          })
            .then(setJob)
            .catch(() => {
              if (!abort.signal.aborted) setError('Chưa tải được lịch sử xác nhận của nhân viên.')
            })
        }
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError('Chưa tải được lịch sử. Hãy kiểm tra quyền truy cập hoặc cấu hình dịch vụ.')
      })
    return () => abort.abort()
  }, [base, customer])

  useEffect(() => {
    if (!pending(job)) return
    const abort = new AbortController()
    const timer = setTimeout(() => {
      apiRequest<QualityJob>(`/api/image-quality/checks/${job!.id}`, { signal: abort.signal })
        .then(next => {
          setJob(next)
          if (!pending(next)) {
            onChanged?.()
            setHistory(rows => [next, ...rows.filter(row => row.id !== next.id)])
          }
        })
        .catch(() => {
          if (!abort.signal.aborted) setError('Chưa cập nhật được kết quả. Nhấn Tải lại để kiểm tra trạng thái.')
        })
    }, 2000)
    return () => {
      clearTimeout(timer)
      abort.abort()
    }
  }, [job, onChanged])

  async function start() {
    if (busy || pending(job)) return
    setBusy(true)
    setError('')
    requestKey.current ??= crypto.randomUUID()
    try {
      const next = await apiRequest<QualityJob>(base, {
        method: 'POST',
        body: { requestKey: requestKey.current, profile },
      })
      setJob(next)
      requestKey.current = null
    } catch {
      setError(
        'Chưa bắt đầu được. Ảnh cần còn hạn, đã bàn giao bản gốc hoặc thuộc quyền kiểm duyệt của bạn. Dịch vụ cũng cần được bật.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function review() {
    if (job?.status !== 'COMPLETED' || busy) return
    setBusy(true)
    setError('')
    try {
      setJob(
        await apiRequest<QualityJob>(`/api/image-quality/checks/${job.id}/reviews`, {
          method: 'POST',
          body: { decision, note },
        })
      )
      setNote('')
      onChanged?.()
    } catch {
      setError('Không lưu được quyết định. Chỉ nhân viên có quyền kiểm duyệt mới được xác nhận.')
    } finally {
      setBusy(false)
    }
  }

  const result = job?.result
  const metrics = result?.metrics ?? {}
  const width = metrics.width as number | undefined
  const height = metrics.height as number | undefined
  const bytes = metrics.bytes as number | undefined
  const dimText = width && height ? `${width} × ${height} px` : undefined
  const sizeText = formatFileSize(bytes)
  const metaLine = [dimText, sizeText].filter(Boolean).join(' | ')

  const blurCriterion = result?.criteria.find(c => c.code === 'BLUR')
  const exposureCriterion = result?.criteria.find(c => c.code === 'EXPOSURE')
  const resCriterion = result?.criteria.find(c => c.code === 'RESOLUTION')
  const integrityCriterion = result?.criteria.find(c => c.code === 'INTEGRITY')

  const savedDecision = job?.reviews?.[0]?.decision
  const overallDecision = savedDecision ?? result?.decision ?? job?.decision ?? 'REVIEW_REQUIRED'
  const isPass = overallDecision === 'PASS'

  const conclusionMessage =
    blurCriterion?.status === 'REVIEW_REQUIRED'
      ? blurCriterion.message
      : result ? 'Xem các mục cần lưu ý trước khi xác nhận ảnh.' : 'Chạy kiểm tra để xem kết quả.'

  const displayImageSrc = previewUrl ?? thumbnailUrl ?? ''

  return (
    <div className="iq-dashboard-layout">
      {/* CỘT TRÁI: KIỂM TRA CHẤT LƯỢNG ẢNH BẰNG AI */}
      <div className="iq-card iq-main-card">
        {/* Header */}
        <div className="iq-main-header">
          <div className="iq-header-title-group">
            <div className="iq-ai-icon-badge">
              <PictureOutlined aria-hidden="true" />
            </div>
            <div>
              <h3 className="iq-title">Kiểm tra ảnh</h3>
              <p className="iq-subtitle">Xem kết quả và xác nhận chất lượng ảnh.</p>
            </div>
          </div>
          {job && (
            <div className={`iq-status-pill iq-status-pill--${isPass ? 'pass' : 'review'}`}>
              <InfoCircleOutlined />
              <span>{labels[overallDecision] ?? overallDecision}</span>
            </div>
          )}
        </div>

        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

        <div role="status" aria-live="polite" className="iq-live-status">
          {job ? labels[job.status] ?? job.status : 'Chưa kiểm tra ảnh này.'}
        </div>

        {/* Media Preview & Actions Box */}
        <div className="iq-preview-section">
          <div className="iq-image-container">
            {displayImageSrc ? (
              <Image
                src={displayImageSrc}
                alt={fileName ?? 'Ảnh kiểm tra'}
                className="iq-preview-image"
                preview={{ mask: 'Phóng to' }}
              />
            ) : (
              <div className="iq-no-image-placeholder">
                <PictureOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                <span>Chưa có ảnh</span>
              </div>
            )}
          </div>

          <div className="iq-meta-col">
            <div className="iq-filename-title" title={fileName ?? mediaId}>
              {fileName ?? mediaId}
            </div>
            {metaLine && <div className="iq-meta-metrics">{metaLine}</div>}

            <div className="iq-action-buttons">
              <Button
                type="primary"
                aria-label={job ? 'Kiểm tra lại' : 'Kiểm tra chất lượng AI'}
                loading={busy || pending(job)}
                onClick={() => void start()}
                className="iq-btn-recheck"
              >
                <ReloadOutlined aria-hidden="true" spin={busy || pending(job)} style={{ marginRight: 6 }} />
                {job ? 'Kiểm tra lại' : 'Kiểm tra chất lượng AI'}
              </Button>
              {displayImageSrc && (
                <Button
                  onClick={() => window.open(displayImageSrc, '_blank')}
                  className="iq-btn-download"
                  aria-label="Tải ảnh"
                >
                  <DownloadOutlined aria-hidden="true" style={{ marginRight: 6 }} />
                  Tải ảnh
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Kết quả đánh giá Grid */}
        <div className="iq-results-section">
          <h4 className="iq-results-title">Kết quả đánh giá</h4>

          <div className="iq-criteria-grid">
            {/* 1. Độ nét */}
            <div className="iq-criterion-card">
              <AimOutlined className="iq-criterion-icon" />
              <div className="iq-criterion-name">Độ nét</div>
              {blurCriterion ? (
                <span className={`iq-criterion-badge is-${blurCriterion.status.toLowerCase()}`}>
                  {blurCriterion.status === 'PASS' && <CheckOutlined />}
                  {blurCriterion.status === 'PASS' ? 'Đạt' : 'Cần xem lại'}
                </span>
              ) : (
                <span className="iq-criterion-badge is-neutral">Chưa đo</span>
              )}
              <CriterionDetails criterion={blurCriterion} metrics={metrics} fields={[]} />
            </div>

            {/* 2. Độ sáng */}
            <div className="iq-criterion-card">
              <SunOutlined className="iq-criterion-icon" />
              <div className="iq-criterion-name">Độ sáng</div>
              {exposureCriterion ? (
                <span className={`iq-criterion-badge is-${exposureCriterion.status.toLowerCase()}`}>
                  {exposureCriterion.status === 'PASS' && <CheckOutlined />}
                  {exposureCriterion.status === 'PASS' ? 'Đạt' : 'Cần xem lại'}
                </span>
              ) : (
                <span className="iq-criterion-badge is-neutral">Chưa đo</span>
              )}
              <CriterionDetails criterion={exposureCriterion} metrics={metrics} fields={[['brightness', 'Độ sáng trung bình'], ['darkRatio', 'Vùng rất tối'], ['brightRatio', 'Vùng rất sáng']]} />
            </div>

            {/* 3. Kích thước */}
            <div className="iq-criterion-card">
              <PictureOutlined className="iq-criterion-icon" />
              <div className="iq-criterion-name">Kích thước</div>
              {resCriterion ? (
                <span className={`iq-criterion-badge is-${resCriterion.status.toLowerCase()}`}>
                  {resCriterion.status === 'PASS' && <CheckOutlined />}
                  {resCriterion.status === 'PASS' ? 'Đạt' : 'Cần xem lại'}
                </span>
              ) : (
                <span className="iq-criterion-badge is-neutral">Chưa đo</span>
              )}
              {dimText && <span className="iq-criterion-subtext">{dimText}</span>}
              <CriterionDetails criterion={resCriterion} metrics={metrics} fields={[['width', 'Chiều rộng (px)'], ['height', 'Chiều cao (px)'], ['bytes', 'Dung lượng']]} />
            </div>

            {/* 4. Tệp ảnh */}
            <div className="iq-criterion-card">
              <SafetyCertificateOutlined className="iq-criterion-icon" />
              <div className="iq-criterion-name">Tệp ảnh</div>
              {integrityCriterion ? (
                <span className={`iq-criterion-badge is-${integrityCriterion.status.toLowerCase()}`}>
                  {integrityCriterion.status === 'PASS' && <CheckOutlined />}
                  {integrityCriterion.status === 'PASS' ? 'Đạt' : 'Cần xem lại'}
                </span>
              ) : (
                <span className="iq-criterion-badge is-neutral">Chưa đo</span>
              )}
              <CriterionDetails criterion={integrityCriterion} metrics={metrics} fields={[['actualMime', 'Định dạng ảnh']]} />
            </div>
          </div>

          {/* Banner Kết luận AI */}
          <div className="iq-conclusion-banner">
            <InfoCircleOutlined className="iq-conclusion-icon" />
            <div className="iq-conclusion-content">
              <div className="iq-conclusion-headline">
                Kết quả: <span className="iq-conclusion-status">{labels[overallDecision] ?? overallDecision}</span>
              </div>
              <div className="iq-conclusion-detail">{conclusionMessage}</div>
            </div>
          </div>

          {result && (
            <Alert
              type="info"
              showIcon
              message="Kết quả tham khảo. Người duyệt xác nhận trước khi bàn giao."
              className="iq-classifier-alert"
            />
          )}

          {/* Thông tin kiểm tra Accordion */}
          <div className="iq-details-accordion">
            <button
              type="button"
              className="iq-accordion-trigger"
              onClick={() => setShowDetails(prev => !prev)}
            >
              {showDetails ? <UpOutlined /> : <DownOutlined />}
              <span>Thông tin kiểm tra</span>
            </button>

            {showDetails && result && (
              <div className="iq-accordion-content">
                {history.length > 1 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                      Lịch sử các lần kiểm tra:
                    </label>
                    <Select
                      aria-label="Lịch sử kiểm tra chất lượng"
                      value={job?.id}
                      style={{ width: '100%' }}
                      options={history.map(row => ({
                        value: row.id,
                        label: `${new Date(row.created_at).toLocaleString('vi-VN')} · ${labels[row.decision ?? row.status] ?? row.status}`,
                      }))}
                      onChange={id => {
                        setError('')
                        apiRequest<QualityJob>(`/api/image-quality/checks/${id}`)
                          .then(setJob)
                          .catch(() => setError('Không mở được lần kiểm tra này.'))
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: QUYẾT ĐỊNH CỦA NHÂN VIÊN */}
      {!customer && (
        <div className="iq-card iq-review-card">
          <div className="iq-review-header">
            <TeamOutlined className="iq-review-icon" />
            <h3 className="iq-review-title">Xác nhận ảnh</h3>
          </div>

          {/* Custom Radio Options */}
          <div className="iq-decision-options" role="radiogroup">
            <div
              className={`iq-decision-option${decision === 'REVIEW_REQUIRED' ? ' is-selected' : ''}`}
              onClick={() => setDecision('REVIEW_REQUIRED')}
              role="radio"
              aria-checked={decision === 'REVIEW_REQUIRED'}
            >
              <div className="iq-radio-indicator">
                {decision === 'REVIEW_REQUIRED' && <div className="iq-radio-dot" />}
              </div>
              <span className="iq-decision-label">Cần xem lại</span>
            </div>

            <div
              className={`iq-decision-option${decision === 'PASS' ? ' is-selected' : ''}`}
              onClick={() => setDecision('PASS')}
              role="radio"
              aria-checked={decision === 'PASS'}
            >
              <div className="iq-radio-indicator">
                {decision === 'PASS' && <div className="iq-radio-dot" />}
              </div>
              <span className="iq-decision-label">Đạt</span>
            </div>

            <div
              className={`iq-decision-option${decision === 'FAIL' ? ' is-selected' : ''}`}
              onClick={() => setDecision('FAIL')}
              role="radio"
              aria-checked={decision === 'FAIL'}
            >
              <div className="iq-radio-indicator">
                {decision === 'FAIL' && <div className="iq-radio-dot" />}
              </div>
              <span className="iq-decision-label">Không đạt</span>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="iq-note-field">
            <label className="iq-field-label">Ghi chú (tùy chọn)</label>
            <Input.TextArea
              aria-label="Ghi chú kiểm duyệt"
              maxLength={500}
              rows={4}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nhập ghi chú..."
              className="iq-note-textarea"
            />
            <div className="iq-char-counter">{note.length} / 500</div>
          </div>

          {/* Nút Lưu quyết định */}
          <div className="iq-review-hint" role="status">
            {!reviewReady && reviewHint}
          </div>
          <Button
            type="primary"
            disabled={!reviewReady || busy}
            loading={busy}
            onClick={() => void review()}
            className="iq-btn-submit-decision"
          >
            Lưu quyết định
          </Button>

          {/* Lịch sử xác nhận cũ nếu có */}
          {job?.reviews && job.reviews.length > 0 && (
            <div className="iq-previous-reviews">
              <div className="iq-prev-reviews-title">Lịch sử đánh giá gần nhất:</div>
              {job.reviews.map((rev, idx) => (
                <div key={idx} className="iq-review-log-item">
                  <Tag color={rev.decision === 'PASS' ? 'green' : rev.decision === 'FAIL' ? 'red' : 'orange'}>
                    {labels[rev.decision] ?? rev.decision}
                  </Tag>
                  <span className="iq-review-log-note">{rev.note || 'Không có ghi chú'}</span>
                  <span className="iq-review-log-time">
                    {new Date(rev.reviewed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

