import { UploadOutlined, PictureOutlined } from '@ant-design/icons'
import './ChangeAnalysisDialog.css'
import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Modal, Row, Select, Space, Spin } from 'antd'
import { apiRequest } from '../../../../shared/api/httpClient'
import { customerMediaApi } from '../../api/customerMediaApi'
import type { CustomerMediaResponse } from '../../lib/media/types'

const path = '/api/customer/ai/change-analyses'
type Job = { id: string; status: string; error_code?: string; created_at: string; started_at?: string; completed_at?: string; before_asset?: string; after_asset?: string }
type Result = {
  aiChangedPixelRatio?: number; visualChangedPixelRatio?: number; processingVersion?: string
  before: string; after: string; overlay: string; changedPixelRatio: number
  validPixelRatio: number; modelName: string; modelVersion: string
}
type Choice = { file?: File; asset?: CustomerMediaResponse }
const statuses: Record<string, string> = {
  PENDING: 'Đang chờ', PROCESSING: 'Đang phân tích', COMPLETED: 'Hoàn tất', FAILED: 'Thất bại',
}
const errors: Record<string, string> = {
  ALIGNMENT_FAILED: 'Không thể căn chỉnh ảnh. Hãy chọn hai ảnh cùng khu vực và góc chụp gần nhau.',
  NOT_CONFIGURED: 'Dịch vụ AI chưa được cấu hình.',
  UNSUPPORTED_INPUT: 'Ảnh không hợp lệ. Hãy chọn JPEG hoặc PNG từ 256 đến 4096 pixel, tối đa 8 MB mỗi ảnh.',
  WORKER_BUSY: 'Dịch vụ đang xử lý ảnh khác. Hãy thử lại sau.',
  WORKER_UNAVAILABLE: 'Không kết nối được dịch vụ AI. Cần khởi động worker AI và kiểm tra kết nối từ backend.',
  WORKER_TIMEOUT: 'Dịch vụ AI xử lý quá thời gian cho phép. Hãy kiểm tra worker trước khi phân tích lại.',
  INFERENCE_FAILED: 'Mô hình AI không xử lý được ảnh. Hãy kiểm tra cấu hình model và nhật ký worker.',
}
const png = (value: string) => 'data:image/png;base64,' + value

function ImageChoice({ label, choice, assets, onChange }: {
  label: string; choice: Choice; assets: CustomerMediaResponse[]; onChange: (choice: Choice) => void
}) {
  const [local, setLocal] = useState<string>()
  useEffect(() => {
    if (!choice.file) return
    const url = URL.createObjectURL(choice.file)
    setLocal(url)
    return () => URL.revokeObjectURL(url)
  }, [choice.file])
  const preview = choice.file ? local : choice.asset?.thumbnailUrl ?? choice.asset?.previewUrl
  return <Card className="change-image-card" size="small" title={label}>
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select aria-label={label + ' đã bàn giao'} placeholder="Chọn ảnh đã bàn giao"
        style={{ width: '100%' }} value={choice.asset?.mediaId} allowClear showSearch
        optionFilterProp="label" options={assets.map(asset => ({
          value: asset.mediaId,
          label: [asset.fileName ?? asset.mediaId, asset.capturedAt && new Date(asset.capturedAt).toLocaleString('vi-VN')].filter(Boolean).join(' · '),
        }))} onChange={id => onChange({ asset: assets.find(asset => asset.mediaId === id) })} />
      <label className="change-upload">
        <input key={choice.asset?.mediaId ?? 'file'} type="file"
          aria-label={label + ' từ máy'} accept="image/jpeg,image/png"
          onChange={event => onChange({ file: event.target.files?.[0] })} />
        <UploadOutlined aria-hidden />
        <span>{choice.file ? 'Đổi ảnh từ máy' : 'Tải ảnh từ máy'}</span>
        <small>JPG, PNG · Tối đa 8 MB</small>
      </label>
      <div className={'change-preview' + (preview ? ' has-image' : '')}>
        {preview ? <img src={preview} alt={label} /> : <>
          <PictureOutlined aria-hidden />
          <span>Chưa chọn {label.toLocaleLowerCase('vi-VN')}</span>
        </>}
      </div>
      <div className="change-filename" title={choice.file?.name ?? choice.asset?.fileName}>
        {choice.file?.name ?? choice.asset?.fileName ?? 'Chọn ảnh đã bàn giao hoặc tải ảnh của bạn'}
      </div>    </Space>
  </Card>
}

export function ChangeAnalysisDialog({ onClose }: { onClose: () => void }) {
  const [assets, setAssets] = useState<CustomerMediaResponse[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selected, setSelected] = useState<Job>()
  const [result, setResult] = useState<Result>()
  const [before, setBefore] = useState<Choice>({})
  const [after, setAfter] = useState<Choice>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [split, setSplit] = useState(50)
  const [opacity, setOpacity] = useState(48)
  const [overlay, setOverlay] = useState(true)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const refresh = () => apiRequest<Job[]>(path).then(setJobs)
  useEffect(() => {
    const controller = new AbortController()
    void customerMediaApi.listAvailable(controller.signal).then(items =>
      setAssets(items.filter(item => item.mediaType === 'IMAGE' && item.canDownloadOriginal)),
    ).catch(() => { if (!controller.signal.aborted) setMessage('Không tải được ảnh đã bàn giao.') })
    void apiRequest<Job[]>(path, { signal: controller.signal }).then(setJobs)
      .catch(() => { if (!controller.signal.aborted) setMessage('Không tải được lịch sử phân tích.') })
    return () => controller.abort()
  }, [])

  const id = selected?.id
  const status = selected?.status
  useEffect(() => {
    if (!id || !status) return
    const controller = new AbortController()
    if (status === 'COMPLETED') {
      void apiRequest<Result>(path + '/' + id + '/result', { signal: controller.signal }).then(setResult)
        .catch(() => { if (!controller.signal.aborted) setMessage('Không tải được kết quả phân tích.') })
    }
    const timer = status === 'PENDING' || status === 'PROCESSING' ? window.setInterval(() => {
      void apiRequest<Job>(path + '/' + id, { signal: controller.signal }).then(job => {
        setSelected(job)
        setJobs(current => current.map(item => item.id === job.id ? job : item))
      }).catch(() => { if (!controller.signal.aborted) setMessage('Chưa cập nhật được trạng thái. Hệ thống sẽ thử lại.') })
    }, 3000) : undefined
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [id, status])

  async function submit() {
    if (![before, after].every(choice => choice.file || choice.asset)) return
    const invalid = [before, after].some(({ file }) => file &&
      (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 8 * 1024 * 1024))
    if (invalid) return setMessage(errors.UNSUPPORTED_INPUT)
    if (before.asset && before.asset.mediaId === after.asset?.mediaId) return setMessage('Hãy chọn hai ảnh khác nhau.')
    const body = new FormData()
    body.set('requestKey', requestKey)
    for (const [name, choice] of [['before', before], ['after', after]] as const) {
      if (choice.file) body.set(name, choice.file)
      else if (choice.asset) body.set(name + 'Asset', choice.asset.mediaId)
    }
    setBusy(true)
    setMessage('')
    try {
      const job = await apiRequest<Job>(path, { method: 'POST', body })
      setResult(undefined)
      setSelected(job)
      setJobs(current => [job, ...current.filter(item => item.id !== job.id)])
      setRequestKey(crypto.randomUUID())
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(errors[code] ?? 'Không tạo được phân tích. Kiểm tra ảnh và thử lại.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!id) return
    try {
      await apiRequest(path + '/' + id, { method: 'DELETE' })
      setSelected(undefined)
      setResult(undefined)
      await refresh()
    } catch {
      setMessage('Không xóa được bản phân tích.')
    }
  }

  return <Modal open onCancel={onClose} footer={null} width={1080} className="change-analysis-modal" title="AI phân tích thay đổi">
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert type="info" message="Chọn hai ảnh cùng khu vực, cùng hướng chụp và ít chênh lệch về độ cao." />
      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}><ImageChoice label="Ảnh trước" choice={before} assets={assets}
          onChange={choice => { setBefore(choice); setRequestKey(crypto.randomUUID()) }} /></Col>
        <Col xs={24} md={12}><ImageChoice label="Ảnh sau" choice={after} assets={assets}
          onChange={choice => { setAfter(choice); setRequestKey(crypto.randomUUID()) }} /></Col>
      </Row>
      <div className="change-action-bar"><span>Đã chọn {[before, after].filter(choice => choice.file || choice.asset).length}/2 ảnh</span><Button size="large" type="primary" loading={busy} disabled={!(before.file || before.asset) || !(after.file || after.asset)}
        onClick={() => void submit()}>Phân tích bằng AI</Button></div>
      {message && <Alert type="error" message={message} />}
      <div className="change-history"><label htmlFor="change-history">Lịch sử phân tích</label><Select id="change-history" aria-label="Lịch sử phân tích" placeholder="Lịch sử phân tích" value={id} style={{ width: '100%' }}
        options={jobs.map(job => ({ value: job.id, label: new Date(job.created_at).toLocaleString('vi-VN') + ' · ' + statuses[job.status] }))}
        onChange={value => { setResult(undefined); setMessage(''); setSelected(jobs.find(job => job.id === value)) }} /></div>
      {selected && <Space wrap>
        {(status === 'PENDING' || status === 'PROCESSING') && <Spin size="small" />}
        <strong>{statuses[selected.status]}</strong>
        <Button danger onClick={() => void remove()}>Xóa phân tích</Button>
      </Space>}
      {selected?.error_code && <Alert type="error" message={errors[selected.error_code] ?? 'Phân tích thất bại. Vui lòng thử lại.'} />}
      {result && <>
        <Alert type="warning" message="Kết quả AI tham khảo — chưa được chuyên viên xác nhận." />
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
          <img src={png(result.after)} alt="Ảnh sau đã căn chỉnh" style={{ width: '100%', display: 'block' }} />
          {overlay && <div aria-label="Vùng thay đổi màu cam" role="img" style={{
            position: 'absolute', inset: 0,
            backgroundColor: `rgba(255, 85, 0, ${Math.min(65, Math.max(0, opacity)) / 100})`,
            maskImage: `url(${png(result.overlay)})`, maskSize: '100% 100%', maskRepeat: 'no-repeat',
            WebkitMaskImage: `url(${png(result.overlay)})`, WebkitMaskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat',
            pointerEvents: 'none',
          }} />}
          <img src={png(result.before)} alt="Ảnh trước" style={{ position: 'absolute', inset: 0, width: '100%', clipPath: 'inset(0 ' + (100 - split) + '% 0 0)' }} />
          <div aria-hidden style={{ position: 'absolute', insetBlock: 0, left: split + '%', borderLeft: '2px solid white' }} />
        </div>
        <label>Kéo để xem ảnh trước và sau <input type="range" min={0} max={100} value={split} onChange={event => setSplit(+event.target.value)} /></label>
        <Space wrap>
          <label><input type="checkbox" checked={overlay} onChange={event => setOverlay(event.target.checked)} /> Hiện vùng thay đổi</label>
          <label>Độ đậm màu đánh dấu <input type="range" min={0} max={65} value={opacity} disabled={!overlay}
            onChange={event => setOpacity(+event.target.value)} /></label>
        </Space>
        <div><strong>Kết quả so sánh</strong></div>
        <div>Hệ thống đánh dấu những điểm khác nhau trên khoảng <strong>{(result.changedPixelRatio * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</strong> diện tích ảnh có thể so sánh.</div>
        <div>Vùng màu cam là những nơi có dấu hiệu thay đổi giữa hai lần chụp. Kéo thanh so sánh hoặc tắt màu đánh dấu để xem rõ chi tiết.</div>
        <Alert type="info" message="Con số này không phải phần trăm hoàn thành công trình. Ánh sáng, bóng cây, xe di chuyển hoặc góc chụp cũng có thể tạo khác biệt. Kết quả giúp bạn tham khảo; hãy đối chiếu ảnh để xác nhận thay đổi thực tế." />
        {result.validPixelRatio < 0.95 && <div>Một phần ảnh không thể đối chiếu do góc chụp khác nhau. Kết quả chỉ tính trên phần ảnh có thể so sánh.</div>}
      </>}
    </Space>
  </Modal>
}
