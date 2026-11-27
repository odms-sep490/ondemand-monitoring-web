import { VERSION_COLOR, VERSION_LABEL } from './promptPresentation'
import { isChecklistVisionPrompt, PromptRuntimeModelDisplay } from './PromptRuntimeModelDisplay'
import ChecklistVisionPlayground from './ChecklistVisionPlayground'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Input, Modal, Select, Space, Spin, Tag } from 'antd'
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  promptApi,
  type ActivationHistoryView,
  type PreviewResult,
  type PromptSummaryView,
  type PromptVersionView,
  type TestRunView,
} from '../../api/promptApi'

type SubTab = 'editor' | 'versions' | 'playground' | 'history'

const PROMPT_TYPE_LABEL: Record<string, string> = {
  SYSTEM: 'Hệ thống',
  USER_TEMPLATE: 'Mẫu người dùng',
  JUDGE: 'Đánh giá',
  EXPLANATION: 'Giải thích',
  SUMMARIZATION: 'Tóm tắt',
}

const FEATURE_OPTIONS = [
  { value: 'REPORT_STUDIO', label: 'Báo cáo kiểm tra AI' },
  { value: 'ORDER_CONSULTANT', label: 'Tư vấn đặt đơn' },
  { value: 'DESCRIPTION_AI', label: 'Gợi ý mô tả đơn' },
  { value: 'AI_SUPERVISOR', label: 'AI Supervisor' },
  { value: 'MISSION_PLANNING', label: 'Lập kế hoạch bay' },
  { value: 'CHECKLIST_VISION', label: 'Kiểm ảnh Checklist' },
]

const PROMPT_TYPE_OPTIONS = [
  { value: 'SYSTEM', label: 'Hệ thống (SYSTEM)' },
  { value: 'USER_TEMPLATE', label: 'Mẫu người dùng (USER_TEMPLATE)' },
  { value: 'JUDGE', label: 'Đánh giá (JUDGE)' },
  { value: 'EXPLANATION', label: 'Giải thích (EXPLANATION)' },
  { value: 'SUMMARIZATION', label: 'Tóm tắt (SUMMARIZATION)' },
]

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN', { hour12: false })
}

function computeLineDiff(before: string, after: string) {
  const aLines = before.split('\n')
  const bLines = after.split('\n')
  const aSet = new Set(aLines)
  const bSet = new Set(bLines)
  const out: Array<{ kind: 'same' | 'removed' | 'added'; text: string }> = []
  for (const line of aLines) {
    if (!bSet.has(line)) out.push({ kind: 'removed', text: line })
  }
  for (const line of bLines) {
    out.push({ kind: aSet.has(line) ? 'same' : 'added', text: line })
  }
  return out
}

export function PromptManagementWorkspace() {
  const [prompts, setPrompts] = useState<PromptSummaryView[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [versions, setVersions] = useState<PromptVersionView[]>([])
  const [history, setHistory] = useState<ActivationHistoryView[]>([])
  const [testRuns, setTestRuns] = useState<TestRunView[]>([])
  const [subTab, setSubTab] = useState<SubTab>('editor')
  const [search, setSearch] = useState('')
  const [featureFilter, setFeatureFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Editor state
  const [editorContent, setEditorContent] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [diffCompareId, setDiffCompareId] = useState('')
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)

  // Playground state
  const [pgVersionId, setPgVersionId] = useState('')
  const [pgUserInput, setPgUserInput] = useState('')
  const [pgVariablesJson, setPgVariablesJson] = useState('{}')
  const [pgResult, setPgResult] = useState<TestRunView | null>(null)

  // CRUD modals state
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    promptKey: '',
    displayName: '',
    description: '',
    feature: 'REPORT_STUDIO',
    promptType: 'SYSTEM',
    modelBinding: 'odm-order-qwen:3b',
    languages: 'vi',
    templateContent: '',
  })
  const [editMetaOpen, setEditMetaOpen] = useState(false)
  const [editMetaForm, setEditMetaForm] = useState({
    displayName: '',
    description: '',
    feature: 'REPORT_STUDIO',
    promptType: 'SYSTEM',
    modelBinding: 'odm-order-qwen:3b',
    languages: 'vi',
    enabled: true,
  })

  const loadPrompts = async () => {
    setLoading(true)
    setError('')
    try {
      const list = await promptApi.listPrompts(featureFilter, search)
      setPrompts(list)
      if (list.length > 0 && !list.some((p) => p.promptKey === selectedKey)) {
        setSelectedKey(list[0].promptKey)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải danh sách Prompt.')
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedDetails = async (key: string) => {
    if (!key) return
    try {
      const [vers, hist, runs] = await Promise.all([
        promptApi.listVersions(key),
        promptApi.activationHistory(key),
        promptApi.testRuns(key),
      ])
      setVersions(vers)
      setHistory(hist)
      setTestRuns(runs)
      const active = vers.find((v) => v.status === 'ACTIVE') ?? vers[0]
      if (active) {
        setSelectedVersionId(active.id)
        setEditorContent(active.templateContent)
        setPgVersionId(vers[0]?.id ?? active.id)
        setDiffCompareId(vers.find((v) => v.id !== active.id)?.id ?? active.id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải phiên bản prompt.')
    }
  }

  useEffect(() => {
    void loadPrompts()
  }, [featureFilter])

  useEffect(() => {
    if (selectedKey) void loadSelectedDetails(selectedKey)
  }, [selectedKey])

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.promptKey === selectedKey) ?? null,
    [prompts, selectedKey],
  )
  const activeVersion = useMemo(
    () => versions.find((v) => v.status === 'ACTIVE') ?? null,
    [versions],
  )
  const estimatedTokens = useMemo(
    () => Math.max(0, Math.ceil(editorContent.length / 3.5)),
    [editorContent],
  )

  const handleCreatePrompt = async () => {
    if (!createForm.promptKey.trim() || !createForm.displayName.trim() || !createForm.templateContent.trim()) {
      setError('Vui lòng nhập đầy đủ Mã Prompt, Tên hiển thị và Nội dung prompt.')
      return
    }
    setBusy('create-prompt')
    setError('')
    setNotice('')
    try {
      const created = await promptApi.createPrompt({
        promptKey: createForm.promptKey.trim(),
        displayName: createForm.displayName.trim(),
        description: createForm.description.trim(),
        feature: createForm.feature,
        promptType: createForm.promptType,
        modelBinding: createForm.modelBinding.trim(),
        languages: createForm.languages.trim() || 'vi',
        templateContent: createForm.templateContent,
      })
      setCreateOpen(false)
      setCreateForm({
        promptKey: '',
        displayName: '',
        description: '',
        feature: 'REPORT_STUDIO',
        promptType: 'SYSTEM',
        modelBinding: 'odm-order-qwen:3b',
        languages: 'vi',
        templateContent: '',
      })
      setSelectedKey(created.promptKey)
      setNotice(`Đã tạo prompt mới "${created.promptKey}" (v1 · Đang dùng).`)
      await loadPrompts()
      await loadSelectedDetails(created.promptKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tạo prompt mới.')
    } finally {
      setBusy('')
    }
  }

  const handleOpenEditMeta = () => {
    if (!selectedPrompt) return
    setEditMetaForm({
      displayName: selectedPrompt.displayName,
      description: selectedPrompt.description,
      feature: selectedPrompt.feature,
      promptType: selectedPrompt.promptType,
      modelBinding: selectedPrompt.modelBinding,
      languages: selectedPrompt.languages,
      enabled: selectedPrompt.enabled,
    })
    setEditMetaOpen(true)
  }

  const handleUpdatePromptMeta = async () => {
    if (!selectedKey || !editMetaForm.displayName.trim()) return
    setBusy('update-meta')
    setError('')
    setNotice('')
    try {
      await promptApi.updatePrompt(selectedKey, editMetaForm)
      setEditMetaOpen(false)
      setNotice(`Đã cập nhật thông tin prompt "${selectedKey}".`)
      await loadPrompts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật thông tin prompt.')
    } finally {
      setBusy('')
    }
  }

  const handleDeletePrompt = () => {
    if (!selectedKey) return
    Modal.confirm({
      title: `Xóa prompt "${selectedKey}"?`,
      content: 'Thao tác sẽ xóa prompt cùng toàn bộ lịch sử phiên bản và các lượt chạy thử của nó. Không thể hoàn tác.',
      okText: 'Xóa prompt',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        setBusy('delete-prompt')
        setError('')
        try {
          await promptApi.deletePrompt(selectedKey)
          setNotice(`Đã xóa prompt "${selectedKey}".`)
          setSelectedKey('')
          setVersions([])
          await loadPrompts()
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Không thể xóa prompt.')
        } finally {
          setBusy('')
        }
      },
    })
  }

  const handleDeleteVersion = (v: PromptVersionView) => {
    Modal.confirm({
      title: `Xóa phiên bản v${v.versionNumber}?`,
      content: 'Phiên bản này sẽ bị xóa khỏi lịch sử.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        setBusy(`del-ver:${v.id}`)
        setError('')
        try {
          await promptApi.deleteVersion(selectedKey, v.id)
          setNotice(`Đã xóa phiên bản v${v.versionNumber}.`)
          await loadPrompts()
          await loadSelectedDetails(selectedKey)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Không thể xóa phiên bản.')
        } finally {
          setBusy('')
        }
      },
    })
  }

  const handleSaveDraft = async () => {
    if (!selectedKey || !editorContent.trim()) return
    setBusy('save-draft')
    setError('')
    setNotice('')
    try {
      const created = await promptApi.createDraft(selectedKey, {
        templateContent: editorContent,
        changeSummary: changeSummary.trim() || undefined,
        parentVersionId: selectedVersionId || undefined,
      })
      setChangeSummary('')
      setNotice(`Đã lưu bản nháp v${created.versionNumber} (chưa áp dụng vận hành).`)
      await loadPrompts()
      await loadSelectedDetails(selectedKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu bản nháp.')
    } finally {
      setBusy('')
    }
  }

  const handlePreview = async () => {
    if (!selectedKey || !selectedVersionId) return
    setBusy('preview')
    setError('')
    try {
      const vars = JSON.parse(pgVariablesJson || '{}') as Record<string, unknown>
      const res = await promptApi.previewVersion(selectedKey, selectedVersionId, vars)
      setPreviewResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi xem trước biến hoặc JSON biến không hợp lệ.')
    } finally {
      setBusy('')
    }
  }

  const handleRunPlayground = async () => {
    if (!selectedKey || !pgVersionId) return
    setBusy('playground')
    setError('')
    setNotice('')
    try {
      const vars = JSON.parse(pgVariablesJson || '{}') as Record<string, unknown>
      const res = await promptApi.testVersion(selectedKey, pgVersionId, {
        variables: vars,
        userInput: pgUserInput,
      })
      setPgResult(res)
      await loadSelectedDetails(selectedKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể chạy thử trong phòng thử nghiệm.')
    } finally {
      setBusy('')
    }
  }

  const handleApprove = async (v: PromptVersionView) => {
    setBusy(`approve:${v.id}`)
    setError('')
    try {
      await promptApi.approveVersion(selectedKey, v.id)
      setNotice(`Đã phê duyệt phiên bản v${v.versionNumber}.`)
      await loadSelectedDetails(selectedKey)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể phê duyệt.')
    } finally {
      setBusy('')
    }
  }

  const handleActivateOrRollback = (v: PromptVersionView, isRollback: boolean) => {
    Modal.confirm({
      title: isRollback
        ? `Khôi phục ${selectedKey} về v${v.versionNumber}?`
        : `Kích hoạt ${selectedKey} phiên bản v${v.versionNumber}?`,
      content:
        'Thay đổi sẽ làm mới bộ đệm ngay lập tức (áp dụng tức thì) cho cả dịch vụ Java và Python mà không cần khởi động lại.',
      okText: isRollback ? 'Xác nhận khôi phục' : 'Kích hoạt ngay',
      cancelText: 'Hủy',
      onOk: async () => {
        setBusy(`act:${v.id}`)
        setError('')
        try {
          if (isRollback) {
            await promptApi.rollbackVersion(selectedKey, v.id, `Quản trị viên khôi phục về v${v.versionNumber}`)
          } else {
            await promptApi.activateVersion(selectedKey, v.id, `Quản trị viên kích hoạt v${v.versionNumber}`)
          }
          setNotice(
            `${isRollback ? 'Đã khôi phục' : 'Đã kích hoạt'} ${selectedKey} → v${v.versionNumber} (áp dụng tức thì thành công).`,
          )
          await loadPrompts()
          await loadSelectedDetails(selectedKey)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Không thể kích hoạt phiên bản.')
        } finally {
          setBusy('')
        }
      },
    })
  }

  const diffTarget = versions.find((v) => v.id === diffCompareId)
  const diffLines = useMemo(() => {
    if (!activeVersion || !diffTarget) return []
    return computeLineDiff(activeVersion.templateContent, diffTarget.templateContent)
  }, [activeVersion, diffTarget])

  return (
    <section className="aiops-panel aiops-prompt-workspace">
      <div className="aiops-panel-head">
        <div>
          <h2>Quản lý Prompt động &amp; Phòng thử nghiệm</h2>
          <small>
            Quản lý, chỉnh sửa, kiểm thử cô lập, áp dụng tức thì và khôi phục toàn bộ prompt AI mà không cần sửa mã nguồn hay khởi động lại dịch vụ.
          </small>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Tạo Prompt mới
          </Button>
          <Input
            placeholder="Tìm mã prompt, tên hiển thị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => void loadPrompts()}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            value={featureFilter}
            onChange={setFeatureFilter}
            style={{ width: 195 }}
            options={[
              { value: 'ALL', label: 'Tất cả tính năng' },
              ...FEATURE_OPTIONS,
            ]}
          />
        </Space>
      </div>

      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} style={{ marginBottom: 12 }} />}
      {notice && <Alert type="success" showIcon message={notice} closable onClose={() => setNotice('')} style={{ marginBottom: 12 }} />}

      {loading && prompts.length === 0 ? (
        <div className="aiops-loading"><Spin /></div>
      ) : (
        <div className="aiops-prompt-layout">
          {/* Trái: Danh sách Prompt */}
          <div className="aiops-prompt-list">
            {prompts.map((p) => (
              <button
                key={p.promptKey}
                type="button"
                className={`aiops-prompt-item${p.promptKey === selectedKey ? ' is-selected' : ''}`}
                onClick={() => setSelectedKey(p.promptKey)}
              >
                <div className="aiops-prompt-item-top">
                  <strong>{p.displayName}</strong>
                  <Tag color="green">v{p.activeVersionNumber ?? 1} · Đang dùng</Tag>
                </div>
                <code className="aiops-prompt-key" title={p.promptKey}>{p.promptKey}</code>
                <small className="aiops-prompt-meta">
                  <PromptRuntimeModelDisplay prompt={p} /> · {p.totalVersions} phiên bản
                  {p.avgLatencyMs ? ` · ${Math.round(p.avgLatencyMs)}ms` : ''}
                </small>
              </button>
            ))}
          </div>

          {/* Phải: Trình soạn thảo / Phiên bản / Thử nghiệm / Lịch sử */}
          {selectedPrompt ? (
            <div className="aiops-prompt-detail">
              <div className="aiops-prompt-detail-head">
                <div className="aiops-prompt-title-row">
                  <div className="aiops-prompt-title-group">
                    <h3>{selectedPrompt.displayName}</h3>
                    <Tag color="blue">{PROMPT_TYPE_LABEL[selectedPrompt.promptType] ?? selectedPrompt.promptType}</Tag>
                    <Tag><PromptRuntimeModelDisplay prompt={selectedPrompt} /></Tag>
                  </div>
                  {selectedPrompt.description && (
                    <p className="aiops-prompt-desc">{selectedPrompt.description}</p>
                  )}
                </div>

                <div className="aiops-prompt-toolbar">
                  <div className="aiops-prompt-subtabs" role="tablist" aria-label="Chế độ quản lý Prompt">
                    <Button
                      size="small"
                      type={subTab === 'editor' ? 'primary' : 'text'}
                      onClick={() => setSubTab('editor')}
                    >
                      Trình soạn thảo
                    </Button>
                    <Button
                      size="small"
                      type={subTab === 'versions' ? 'primary' : 'text'}
                      onClick={() => setSubTab('versions')}
                    >
                      Phiên bản &amp; So sánh ({versions.length})
                    </Button>
                    <Button
                      size="small"
                      type={subTab === 'playground' ? 'primary' : 'text'}
                      icon={<PlayCircleOutlined />}
                      onClick={() => setSubTab('playground')}
                    >
                      Thử nghiệm
                    </Button>
                    <Button
                      size="small"
                      type={subTab === 'history' ? 'primary' : 'text'}
                      icon={<HistoryOutlined />}
                      onClick={() => setSubTab('history')}
                    >
                      Lịch sử kích hoạt
                    </Button>
                  </div>

                  <Space size={8}>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={handleOpenEditMeta}
                    >
                      Sửa thông tin
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={busy === 'delete-prompt'}
                      onClick={handleDeletePrompt}
                    >
                      Xóa
                    </Button>
                  </Space>
                </div>
              </div>

              {subTab === 'editor' && (
                <div className="aiops-stack">
                  {selectedPrompt.variableSchema.length > 0 && (
                    <div className="aiops-prompt-vars">
                      <small>Biến hỗ trợ (bấm để chèn):</small>
                      <Space wrap size={6}>
                        {selectedPrompt.variableSchema.map((v) => (
                          <Tag
                            key={v.name}
                            color={v.required ? 'red' : 'blue'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setEditorContent((c) => `${c} {{${v.name}}}`)}
                          >
                            {`{{${v.name}}}`} {v.required ? '(bắt buộc)' : '(tùy chọn)'}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}

                  <Input.TextArea
                    rows={12}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    spellCheck={false}
                    className="aiops-prompt-editor"
                  />

                  <div className="aiops-prompt-footer">
                    <small className="aiops-prompt-counter">
                      {editorContent.length} ký tự · Ước tính ~{estimatedTokens} token
                    </small>
                    <Space wrap size={8}>
                      <Input
                        placeholder="Mô tả thay đổi..."
                        value={changeSummary}
                        onChange={(e) => setChangeSummary(e.target.value)}
                        style={{ width: 240 }}
                      />
                      <Button
                        icon={<EyeOutlined />}
                        loading={busy === 'preview'}
                        onClick={() => void handlePreview()}
                      >
                        Xem trước
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={busy === 'save-draft'}
                        onClick={() => void handleSaveDraft()}
                      >
                        Lưu bản nháp mới
                      </Button>
                    </Space>
                  </div>

                  {previewResult && (
                    <Alert
                      type={previewResult.validation.valid ? 'info' : 'error'}
                      message={`Xem trước kết quả (${previewResult.validation.characterCount} ký tự · ~${previewResult.validation.estimatedTokens} token ước tính)`}
                      description={
                        <pre className="aiops-prompt-pre">
                          {previewResult.renderedPrompt}
                        </pre>
                      }
                    />
                  )}
                </div>
              )}

              {subTab === 'versions' && (
                <div className="aiops-stack">
                  <div className="aiops-table-wrap">
                    <table className="aiops-table">
                      <thead>
                        <tr>
                          <th>Phiên bản</th>
                          <th>Trạng thái</th>
                          <th>Mô tả thay đổi</th>
                          <th>Người tạo / Thời gian</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {versions.map((v) => (
                          <tr key={v.id}>
                            <td><strong>v{v.versionNumber}</strong></td>
                            <td>
                              <Tag color={VERSION_COLOR[v.status] ?? 'default'}>
                                {VERSION_LABEL[v.status] ?? v.status}
                              </Tag>
                            </td>
                            <td>{v.changeSummary || '—'}</td>
                            <td>
                              <div>{v.createdBy}</div>
                              <div className="aiops-cell-sub">{formatDate(v.createdAt)}</div>
                            </td>
                            <td>
                              <Space size={6} wrap>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setSelectedVersionId(v.id)
                                    setEditorContent(v.templateContent)
                                    setSubTab('editor')
                                  }}
                                >
                                  Mở trình soạn thảo
                                </Button>
                                {(v.status === 'DRAFT' || v.status === 'TESTED') && (
                                  <Button
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={busy === `approve:${v.id}`}
                                    onClick={() => void handleApprove(v)}
                                  >
                                    Phê duyệt
                                  </Button>
                                )}
                                {v.status !== 'ACTIVE' && (v.status === 'APPROVED' || v.status === 'TESTED') && (
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<ThunderboltOutlined />}
                                    loading={busy === `act:${v.id}`}
                                    onClick={() => handleActivateOrRollback(v, false)}
                                  >
                                    Kích hoạt
                                  </Button>
                                )}
                                {v.status === 'ARCHIVED' && (
                                  <Button
                                    size="small"
                                    icon={<RollbackOutlined />}
                                    loading={busy === `act:${v.id}`}
                                    onClick={() => handleActivateOrRollback(v, true)}
                                  >
                                    Khôi phục
                                  </Button>
                                )}
                                {v.status !== 'ACTIVE' && (
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={busy === `del-ver:${v.id}`}
                                    onClick={() => handleDeleteVersion(v)}
                                  >
                                    Xóa
                                  </Button>
                                )}
                              </Space>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {versions.length > 1 && activeVersion && (
                    <div className="aiops-panel" style={{ padding: 14 }}>
                      <div className="aiops-panel-head">
                        <strong>So sánh thay đổi với bản đang dùng (v{activeVersion.versionNumber})</strong>
                        <Select
                          size="small"
                          value={diffCompareId}
                          onChange={setDiffCompareId}
                          style={{ width: 200 }}
                          options={versions.map((v) => ({
                            value: v.id,
                            label: `v${v.versionNumber} (${VERSION_LABEL[v.status] ?? v.status})`,
                          }))}
                        />
                      </div>
                      <pre className="aiops-prompt-diff">
                        {diffLines.map((l, idx) => (
                          <div
                            key={idx}
                            className={`aiops-diff-line is-${l.kind}`}
                          >
                            {l.kind === 'added' ? '+ ' : l.kind === 'removed' ? '- ' : '  '}
                            {l.text}
                          </div>
                        ))}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {subTab === 'playground' && selectedKey === 'checklist.image-vision.system' && (
                <ChecklistVisionPlayground key={selectedKey} versions={versions.filter(v => v.promptKey === selectedKey)} />
              )}
              {subTab === 'playground' && selectedKey !== 'checklist.image-vision.system' && (
                <div className="aiops-stack">
                  <Alert
                    type="info"
                    showIcon
                    message="Chế độ thử nghiệm cô lập: chạy mô hình thật qua Ollama nhưng không tạo đơn, không sửa nhiệm vụ và không ảnh hưởng tới prompt đang vận hành."
                  />
                  <Space wrap>
                    <Select
                      value={pgVersionId}
                      onChange={setPgVersionId}
                      style={{ width: 230 }}
                      options={versions.map((v) => ({
                        value: v.id,
                        label: `v${v.versionNumber} · ${VERSION_LABEL[v.status] ?? v.status}`,
                      }))}
                    />
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      loading={busy === 'playground'}
                      onClick={() => void handleRunPlayground()}
                    >
                      Chạy thử ngay
                    </Button>
                  </Space>
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập câu hỏi hoặc dữ liệu đầu vào để kiểm thử mô hình..."
                    value={pgUserInput}
                    onChange={(e) => setPgUserInput(e.target.value)}
                  />
                  <Input.TextArea
                    rows={2}
                    placeholder='Biến JSON (ví dụ: {"rewrite_instruction": "Rút gọn"})'
                    value={pgVariablesJson}
                    onChange={(e) => setPgVariablesJson(e.target.value)}
                    className="aiops-prompt-editor aiops-prompt-editor--compact"
                  />
                  {pgResult && (
                    <div className="aiops-panel" style={{ padding: 14 }}>
                      <Space wrap style={{ marginBottom: 8 }}>
                        <Tag color={pgResult.validationStatus === 'PASSED' ? 'green' : 'red'}>
                          {pgResult.validationStatus === 'PASSED' ? 'Đạt' : 'Không đạt'}
                        </Tag>
                        <Tag color="blue">{pgResult.latencyMs} ms</Tag>
                        {pgResult.inputTokens != null && (
                          <Tag>Đầu vào: {pgResult.inputTokens} · Đầu ra: {pgResult.outputTokens ?? 0} token</Tag>
                        )}
                      </Space>
                      <pre className="aiops-prompt-pre">
                        {pgResult.modelOutput}
                      </pre>
                    </div>
                  )}
                  {testRuns.length > 0 && (
                    <small className="aiops-prompt-counter">Lịch sử chạy thử gần đây: {testRuns.length} lượt.</small>
                  )}
                </div>
              )}

              {subTab === 'history' && (
                history.length === 0 ? (
                  <Empty description="Chưa có lịch sử kích hoạt hoặc khôi phục nào cho prompt này." />
                ) : (
                  <div className="aiops-table-wrap">
                    <table className="aiops-table">
                      <thead>
                        <tr>
                          <th>Thời điểm</th>
                          <th>Người thực hiện</th>
                          <th>Trace ID</th>
                          <th>Lý do</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td>{formatDate(h.activatedAt)}</td>
                            <td><strong>{h.activatedBy}</strong></td>
                            <td><code>{h.traceId}</code></td>
                            <td>{h.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          ) : (
            <Empty description="Chọn một prompt trong danh sách bên trái." />
          )}
        </div>
      )}

      <Modal
        open={createOpen}
        title="Tạo Prompt mới"
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreatePrompt()}
        okText="Tạo Prompt"
        cancelText="Hủy"
        confirmLoading={busy === 'create-prompt'}
        width={680}
      >
        <div className="aiops-form-stack">
          <label>
            Mã Prompt (duy nhất, chữ thường)
            <Input
              placeholder="Ví dụ: weather.risk.explanation"
              value={createForm.promptKey}
              onChange={(e) => setCreateForm((f) => ({ ...f, promptKey: e.target.value }))}
            />
          </label>
          <label>
            Tên hiển thị
            <Input
              placeholder="Ví dụ: Tư vấn thời tiết — Giải thích rủi ro bay"
              value={createForm.displayName}
              onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <Space wrap style={{ width: '100%' }}>
            <label style={{ flex: 1 }}>
              Tính năng AI
              <Select
                value={createForm.feature}
                onChange={(feature) => setCreateForm((f) => ({ ...f, feature }))}
                options={[
                  ...FEATURE_OPTIONS,
                  { value: 'CUSTOM', label: 'Tùy chỉnh (CUSTOM)' },
                ]}
              />
            </label>
            <label style={{ flex: 1 }}>
              Loại Prompt
              <Select
                value={createForm.promptType}
                onChange={(promptType) => setCreateForm((f) => ({ ...f, promptType }))}
                options={PROMPT_TYPE_OPTIONS}
              />
            </label>
            <label style={{ flex: 1 }}>
              Model liên kết
              <Input
                value={createForm.modelBinding}
                onChange={(e) => setCreateForm((f) => ({ ...f, modelBinding: e.target.value }))}
              />
            </label>
          </Space>
          <label>
            Mô tả
            <Input
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label>
            Nội dung Prompt (hỗ trợ biến {'{{variable}}'})
            <Input.TextArea
              rows={6}
              value={createForm.templateContent}
              onChange={(e) => setCreateForm((f) => ({ ...f, templateContent: e.target.value }))}
              className="aiops-prompt-editor aiops-prompt-editor--compact"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={editMetaOpen}
        title={`Sửa thông tin Prompt · ${selectedKey}`}
        onCancel={() => setEditMetaOpen(false)}
        onOk={() => void handleUpdatePromptMeta()}
        okText="Lưu thông tin"
        cancelText="Hủy"
        confirmLoading={busy === 'update-meta'}
      >
        <div className="aiops-form-stack">
          <label>
            Tên hiển thị
            <Input
              value={editMetaForm.displayName}
              onChange={(e) => setEditMetaForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </label>
          <label>
            Mô tả
            <Input.TextArea
              rows={2}
              value={editMetaForm.description}
              onChange={(e) => setEditMetaForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          {selectedPrompt && isChecklistVisionPrompt(selectedPrompt) ? (
            <div>
              <PromptRuntimeModelDisplay prompt={selectedPrompt} />
              <p>
                Nhà cung cấp và mô hình được quản lý bằng cấu hình hệ thống, không thay đổi tại đây.
              </p>
            </div>
          ) : (
            <label>
              Model liên kết
              <Input
                value={editMetaForm.modelBinding}
                onChange={(e) => setEditMetaForm((f) => ({ ...f, modelBinding: e.target.value }))}
              />
            </label>
          )}
          <label>
            Trạng thái kích hoạt
            <Select
              value={editMetaForm.enabled ? 'ENABLED' : 'DISABLED'}
              onChange={(v) => setEditMetaForm((f) => ({ ...f, enabled: v === 'ENABLED' }))}
              options={[
                { value: 'ENABLED', label: 'Đang bật' },
                { value: 'DISABLED', label: 'Tạm tắt' },
              ]}
            />
          </label>
        </div>
      </Modal>
    </section>
  )
}
