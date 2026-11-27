import { useEffect, useId, useState } from 'react'
import { Alert, Button, Empty, Input, Select, Space, Tag, Upload } from 'antd'
import { FileImageOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { aiOpsApi, type ChecklistVisionResult } from '../../api/aiOpsApi'
import type { PromptVersionView } from '../../api/promptApi'
import { VERSION_LABEL } from './promptPresentation'
import { ApiError } from '../../../../shared/api/httpClient'
import './checklistVisionPlayground.css'

const verdictLabels: Record<string, { label: string; color: string }> = {
  MATCH: { label: 'Phù hợp', color: 'green' },
  MISMATCH: { label: 'Không phù hợp', color: 'red' },
  UNCERTAIN: { label: 'Cần kiểm tra', color: 'gold' },
}

export default function ChecklistVisionPlayground({
  versions,
}: {
  versions: PromptVersionView[]
}) {
  const id = useId()
  const [selection, setSelection] = useState('')
  const version = versions.find((v) => v.id === selection) ?? versions[0]
  const [image, setImage] = useState<File>()
  const [preview, setPreview] = useState('')
  const [criteria, setCriteria] = useState('')
  const [language, setLanguage] = useState('vi')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ChecklistVisionResult>()
  const instructions = criteria
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  useEffect(() => {
    if (!image || typeof URL.createObjectURL !== 'function') {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function resetResult() {
    setResult(undefined)
    setError('')
  }
  function chooseImage(file: File) {
    resetResult()
    if (file.size > 2 * 1024 * 1024 || file.type !== 'image/jpeg') {
      setImage(undefined)
      setError('Chọn ảnh JPEG tối đa 2 MiB.')
    } else setImage(file)
    return false
  }

  async function run() {
    if (!version || !image || !instructions.length || busy) return
    setBusy(true)
    resetResult()
    try {
      if (image.size > 2 * 1024 * 1024 || image.type !== 'image/jpeg')
        throw new Error('Chọn ảnh JPEG tối đa 2 MiB.')
      if (
        instructions.length > 16 ||
        instructions.some((line) => line.length > 300)
      ) {
        throw new Error(
          'Nhập tối đa 16 tiêu chí, mỗi tiêu chí tối đa 300 ký tự.',
        )
      }
      const signature = new Uint8Array(await image.slice(0, 3).arrayBuffer())
      if (signature[0] !== 255 || signature[1] !== 216 || signature[2] !== 255)
        throw new Error('Vui lòng chọn ảnh JPEG.')
      setResult(
        await aiOpsApi.runChecklistVision(
          image,
          version.id,
          instructions,
          language,
        ),
      )
    } catch (e) {
      if (e instanceof ApiError) {
        const messages: Record<string, string> = {
          AI_PROVIDER_UNAVAILABLE:
            'Dịch vụ AI chưa thể xử lý ảnh. Vui lòng kiểm tra trạng thái Ollama và thử lại.',
          AI_RESPONSE_INVALID:
            'AI trả về kết quả không hợp lệ. Vui lòng thử lại.',
          CHECKLIST_IMAGE_ASSESSMENT_DISABLED:
            'AI đánh giá ảnh đang tắt. Vui lòng bật trong Danh mục mô hình AI.',
          INVALID_REQUEST:
            'Ảnh hoặc tiêu chí chưa hợp lệ. Kiểm tra lại dữ liệu và thử lại.',
        }
        setError(
          messages[e.code ?? ''] ?? 'Không thể kiểm tra ảnh. Vui lòng thử lại.',
        )
      } else
        setError(e instanceof Error ? e.message : 'Không thể kiểm tra ảnh.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="aiops-stack" aria-busy={busy}>
      <Alert
        type="info"
        showIcon
        message="Chạy thử ảnh với phiên bản prompt đã chọn. Kết quả thử nghiệm không thay đổi kết quả nghiệm thu."
      />
      <div className="aiops-vision-controls">
        <div className="aiops-vision-control">
          <label htmlFor={`${id}-version`}>Phiên bản prompt</label>
          <Select
            id={`${id}-version`}
            value={version?.id}
            disabled={busy || !versions.length}
            placeholder="Chưa có phiên bản"
            onChange={(value) => {
              setSelection(value)
              resetResult()
            }}
            options={versions.map((v) => ({
              value: v.id,
              label: `v${v.versionNumber} · ${VERSION_LABEL[v.status] ?? v.status}`,
            }))}
          />
        </div>
        <div className="aiops-vision-control">
          <label htmlFor={`${id}-language`}>Ngôn ngữ kết quả</label>
          <Select
            id={`${id}-language`}
            value={language}
            disabled={busy}
            onChange={(value) => {
              setLanguage(value)
              resetResult()
            }}
            options={[
              { value: 'vi', label: 'Tiếng Việt' },
              { value: 'en', label: 'Tiếng Anh' },
            ]}
          />
        </div>
        <Button
          type="primary"
          icon={<PlayCircleOutlined aria-hidden="true" />}
          loading={busy}
          disabled={!version || !image || !instructions.length}
          onClick={() => void run()}
        >
          Chạy thử ảnh
        </Button>
      </div>
      <div className="aiops-vision-inputs">
        <section className="aiops-panel aiops-vision-input-panel">
          <label htmlFor={`${id}-image`}>Ảnh JPEG</label>
          <Upload.Dragger
            id={`${id}-image`}
            accept="image/jpeg,.jpg,.jpeg"
            multiple={false}
            maxCount={1}
            disabled={busy}
            showUploadList={false}
            beforeUpload={chooseImage}
          >
            {preview ? (
              <img
                className="aiops-vision-preview"
                src={preview}
                alt="Ảnh đã chọn để thử nghiệm"
              />
            ) : (
              <FileImageOutlined className="aiops-vision-upload-icon" />
            )}
            <p className="aiops-vision-upload-title">
              {image ? image.name : 'Chọn hoặc kéo ảnh vào đây'}
            </p>
            <p className="aiops-vision-hint">
              {image
                ? `${Math.ceil(image.size / 1024)} KB · Chọn để thay ảnh`
                : 'Định dạng JPEG · Tối đa 2 MiB'}
            </p>
          </Upload.Dragger>
          {image && (
            <Button
              size="small"
              type="text"
              disabled={busy}
              onClick={() => {
                setImage(undefined)
                resetResult()
              }}
            >
              Bỏ ảnh
            </Button>
          )}
        </section>
        <section className="aiops-panel aiops-vision-input-panel">
          <label htmlFor={`${id}-criteria`}>Tiêu chí kiểm ảnh</label>
          <Input.TextArea
            id={`${id}-criteria`}
            rows={7}
            value={criteria}
            disabled={busy}
            placeholder={
              'Mỗi dòng một tiêu chí có thể quan sát trong ảnh.\nVí dụ: Ảnh thể hiện rõ toàn bộ mặt ngoài công trình.'
            }
            onChange={(e) => {
              setCriteria(e.target.value)
              resetResult()
            }}
          />
          <small className="aiops-vision-hint">
            {instructions.length}/16 tiêu chí · Mỗi tiêu chí tối đa 300 ký tự.
          </small>
        </section>
      </div>
      {error && <Alert type="error" showIcon role="alert" message={error} />}
      {result && (
        <section
          className="aiops-panel aiops-vision-results"
          aria-live="polite"
        >
          <Space wrap>
            <strong>Kết quả thử nghiệm</strong>
            <Tag>{result.findings.length} tiêu chí</Tag>
          </Space>
          {result.findings.length ? (
            <div className="aiops-table-wrap">
              <table className="aiops-table">
                <thead>
                  <tr>
                    <th>Tiêu chí</th>
                    <th>Đánh giá</th>
                    <th>Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {result.findings.map((finding, index) => {
                    const verdict = verdictLabels[finding.verdict] ?? {
                      label: finding.verdict,
                      color: 'default',
                    }
                    return (
                      <tr key={finding.code}>
                        <td>
                          <strong>Tiêu chí {index + 1}</strong>
                          <div>{instructions[index]}</div>
                        </td>
                        <td>
                          <Tag color={verdict.color}>{verdict.label}</Tag>
                        </td>
                        <td>{finding.observation}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty description="Không có kết quả đánh giá." />
          )}
        </section>
      )}
    </div>
  )
}
