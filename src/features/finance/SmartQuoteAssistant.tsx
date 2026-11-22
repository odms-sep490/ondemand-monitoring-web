import './SmartQuoteAssistant.css'
import { useEffect, useId, useState } from 'react'
import { Alert, Button, Input, InputNumber, Modal, Select, Spin, Table } from 'antd'
import { ArrowRightOutlined, BulbOutlined, CheckCircleOutlined, CopyOutlined, DownOutlined, FileTextOutlined, MessageOutlined, SendOutlined, SwapOutlined } from '@ant-design/icons'
import { apiRequest } from '../../shared/api/httpClient'
import { formatVnd } from '../../shared/lib/formatVnd'

type Analysis = { revision: string; version: number; total: number; readAt: string; factors?: string[]; mediaOptions?: {itemId:string;label:string;images:number;videos:number;includedImages:number;includedVideos:number}[]; warnings: string[]; items: { id: string; orderChecklistItemId?: string; description: string; quantity: number; unitPrice: number; amount: number }[] }
type Comparison = { revision: string; options: { label: string; status: string; total: number | null; difference?: number | null; explanation: string }[] }
export function SmartQuoteAssistant({
  orderId,
  quoteId,
  customer = false,
  defaultOpen = false,
  onPrepare,
  preparing = false,
  prepareDisabled = false,
  prepareHint,
}: {
  orderId: string
  quoteId?: string
  customer?: boolean
  defaultOpen?: boolean
  onPrepare?: () => Promise<void>
  preparing?: boolean
  prepareDisabled?: boolean
  prepareHint?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details className="smart-quote-assistant" open={open} onToggle={e => setOpen(e.currentTarget.open)}>
      <summary className="sqa-trigger">
        <span className="sqa-icon"><BulbOutlined aria-hidden /></span>
        <span className="sqa-trigger-copy">
          <span className="sqa-trigger-title">{customer ? 'Hiểu báo giá của bạn' : 'Phân tích báo giá'}</span>
          <span className="sqa-trigger-hint">Xem chi phí & hỏi AI</span>
        </span>
        <span className="sqa-open">Mở <ArrowRightOutlined aria-hidden /></span>
      </summary>
      <Modal title="Chi tiết báo giá" open={open} onCancel={() => setOpen(false)} footer={null} width={quoteId ? 980 : 440} centered destroyOnHidden className="sqa-modal">
        <div className="sqa-frame">
      {open && (quoteId ? (
        <QuoteAnalysis key={`${orderId}:${quoteId}`} orderId={orderId} quoteId={quoteId} customer={customer} />
      ) : (
        <div className="sqa-empty">
          <span className="sqa-empty-icon"><FileTextOutlined aria-hidden /></span>
          <strong>Xem rõ từng khoản chi phí</strong>
          <p>Lưu bản nháp để so sánh phương án và hỏi AI.</p>
          {onPrepare && <Button type="primary" block icon={<ArrowRightOutlined aria-hidden />} loading={preparing} disabled={prepareDisabled || preparing} onClick={() => void onPrepare()}>Lưu và phân tích</Button>}
          <small><CheckCircleOutlined aria-hidden /> Chỉ lưu nháp, chưa gửi cho khách</small>
          {prepareHint && <p className="sqa-blocked">{prepareHint}</p>}
        </div>
      ))}
        </div>
      </Modal>
    </details>
  )
}
function QuoteAnalysis({ orderId, quoteId, customer }: { orderId: string; quoteId: string; customer: boolean }) {
  const fieldId = useId()
  const base = `/api/${customer ? 'customer' : 'manager'}/orders/${encodeURIComponent(orderId)}/quotes/${encodeURIComponent(quoteId)}`
  const [data, setData] = useState<Analysis>()
  const [error, setError] = useState('')
  const [change, setChange] = useState('')
  const [comparison, setComparison] = useState<Comparison>()
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const plainAnswer = answer.replaceAll('**', '')
  const [asking, setAsking] = useState(false)
  const [stale, setStale] = useState(false)
  const [itemId, setItemId] = useState<string>()
  const [images, setImages] = useState<number | null>(null)
  const [videos, setVideos] = useState<number | null>(null)
  async function ask(text = question) {
    if (!data || stale || !text.trim()) return
    setAsking(true); setAnswer(''); setError('')
    try {
      const result = await apiRequest<{status: string; answer?: string; revision: string}>(`${base}/assistant/messages`, { method: 'POST', body: { question: text, revision: data.revision } })
      setAnswer(result.status === 'READY' ? result.answer ?? '' : 'Chưa kết nối được AI. Vui lòng thử lại sau.')
    } catch { setStale(true); setError('Không nhận được phản hồi hoặc báo giá đã thay đổi. Hãy tải lại và thử lại.') }
    finally { setAsking(false) }
  }
  useEffect(() => {
    const controller = new AbortController()
    setComparison(undefined); setAnswer(''); setStale(false); setData(undefined)
    apiRequest<Analysis>(`${base}/analysis`, { signal: controller.signal }).then(value => { setData(value); setError('') }).catch(() => { if (!controller.signal.aborted) setError('Không tải được báo giá. Vui lòng thử lại.') })
    return () => controller.abort()
  }, [base, reload])
  useEffect(() => {
    if (!data) return
    const controller = new AbortController()
    let pending = false
    const check = async () => {
      if (pending || controller.signal.aborted) return
      pending = true
      try {
        const latest = await apiRequest<Analysis>(`${base}/analysis`, {signal:controller.signal})
        if (latest.revision !== data.revision) {
          setStale(true); setComparison(undefined); setAnswer('')
          setError('Báo giá đã thay đổi. Vui lòng tải lại trước khi so sánh hoặc hỏi AI.')
        }
      } catch { /* Explicit requests retain their visible error/retry state. */ }
      finally { pending = false }
    }
    const timer = window.setInterval(() => void check(), 30000)
    window.addEventListener('focus', check)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('focus', check) }
  }, [base, data])
  async function compare() {
    if (!data || stale) return
    setBusy(true); setError(''); setComparison(undefined)
    try { setComparison(await apiRequest<Comparison>(`${base}/compare`, { method: 'POST', body: { revision: data.revision, options: [{ label: 'Hiện tại' }, { label: 'Phương án mới', requestedChange: change, ...(itemId && (images !== null || videos !== null) ? { change: { itemId, images, videos } } : {}) }] } })) }
    catch { setStale(true); setError('Không so sánh được hoặc báo giá đã thay đổi. Hãy tải lại báo giá.') }
    finally { setBusy(false) }
  }
  return <div className="sqa-content">
    {error && <Alert showIcon type="warning" message={error} action={<Button onClick={() => setReload(n => n + 1)}>Tải lại</Button>} />}
    {!data && !error && <div className="sqa-loading" role="status"><Spin size="small" /><span>Đang tải báo giá…</span></div>}
    {data && <>
      <div className="sqa-total">
        <div><span>Tổng báo giá hiện tại</span><strong>{formatVnd(data.total)}</strong></div>
        <span className="sqa-version">Bản {data.version}</span>
        <small>Nguồn: báo giá đã lưu · phiên bản {data.version}</small>
      </div>
      {data.warnings.map(warning => <Alert key={warning} showIcon type="warning" message={warning} />)}
      <div className="sqa-grid">
        <section className="sqa-section">
          <h3><FileTextOutlined aria-hidden /> Chi tiết chi phí</h3>
          <Table className="sqa-table" size="small" pagination={false} rowKey="id" tableLayout="fixed" dataSource={data.items} columns={[{ title: 'Hạng mục', dataIndex: 'description' }, { title: 'SL', dataIndex: 'quantity', width: 44, align: 'center' }, { title: 'Thành tiền', dataIndex: 'amount', width: '38%', align: 'right', render: (amount: number) => formatVnd(amount) }]} />
          {(Boolean(data.factors?.length) || Boolean(data.mediaOptions?.length)) && <details className="sqa-disclosure"><summary>Yếu tố ảnh hưởng đến giá <DownOutlined aria-hidden /></summary><div className="sqa-disclosure-body">{data.factors?.map(factor => <p key={factor}>{factor}</p>)}{data.mediaOptions?.map(option => <div className="sqa-media" key={option.itemId}><strong>{option.label}</strong><p>{option.images} ảnh · {option.videos} video</p><small>Đã gồm {option.includedImages} ảnh, {option.includedVideos} video trong gói</small></div>)}</div></details>}
        </section>
        <section className="sqa-section sqa-compare">
          <h3><SwapOutlined aria-hidden /> Thử thay đổi số ảnh / video</h3>
          <div className="sqa-form">
            <label htmlFor={`${fieldId}-item`}>1. Chọn nội dung muốn đổi</label>
            <Select id={`${fieldId}-item`} aria-label="Hạng mục so sánh" placeholder="Ví dụ: Chụp ảnh tổng quan" allowClear value={itemId} onChange={value => {
              setItemId(value)
              const selected = data.mediaOptions?.find(item => item.itemId === value)
              setImages(selected?.images ?? null)
              setVideos(selected?.videos ?? null)
              setComparison(undefined)
            }} options={data.mediaOptions?.map(item => ({value:item.itemId,label:item.label})) ?? data.items.filter(item => item.orderChecklistItemId).map(item => ({value:item.orderChecklistItemId, label:item.description}))} />
            {itemId && <><label>2. Nhập số lượng bạn muốn nhận</label><small>Điền số lượng cụ thể bên dưới. Nhập 0 nếu không cần.</small></>}
            {itemId && <div className="sqa-counts"><label>Số ảnh mới<InputNumber aria-label="Số ảnh mới" placeholder="Giữ nguyên" min={0} max={500} value={images} onChange={setImages} /></label><label>Số video mới<InputNumber aria-label="Số video mới" placeholder="Giữ nguyên" min={0} max={500} value={videos} onChange={setVideos} /></label><Button className="sqa-remove-video" onClick={() => setVideos(0)}>Bỏ video</Button></div>}
            <details className="sqa-extra"><summary>Yêu cầu thay đổi khác (tùy chọn)</summary><Input.TextArea id={`${fieldId}-change`} aria-label="Thay đổi phương án" placeholder="Ví dụ: thay đổi phạm vi giám sát…" maxLength={500} value={change} onChange={e => setChange(e.target.value)} rows={2} /></details>
            <Button className="sqa-compare-button" icon={<SwapOutlined aria-hidden />} block loading={busy} disabled={stale || (!change.trim() && !(itemId && (images !== null || videos !== null)))} onClick={() => void compare()}>Xem giá sau thay đổi</Button>
            <small className="sqa-note">Chỉ xem thử, không thay đổi báo giá.</small>
          </div>
          {comparison && <div className="sqa-results" aria-live="polite">{comparison.options.map((option, index) => <div className={`sqa-result${index > 0 ? ' is-proposed' : ''}`} key={option.label}><strong>{index === 0 ? 'Giá hiện tại' : 'Giá sau thay đổi'}: {option.total === null ? 'Chưa tính được' : formatVnd(option.total)}</strong><p>{option.total === null ? 'Nhân viên cần xem lại yêu cầu này để báo giá. Giá hiện tại vẫn được giữ nguyên.' : `${option.difference != null && option.difference !== 0 ? `Chênh lệch: ${formatVnd(option.difference)}. ` : ''}${option.explanation}`}</p></div>)}</div>}
        </section>
      </div>
      <details className="sqa-chat">
        <summary><span className="sqa-icon"><MessageOutlined aria-hidden /></span><span><strong>Hỏi AI về báo giá</strong><small>Giải thích chi phí theo cách dễ hiểu</small></span><DownOutlined className="sqa-chevron" aria-hidden /></summary>
        <div className="sqa-chat-body">
          <Button className="sqa-suggestion" icon={<BulbOutlined aria-hidden />} onClick={() => void ask('Vì sao báo giá có mức giá này?')} disabled={asking || stale}>Vì sao có mức giá này?</Button>
          <label htmlFor={`${fieldId}-question`}>Câu hỏi của bạn</label>
          <Input.TextArea id={`${fieldId}-question`} aria-label="Câu hỏi về báo giá" value={question} onChange={e => setQuestion(e.target.value)} maxLength={1500} rows={3} placeholder="Nhập điều bạn muốn hiểu rõ hơn…" />
          <div className="sqa-chat-actions"><small>AI tham khảo báo giá đã lưu.</small><Button type="primary" icon={<SendOutlined aria-hidden />} loading={asking} disabled={stale || asking || !question.trim()} onClick={() => void ask()}>Gửi câu hỏi</Button></div>
          {answer && <div className="sqa-answer"><span className="sqa-answer-label"><BulbOutlined aria-hidden /> Giải thích từ AI</span><p role="status">{plainAnswer}</p>{!customer && <Button type="text" size="small" icon={<CopyOutlined aria-hidden />} onClick={() => void navigator.clipboard.writeText(plainAnswer)}>Sao chép giải thích</Button>}</div>}
        </div>
      </details>
    </>}
  </div>
}
