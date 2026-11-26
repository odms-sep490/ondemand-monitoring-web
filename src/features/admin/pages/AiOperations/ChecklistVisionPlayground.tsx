import { useState } from 'react'
import { Alert, Button, Input } from 'antd'
import { aiOpsApi, type ChecklistVisionResult } from '../../api/aiOpsApi'
import type { PromptVersionView } from '../../api/promptApi'

export default function ChecklistVisionPlayground({ versions }: { versions: PromptVersionView[] }) {
  const [selection, setSelection] = useState('')
  const version = versions.find(v => v.id === selection) ?? versions[0]
  const [image, setImage] = useState<File>()
  const [criteria, setCriteria] = useState('')
  const [language, setLanguage] = useState('vi')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ChecklistVisionResult>()
  const instructions = criteria.split('\n').map(line => line.trim()).filter(Boolean)

  async function run() {
    if (!version || !image || !instructions.length || busy) return
    setBusy(true)
    setResult(undefined)
    setError('')
    try {
      if (image.size > 2 * 1024 * 1024 || image.type !== 'image/jpeg') throw new Error('Chọn ảnh JPEG tối đa 2 MiB.')
      if (instructions.length > 16 || instructions.some(line => line.length > 300)) {
        throw new Error('Nhập tối đa 16 tiêu chí, mỗi tiêu chí tối đa 300 ký tự.')
      }
      const signature = new Uint8Array(await image.slice(0, 3).arrayBuffer())
      if (signature[0] !== 255 || signature[1] !== 216 || signature[2] !== 255) {
        throw new Error('Vui lòng chọn ảnh JPEG.')
      }
      setResult(await aiOpsApi.runChecklistVision(image, version.id, instructions, language))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể kiểm tra ảnh.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="aiops-stack">
    <Alert type="info" showIcon message="Mô hình vận hành checklist-image-vision"
      description="Bật AI đánh giá ảnh tại dòng mô hình trong Danh mục mô hình. Chạy thử dùng phiên bản prompt đã chọn. Xem lịch sử và thời gian xử lý trong mục Truy vết AI." />
    <fieldset disabled={busy} className="aiops-stack" onChange={() => { setResult(undefined); setError('') }}>
      <label>Phiên bản prompt <select value={version?.id ?? ''} onChange={e => setSelection(e.target.value)}>
        {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNumber} · {v.status}</option>)}
      </select></label>
      <label>Ảnh JPEG <input type="file" accept="image/jpeg,.jpg,.jpeg" onChange={e => setImage(e.target.files?.[0])} /></label>
      <label>Tiêu chí kiểm ảnh (mỗi dòng một hướng dẫn)
        <Input.TextArea rows={3} value={criteria} onChange={e => setCriteria(e.target.value)} />
      </label>
      <label>Ngôn ngữ <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="vi">Tiếng Việt</option><option value="en">English</option>
      </select></label>
      <Button type="primary" loading={busy} disabled={!version || !image || !instructions.length} onClick={run}>Chạy thử ảnh</Button>
    </fieldset>
    {error && <Alert type="error" role="alert" message={error} />}
    {result && <div aria-live="polite">

      {result.findings.length ? <ul>{result.findings.map((finding, index) =>
        <li key={index}><strong>{finding.code}</strong> · {finding.verdict}<p>{finding.observation}</p></li>
      )}</ul> : <p>Không có kết quả đánh giá.</p>}
    </div>}
  </div>
}
