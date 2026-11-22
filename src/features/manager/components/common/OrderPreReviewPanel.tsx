import { useState } from 'react'
import './OrderPreReviewPanel.css'
import { Alert, Button, Space, Tag } from 'antd'
import type { OrderReadiness } from '../../types/readiness'

type Props = {
  result: OrderReadiness | null | undefined
  loading: boolean
  error?: unknown
  onRefresh: () => void
}

const labels = { PASS: 'Đạt', WARN: 'Lưu ý', FAIL: 'Cần xử lý', PENDING: 'Chưa xác minh' }
const colors = { PASS: 'green', WARN: 'gold', FAIL: 'red', PENDING: 'default' }

export function OrderPreReviewPanel({ result, loading, error, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false)
  const criteria = result?.criteria ?? []
  const priority = [...criteria].sort((a, b) => {
    const rank = { FAIL: 0, WARN: 1, PENDING: 2, PASS: 3 }
    return rank[a.result] - rank[b.result]
  })
  const counts = {
    pass: criteria.filter(item => item.result === 'PASS').length,
    attention: criteria.filter(item => item.result === 'FAIL' || item.result === 'WARN').length,
    pending: criteria.filter(item => item.result === 'PENDING').length,
  }

  return <section aria-label="Hỗ trợ kiểm duyệt" className="order-pre-review">
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <h3 style={{ margin: 0 }}>Hỗ trợ kiểm duyệt</h3>
      <Button loading={loading} onClick={onRefresh}>Kiểm tra lại</Button>
    </Space>
    {Boolean(error) && <Alert type="error" message="Không tải được kết quả kiểm tra. Hãy thử lại." style={{ marginTop: 12 }} />}
    {result && <>
      <Space wrap style={{ marginTop: 12 }}>
        <Tag color="green">Đạt {counts.pass}</Tag>
        <Tag color="gold">Cần xem lại {counts.attention}</Tag>
        <Tag>Chưa xác minh {counts.pending}</Tag>
      </Space>
      <p>{counts.attention ? 'Có thông tin cần xem lại trước khi tiếp tục xử lý.' : counts.pending ? 'Cần hoàn tất các mục chưa xác minh.' : 'Các điều kiện đã kiểm tra đều đạt.'}</p>
      <ul className="order-pre-review__list">
        {(expanded ? priority : priority.filter(item => item.result !== 'PASS').slice(0, 5)).map(item =>
          <li key={item.code} className="order-pre-review__item">
            <Space wrap><strong>{item.title}</strong><Tag color={colors[item.result]}>{labels[item.result]}</Tag></Space>
            {(item.reason || item.note) && <p className="order-pre-review__reason">{item.reason || item.note}</p>}
            {expanded && item.description && item.description !== item.reason && <details><summary>Chi tiết kiểm tra</summary><p>{item.description}</p></details>}
          </li>)}
      </ul>
      <Button type="link" onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn' : 'Xem tất cả điều kiện'}</Button>
      <details style={{ marginTop: 8 }}>
        <summary>Nguồn kết quả</summary>
        <p>Kiểm tra từ quy tắc nghiệp vụ và xác nhận của người duyệt trong hệ thống.</p>
        <p>Tóm tắt AI và đối chiếu tài liệu chưa khả dụng.</p>
      </details>
    </>}
    {!result && !loading && !error && <p>Chưa có kết quả kiểm tra.</p>}
  </section>
}
