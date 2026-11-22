import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Image, Select, Tag, Tooltip } from 'antd'
import './MissionQualityPanel.css'
import {
  CheckCircleFilled,
  WarningFilled,
  CloseCircleFilled,
  QuestionCircleFilled,
  LoadingOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { apiRequest } from '../../../shared/api/httpClient'
import { missionApi } from '../../mission/api/missionApi'
import { ImageQualityPanel } from './ImageQualityPanel'

type Row = {
  media_id: string
  file_name: string
  id?: string
  status?: string
  decision?: string
  human_decision?: string
}

type StatusInfo = { label: string; color: string; icon: React.ReactNode }

function getRowStatus(row: Row): StatusInfo {
  if (row.status === 'PROCESSING' || row.status === 'PENDING')
    return { label: 'Đang xử lý', color: 'processing', icon: <LoadingOutlined spin /> }
  if (row.status === 'FAILED')
    return { label: 'Có lỗi', color: 'error', icon: <CloseCircleFilled /> }
  if (row.human_decision === 'PASS')
    return { label: 'Đạt', color: 'success', icon: <CheckCircleFilled /> }
  if (row.human_decision === 'FAIL')
    return { label: 'Đã xác nhận không đạt', color: 'error', icon: <CloseCircleFilled /> }
  if (row.human_decision === 'REVIEW_REQUIRED')
    return { label: 'Cần xem lại', color: 'warning', icon: <WarningFilled /> }
  if (row.decision === 'PASS')
    return { label: 'Đạt', color: 'success', icon: <CheckCircleFilled /> }
  if (row.decision === 'REVIEW_REQUIRED')
    return { label: 'Cần xem lại', color: 'warning', icon: <WarningFilled /> }
  if (row.decision === 'FAIL')
    return { label: 'Không đạt', color: 'error', icon: <CloseCircleFilled /> }
  return { label: 'Chưa kiểm tra', color: 'default', icon: <QuestionCircleFilled /> }
}

const FALLBACK_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='%23bfbfbf'><rect width='24' height='24' fill='%23f5f5f5'/><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>"

export function MissionQualityPanel({
  missionId,
  mediaItems,
}: {
  missionId: string
  mediaItems?: Array<{
    mediaId?: string
    id?: string
    thumbnailUrl?: string | null
    previewUrl?: string | null
    url?: string | null
  }>
}) {
  return <Panel key={missionId} missionId={missionId} mediaItems={mediaItems} />
}

function Panel({
  missionId,
  mediaItems,
}: {
  missionId: string
  mediaItems?: Array<{
    mediaId?: string
    id?: string
    thumbnailUrl?: string | null
    previewUrl?: string | null
    url?: string | null
  }>
}) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState<string>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [mediaMap, setMediaMap] = useState<
    Record<string, { thumbnail?: string | null; preview?: string | null }>
  >({})
  const key = useRef<string | null>(null)
  const base = `/api/missions/${encodeURIComponent(missionId)}/media/quality-checks`

  // Ingest any thumbnails provided via props
  useEffect(() => {
    if (!mediaItems || mediaItems.length === 0) return
    setMediaMap(prev => {
      const next = { ...prev }
      for (const item of mediaItems) {
        const id = item.mediaId ?? item.id
        if (id) {
          next[id] = {
            thumbnail: item.thumbnailUrl ?? item.previewUrl ?? item.url,
            preview: item.previewUrl ?? item.url ?? item.thumbnailUrl,
          }
        }
      }
      return next
    })
  }, [mediaItems])

  // Load media files from mission API to provide thumbnails
  useEffect(() => {
    if (!open) return
    const abort = new AbortController()
    void (async () => {
      try {
        const res = await missionApi.getMissionResult(missionId, abort.signal).catch(() => null)
        const list =
          res?.mediaFiles && res.mediaFiles.length > 0
            ? res.mediaFiles
            : await missionApi.getMissionMedia(missionId, abort.signal).catch(() => [])
        if (!abort.signal.aborted && list && list.length > 0) {
          setMediaMap(prev => {
            const next = { ...prev }
            for (const item of list) {
              if (item.id) {
                next[item.id] = {
                  thumbnail: item.thumbnailUrl ?? item.previewUrl ?? item.url,
                  preview: item.previewUrl ?? item.url ?? item.thumbnailUrl,
                }
              }
            }
            return next
          })
        }
      } catch {
        // non-blocking
      }
    })()
    return () => abort.abort()
  }, [missionId, open])

  async function load() {
    try {
      setRows(await apiRequest<Row[]>(base))
      setError('')
    } catch {
      setError('Chưa tải được kiểm tra chất lượng. Bạn cần quyền kiểm duyệt nhiệm vụ và dịch vụ phải được bật.')
    }
  }

  useEffect(() => {
    if (!open) return
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const next = await apiRequest<Row[]>(base, { signal: abort.signal })
        if (!abort.signal.aborted) {
          setRows(next)
          setError('')
        }
        if (next.some(row => ['PENDING', 'PROCESSING'].includes(row.status ?? '')))
          timer = setTimeout(() => void poll(), 2500)
      } catch {
        if (!abort.signal.aborted)
          setError('Chưa tải được kiểm tra chất lượng. Bạn cần quyền kiểm duyệt và dịch vụ phải được bật.')
      }
    }
    void poll()
    return () => {
      abort.abort()
      clearTimeout(timer)
    }
  }, [base, open, busy])

  async function batch() {
    setBusy(true)
    setError('')
    key.current ??= crypto.randomUUID()
    try {
      await apiRequest(base, { method: 'POST', body: { requestKey: key.current, profile: 'PANORAMA' } })
      key.current = null
      await load()
    } catch {
      setError('Không bắt đầu được kiểm tra hàng loạt. Hãy kiểm tra quyền, giới hạn số ảnh và cấu hình dịch vụ.')
    } finally {
      setBusy(false)
    }
  }

  const completed = rows.filter(row => row.status === 'COMPLETED')
  const matching = rows.filter(
    row => filter === 'ALL' || (filter === 'UNCHECKED' ? !row.status : filter === 'FAILED' ? row.status === 'FAILED' : row.status === 'COMPLETED' && row.decision === filter)
  )

  const selectedRow = rows.find(r => r.media_id === selected)
  const selectedMedia = selected ? mediaMap[selected] : undefined

  return (
    <Card className="mission-quality-panel" size="small" title="Hỗ trợ kiểm duyệt chất lượng ảnh" extra={
      <Button size="small" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {open ? 'Thu gọn' : 'Mở kiểm tra chất lượng AI'}
      </Button>
    }>
      {open && (
        <div className="mission-quality-content">
          <div className="mission-quality-summary">
            <span>{`Tổng ảnh: ${rows.length}`}</span>
            <span>{`Đã kiểm tra: ${completed.length}`}</span>
            <span className="mission-quality-summary__pass">{`Đạt: ${completed.filter(row => row.decision === 'PASS').length}`}</span>
            <span className="mission-quality-summary__review">{`Cần xem lại: ${completed.filter(row => row.decision === 'REVIEW_REQUIRED').length}`}</span>
            <span className="mission-quality-summary__fail">{`Không đạt: ${completed.filter(row => row.decision === 'FAIL').length}`}</span>
            <span>{`Lỗi xử lý: ${rows.filter(row => row.status === 'FAILED').length}`}</span>
            <span>{`Chưa kiểm tra: ${rows.filter(row => !row.status).length}`}</span>
          </div>

          {rows.some(row => row.status === 'FAILED') && <Alert type="warning" showIcon
            message={`Chưa kiểm tra được ${rows.filter(row => row.status === 'FAILED').length} ảnh`}
            description="Dịch vụ xử lý chưa trả được kết quả. Mở từng ảnh để xem chi tiết hoặc thử kiểm tra lại." />}
          <div className="image-quality-actions">
            <Button type="primary" loading={busy} onClick={() => void batch()}>
              Kiểm tra tất cả ảnh
            </Button>
            <Button onClick={() => void load()}>Tải lại</Button>
            <Select
              aria-label="Lọc chất lượng ảnh"
              value={filter}
              onChange={setFilter}
              options={[
                ['ALL', 'Tất cả'],
                ['FAILED', 'Lỗi xử lý'],
                ['PASS', 'Đạt'],
                ['REVIEW_REQUIRED', 'Cần xem lại'],
                ['FAIL', 'Không đạt'],
                ['UNCHECKED', 'Chưa kiểm tra'],
              ].map(([value, label]) => ({ value, label }))}
            />
          </div>

          {error && <Alert type="error" message={error} />}
          {!error && rows.length === 0 && <p>Chưa có ảnh bản gốc hợp lệ để kiểm tra.</p>}

          <div className="mission-quality-list">
            {matching.map(row => {
              const status = getRowStatus(row)
              const media = mediaMap[row.media_id]
              const thumbUrl = media?.thumbnail ?? media?.preview
              const previewUrl = media?.preview ?? media?.thumbnail

              return (
                <div
                  className={`mission-quality-row${selected === row.media_id ? ' mission-quality-row--active' : ''}`}
                  key={row.media_id}
                >
                  <div className="mission-quality-row__left">
                    <div className="mission-quality-row__thumb-container">
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          preview={{ src: previewUrl ?? thumbUrl }}
                          alt={row.file_name}
                          width={56}
                          height={56}
                          className="mission-quality-row__thumb"
                          style={{ objectFit: 'cover', borderRadius: 6, display: 'block' }}
                          fallback={FALLBACK_SVG}
                        />
                      ) : (
                        <div className="mission-quality-row__placeholder" title={row.file_name}>
                          <FileImageOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
                        </div>
                      )}
                    </div>

                    <div className="mission-quality-row__details">
                      <div className="mission-quality-row__status-badge">
                        <Tag
                          color={status.color}
                          icon={status.icon}
                          className="mission-quality-row__tag"
                        >
                          {status.label}
                        </Tag>
                      </div>
                      <Tooltip title={row.file_name}>
                        <span className="mission-quality-row__filename">{row.file_name}</span>
                      </Tooltip>
                    </div>
                  </div>

                  <Button
                    size="small"
                    type={selected === row.media_id ? 'primary' : 'default'}
                    onClick={() => setSelected(row.media_id === selected ? undefined : row.media_id)}
                  >
                    Xem và duyệt
                  </Button>
                </div>
              )
            })}
          </div>

          {selected && (
            <ImageQualityPanel
              mediaId={selected}
              fileName={selectedRow?.file_name}
              thumbnailUrl={selectedMedia?.thumbnail}
              previewUrl={selectedMedia?.preview}
              onChanged={() => void load()}
            />
          )}

          <p className="mission-quality-footer">
            Người duyệt xác nhận ảnh trước khi bàn giao.
          </p>
        </div>
      )}
    </Card>
  )
}
