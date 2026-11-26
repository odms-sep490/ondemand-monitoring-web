import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PictureOutlined,
  PlusOutlined,
  RobotOutlined,
  SaveOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { authSession } from '../auth/api/authSession'
import {
  reportApi,
  type InspectionReport,
  type ReportDocument,
  type ReportSection,
} from './reportApi'
import { ReportTextEditor } from './ReportTextEditor'
import './reportStudio.css'
import { selectReportForReview } from './reportSelection'
import { editorialChanges, explainEditorialChange } from './editorialExplanation'

const statusNames: Record<string, string> = {
  DRAFT: 'Chưa tạo nội dung',
  GENERATING: 'Đang tạo bản nháp',
  AI_DRAFT: 'Bản nháp AI · Cần rà soát',
  IN_REVIEW: 'Chờ phê duyệt',
  REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
  APPROVED: 'Đã phê duyệt',
  FINALIZED: 'PDF đã chốt',
  DELIVERED: 'Đã bàn giao',
  FAILED: 'Tạo báo cáo thất bại',
}
const qualityNames: Record<string, string> = {
  VIDEO_NOT_ANALYZED: 'Video đã duyệt · chưa phân tích AI',
  PASS: 'Đạt chất lượng',
  PASSED: 'Đạt chất lượng',
  FAIL: 'Chất lượng cần rà soát',
  FAILED: 'Chất lượng không đạt',
  NOT_ANALYZED: 'Chưa đánh giá chất lượng',
  WARN: 'Cần kiểm tra',
  WARNING: 'Cần kiểm tra',
  REVIEW_REQUIRED: 'Cần rà soát',
  PENDING: 'Chờ đánh giá',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
}
const userRoleNames: Record<string, string> = {
  STAFF: 'Nhân viên',
  DRONE_OPERATOR: 'Kỹ thuật viên bay',
  INSPECTOR: 'Kiểm định viên',
  MANAGER: 'Quản lý',
  ADMIN: 'Quản trị viên',
  CUSTOMER: 'Khách hàng',
  SYSTEM_OPERATOR: 'Vận hành hệ thống',
  FINANCE: 'Tài chính',
}
const versionActionNames: Record<string, string> = {
  CREATE: 'Khởi tạo báo cáo',
  CREATED: 'Khởi tạo báo cáo',
  GENERATE: 'Yêu cầu tạo bản nháp AI',
  GENERATED: 'AI hoàn tất bản nháp',
  AI_GENERATED: 'AI hoàn tất bản nháp',
  AI_DRAFT: 'AI hoàn tất bản nháp',
  SAVE: 'Lưu bản nháp',
  SAVED: 'Lưu bản nháp',
  UPDATE: 'Cập nhật bản nháp',
  UPDATED: 'Cập nhật bản nháp',
  EDIT: 'Chỉnh sửa bản nháp',
  EDITED: 'Chỉnh sửa bản nháp',
  REWRITE: 'Biên tập bằng AI',
  SUBMIT_REVIEW: 'Gửi phê duyệt',
  SUBMITTED_FOR_REVIEW: 'Gửi phê duyệt',
  IN_REVIEW: 'Gửi phê duyệt',
  REQUEST_REVISION: 'Yêu cầu chỉnh sửa',
  REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
  APPROVE: 'Phê duyệt báo cáo',
  APPROVED: 'Phê duyệt báo cáo',
  FINALIZE: 'Chốt phiên bản PDF',
  FINALIZED: 'Chốt phiên bản PDF',
  DELIVER: 'Bàn giao cho khách hàng',
  DELIVERED: 'Bàn giao cho khách hàng',
  CANCEL_GENERATION: 'Dừng tạo bản nháp',
  FAILED: 'Tạo bản nháp thất bại',
}
type VersionActionTone =
  | 'ai'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'

function formatQualityStatus(status: string) {
  return qualityNames[status.toUpperCase()] ?? status
}
function formatUserRole(role?: string | null) {
  if (!role) return 'Chưa xác định'
  return userRoleNames[role.toUpperCase()] ?? role
}
function formatVersionAction(action: string) {
  const key = action.trim().toUpperCase().replace(/[\s-]+/g, '_')
  return versionActionNames[key] ?? action
}
function getVersionActionMeta(action: string): {
  label: string
  tone: VersionActionTone
  icon: ReactNode
} {
  const key = action.trim().toUpperCase().replace(/[\s-]+/g, '_')
  const label = formatVersionAction(action)
  if (
    key === 'GENERATE' ||
    key === 'GENERATED' ||
    key === 'AI_GENERATED' ||
    key === 'AI_DRAFT' ||
    key === 'REWRITE'
  ) {
    return { label, tone: 'ai', icon: <RobotOutlined /> }
  }
  if (
    key === 'APPROVE' ||
    key === 'APPROVED' ||
    key === 'DELIVER' ||
    key === 'DELIVERED'
  ) {
    return { label, tone: 'success', icon: <CheckCircleOutlined /> }
  }
  if (key === 'FINALIZE' || key === 'FINALIZED') {
    return { label, tone: 'success', icon: <FilePdfOutlined /> }
  }
  if (
    key === 'SUBMIT_REVIEW' ||
    key === 'SUBMITTED_FOR_REVIEW' ||
    key === 'IN_REVIEW'
  ) {
    return { label, tone: 'warning', icon: <SendOutlined /> }
  }
  if (key === 'REQUEST_REVISION' || key === 'REVISION_REQUESTED') {
    return { label, tone: 'warning', icon: <ExclamationCircleOutlined /> }
  }
  if (key === 'FAILED' || key === 'CANCEL_GENERATION') {
    return { label, tone: 'danger', icon: <CloseCircleOutlined /> }
  }
  if (
    key === 'SAVE' ||
    key === 'SAVED' ||
    key === 'UPDATE' ||
    key === 'UPDATED' ||
    key === 'EDIT' ||
    key === 'EDITED'
  ) {
    return { label, tone: 'primary', icon: <EditOutlined /> }
  }
  return { label, tone: 'neutral', icon: <FileAddOutlined /> }
}
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function formatVersionActor(actor?: string | null) {
  const raw = (actor ?? '').trim()
  const upper = raw.toUpperCase()
  if (!raw) {
    return { label: 'Hệ thống', isSystem: true, shortId: '', rawId: '' }
  }
  if (upper === 'AI_WORKER' || upper === 'AI' || upper === 'AI_AGENT') {
    return { label: 'Hệ thống AI', isSystem: true, shortId: '', rawId: raw }
  }
  if (upper === 'SYSTEM') {
    return { label: 'Hệ thống', isSystem: true, shortId: '', rawId: raw }
  }
  const currentUser = authSession.getUser()
  if (currentUser && currentUser.id.toLowerCase() === raw.toLowerCase()) {
    return {
      label: currentUser.fullName || formatUserRole(currentUser.role),
      isSystem: false,
      isCurrentUser: true,
      shortId: raw.slice(-6).toUpperCase(),
      rawId: raw,
    }
  }
  if (UUID_PATTERN.test(raw)) {
    return {
      label: 'Nhân sự hệ thống',
      isSystem: false,
      isCurrentUser: false,
      shortId: raw.slice(-6).toUpperCase(),
      rawId: raw,
    }
  }
  return {
    label: raw,
    isSystem: false,
    isCurrentUser: false,
    shortId: '',
    rawId: raw,
  }
}
function formatVersionTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const day = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${time} · ${day}`
}
const roleNames: Record<string, string> = {
  OVERVIEW: 'Ảnh đại diện',
  EVIDENCE: 'Minh chứng',
  SUPPORTING: 'Bổ sung',
}
const selectionReasons: Record<string, string> = {
  'Resolution + reviewed finding linkage + quality signal + staff priority; no visual scene classification':
    'Xếp hạng theo độ phân giải, liên kết đánh giá đã xác nhận, chất lượng ảnh và ưu tiên nhân viên. Chưa phân loại nội dung ảnh tự động.',
  'Exact duplicate excluded from automatic selection':
    'Ảnh trùng nội dung, không tự động chọn.',
  'Exact duplicate retained for reviewed finding or staff priority':
    'Giữ ảnh trùng do có đánh giá liên quan hoặc nhân viên ưu tiên.',
  'Image resolution below 320 × 240': 'Độ phân giải ảnh quá thấp.',
}
const stageNames: Record<string, string> = {
  QUEUED: 'Đang chờ',
  LOADING_MEDIA: 'Đang lấy ảnh nhiệm vụ',
  SELECTING_EVIDENCE: 'Đang chọn bằng chứng',
  GENERATING_REPORT: 'AI đang soạn báo cáo',
  VALIDATING_OUTPUT: 'Đang kiểm tra nguồn',
  SAVING_DRAFT: 'Đã lưu bản nháp',
  FAILED: 'Không hoàn thành',
}
function SourceImage({
  reportId,
  mediaId,
  onOpen,
}: {
  reportId: string
  mediaId: string
  onOpen?: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const [video, setVideo] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    let object = ''
    setError(false)
    setUrl('')
    setVideo(false)
    void reportApi
      .image(reportId, mediaId)
      .then((blob) => {
        object = URL.createObjectURL(blob)
        if (live) setUrl(object)
      })
      .catch(async () => {
        try {
          const source = await reportApi.video(reportId, mediaId)
          if (live) { setVideo(true); setUrl(source.url) }
        } catch { if (live) setError(true) }
      })
    return () => {
      live = false
      if (object) URL.revokeObjectURL(object)
    }
  }, [reportId, mediaId, attempt])
  return error ? (
    <div className="ir-media-placeholder is-error" role="alert">
      <PictureOutlined className="ir-media-placeholder-icon" aria-hidden="true" />
      <span>Không đọc được ảnh/video</span>
      <button
        type="button"
        className="ir-media-retry-btn"
        onClick={() => setAttempt((prev) => prev + 1)}
      >
        Thử lại
      </button>
    </div>
  ) : url && video ? (
    <video src={url} controls preload="none" className="ir-media-video" aria-label={`Video bằng chứng ${mediaId}`} />
  ) : url ? (
    <button
      className="ir-image-button"
      onClick={() => onOpen?.(url)}
      aria-label={`Xem ảnh ${mediaId}`}
    >
      <img src={url} loading="lazy" alt={`Bằng chứng ${mediaId}`} />
    </button>
  ) : (
    <div className="ir-media-placeholder is-loading">
      <Spin size="small" />
    </div>
  )
}
function editorialFields(doc: ReportDocument | null) {
  if (!doc) return []
  return [
    { label: 'Tóm tắt', text: doc.executiveSummary },
    ...doc.sections.flatMap((section, n) => [
      { label: `Phần ${n + 1}: ${section.title}`, text: section.content },
      ...section.images.map((image, i) => ({ label: `Phần ${n + 1} · Chú thích ${i + 1}`, text: image.caption })),
    ]),
  ]
}
function ChangedText({ before, after, original = false }: { before: string; after: string; original?: boolean }) {
  return <>{editorialChanges(before, after).map((part, index) => {
    if (original && part.kind === 'added' || !original && part.kind === 'removed') return null
    return part.kind === 'same' ? part.text : <mark key={index}>{part.text}</mark>
  })}</>
}
export function InspectionReportEntry({
  missionId,
  customer = false,
  buttonClassName,
}: {
  missionId: string
  customer?: boolean
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const dirtyRef = useRef(false)
  const label = customer ? 'Báo cáo giám sát đã bàn giao' : 'Báo cáo AI'
  return (
    <>
      {buttonClassName ? (
        <button
          type="button"
          className={buttonClassName}
          onClick={() => setOpen(true)}
        >
          <FileTextOutlined aria-hidden="true" />
          <span>{label}</span>
        </button>
      ) : (
        <Button icon={<FileTextOutlined />} onClick={() => setOpen(true)}>
          {label}
        </Button>
      )}
      <Modal
        open={open}
        onCancel={() => {
          if (dirtyRef.current && !window.confirm('Bỏ thay đổi chưa lưu?'))
            return
          dirtyRef.current = false
          setOpen(false)
        }}
        title="Soạn thảo báo cáo giám sát"
        width="min(1540px, 98vw)"
        footer={null}
        destroyOnHidden
        className="ir-modal"
      >
        <ReportStudio
          missionId={missionId}
          customer={customer}
          reviewOnly={!customer && authSession.getUser()?.role === 'MANAGER'}
          onDirtyChange={(value) => {
            dirtyRef.current = value
          }}
        />
      </Modal>
    </>
  )
}
export function ReportStudio({
  missionId,
  customer = false,
  onDirtyChange,
  reviewOnly = false,
  active = true,
}: {
  missionId: string
  customer?: boolean
  onDirtyChange?: (value: boolean) => void
  reviewOnly?: boolean
  active?: boolean
}) {
  const [reports, setReports] = useState<InspectionReport[]>([])
  const [report, setReport] = useState<InspectionReport | null>(null)
  const [draft, setDraft] = useState<ReportDocument | null>(null)
  const [canCreate, setCanCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [search, setSearch] = useState('')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [imagePreview, setImagePreview] = useState('')
  const [pdfPreview, setPdfPreview] = useState('')
  const [instruction, setInstruction] = useState('professional')
  const [proposalMode, setProposalMode] = useState('professional')
  const [proposal, setProposal] = useState<ReportDocument | null>(null)
  const [editorialWarnings, setEditorialWarnings] = useState<string[]>([])
  const [undoEditorial, setUndoEditorial] = useState<ReportDocument | null>(null)
  const [versions, setVersions] = useState<
    | { revision: number; action: string; actor: string; created_at: string }[]
    | null
  >(null)
  const revisionRef = useRef(0)
  const install = (next: InspectionReport) => {
    setUndoEditorial(null)
    setProposal(null)
    setReport(next)
    setDraft(next.document)
    revisionRef.current = next.revision
    setDirty(false)
    setSectionIndex(0)
    setReports((current) => [next, ...current.filter((r) => r.id !== next.id)])
  }
  useEffect(() => {
    if (!active) return
    let live = true
    setLoading(true)
    void Promise.all([
      reportApi.list(missionId),
      customer
        ? Promise.resolve({ canCreate: false })
        : reportApi.capabilities(missionId),
    ])
      .then(([rows, permissions]) => {
        if (live) {
          const available = reviewOnly ? rows.filter(row => row.document !== null) : rows
          setReports(available)
          setCanCreate(!reviewOnly && permissions.canCreate)
          const initial = selectReportForReview(available, reviewOnly)
          if (initial) install(initial)
          else { setReport(null); setDraft(null) }
        }
      })
      .catch((e) => {
        if (live) setError(e.message)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [missionId, customer, reviewOnly, active])
  useEffect(() => {
    if (!report || report.status !== 'GENERATING') return
    const id = window.setInterval(() => {
      void reportApi
        .get(report.id)
        .then((next) => {
          if (next.revision >= revisionRef.current) install(next)
        })
        .catch((e) => setError(e.message))
    }, 3000)
    return () => window.clearInterval(id)
  }, [report?.id, report?.status])
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(
    () => () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview)
    },
    [pdfPreview],
  )
  const run = async (work: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await work()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thao tác thất bại')
    } finally {
      setBusy(false)
    }
  }
  const create = () =>
    void run(async () => {
      install(await reportApi.create(missionId))
    })
  const edit = (update: (doc: ReportDocument) => ReportDocument) => {
    setDraft((doc) => (doc ? update(doc) : doc))
    setDirty(true)
  }
  const editable = Boolean(
    !customer &&
    !reviewOnly &&
    report?.canEdit &&
    ['AI_DRAFT', 'REVISION_REQUESTED'].includes(report.status),
  )
  const selected = draft?.sections[sectionIndex]
  const editSection = (update: (s: ReportSection) => ReportSection) =>
    edit((doc) => ({
      ...doc,
      sections: doc.sections.map((s, i) =>
        i === sectionIndex ? update(s) : s,
      ),
    }))
  const act = (action: string) =>
    void run(async () => {
      if (!report) return
      install(await reportApi.action(report, action))
    })
  const viewPdf = (download = false) =>
    void run(async () => {
      if (!report) return
      const blob = await reportApi.pdf(
        report.id,
        !download && !customer && report.status !== 'DELIVERED',
      )
      const url = URL.createObjectURL(blob)
      if (download) {
        const a = document.createElement('a')
        a.href = url
        a.download = `inspection-${report.id}.pdf`
        a.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else setPdfPreview(url)
    })
  const replace = (index: number, id: string) =>
    editSection((s) => {
      const old = s.images[index]
      const images = s.images.map((image, i) =>
        i === index ? { ...old, mediaId: id } : image,
      )
      return {
        ...s,
        images,
        sourceMediaIds: [...new Set([...s.sourceMediaIds, id])],
      }
    })
  if (loading)
    return (
      <div className="ir-loading">
        <Spin />
        <p>Đang tải báo cáo nhiệm vụ…</p>
      </div>
    )
  const images = report?.evidence?.images ?? []
  const selectedIds = new Set(
    draft?.sections.flatMap((s) => s.images.map((i) => i.mediaId)) ?? [],
  )
  return (
    <section className="ir-studio" aria-label="Không gian báo cáo giám sát">
      <div className="ir-commandbar">
        <div>
          <strong>{draft?.reportTitle ?? 'Báo cáo giám sát'}</strong>
          <div className="ir-muted">
            {report
              ? `Phiên bản ${report.revision} · ${statusNames[report.status] ?? report.status}`
              : 'Chọn bằng chứng thực tế từ nhiệm vụ'}
          </div>
        </div>
        <Space wrap>
          {reports.length > 0 && (
            <Select
              aria-label="Chọn báo cáo"
              value={report?.id}
              style={{ minWidth: 210 }}
              options={reports.map((r) => ({
                value: r.id,
                label: `${statusNames[r.status] ?? r.status} · Phiên bản ${r.revision}`,
              }))}
              onChange={(id) => {
                if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu?'))
                  return
                const next = reports.find((r) => r.id === id)
                if (next) install(next)
              }}
            />
          )}
          {reviewOnly && <Button loading={busy} onClick={() => void run(async () => {
            const available = (await reportApi.list(missionId)).filter(row => row.document !== null)
            setReports(available)
            const initial = selectReportForReview(available, true)
            if (initial) install(initial)
            else { setReport(null); setDraft(null) }
          })}>Tải lại báo cáo</Button>}
          {!customer && !reviewOnly && canCreate && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm('Bỏ thay đổi chưa lưu để tạo báo cáo mới?')
                )
                  create()
              }}
              loading={busy}
            >
              Báo cáo mới
            </Button>
          )}
          {editable && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              disabled={!dirty}
              loading={busy}
              onClick={() =>
                void run(async () => {
                  if (report && draft)
                    install(await reportApi.save(report, draft))
                })
              }
            >
              Lưu bản nháp
            </Button>
          )}
          {draft && (
            <Button disabled={dirty || busy} onClick={() => viewPdf()}>
              Xem PDF
            </Button>
          )}
          {report && ['FINALIZED', 'DELIVERED'].includes(report.status) && (
            <Button icon={<DownloadOutlined />} onClick={() => viewPdf(true)}>
              Tải PDF
            </Button>
          )}
        </Space>
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          closable
          onClose={() => setError('')}
        />
      )}
      {dirty && (
        <Alert
          type="warning"
          message="Có thay đổi chưa lưu. Lưu bản nháp trước khi xem PDF hoặc gửi duyệt."
        />
      )}
      {!report ? (
        <Empty
          description={
            customer
              ? 'Chưa có báo cáo đã bàn giao.'
              : reviewOnly ? 'Chưa có báo cáo do nhân viên soạn để xem hoặc phê duyệt.' : 'Chưa có báo cáo. Tạo bản nháp để lấy ảnh nhiệm vụ và đề xuất nội dung.'
          }
        />
      ) : (
        <>
          {report.status === 'GENERATING' && (
            <Alert
              type="info"
              showIcon
              icon={<Spin size="small" />}
              message={
                stageNames[report.jobStage ?? 'QUEUED'] ?? report.jobStage
              }
              action={
                <Button disabled={reviewOnly} onClick={() => act('cancel-generation')}>
                  Dừng tạo
                </Button>
              }
            />
          )}
          {report.error && <Alert type="error" message={report.error} />}
          {['DRAFT', 'FAILED'].includes(report.status) &&
            !customer &&
            canCreate && (
              <div className="ir-start">
                <FileTextOutlined />
                <h3>Tạo báo cáo từ ảnh nhiệm vụ</h3>
                <p>
                  Hệ thống lấy ảnh đã duyệt, kiểm tra dữ liệu và chọn bằng
                  chứng. AI đề xuất nội dung; nhân viên cần rà soát trước khi
                  phê duyệt.
                </p>
                <Button
                  type="primary"
                  loading={busy}
                  onClick={() => act('generate')}
                >
                  Tạo bản nháp bằng AI
                </Button>
              </div>
            )}
          {draft && reviewOnly ? (
            <div className="ir-review-layout">
              <div
                className={`ir-review-bar is-${report.status.toLowerCase()}`}
              >
                <div className="ir-review-bar-info">
                  <div className="ir-review-bar-head">
                    <Tag
                      color={
                        report.status === 'IN_REVIEW'
                          ? 'blue'
                          : report.status === 'APPROVED' ||
                              report.status === 'FINALIZED' ||
                              report.status === 'DELIVERED'
                            ? 'green'
                            : report.status === 'REVISION_REQUESTED'
                              ? 'orange'
                              : 'default'
                      }
                    >
                      {statusNames[report.status] ?? report.status}
                    </Tag>
                    <span className="ir-review-bar-metrics">
                      {selectedIds.size} ảnh/video trong báo cáo ·{' '}
                      {report.evidence?.findings.length ?? 0} đánh giá đã xác
                      nhận
                    </span>
                  </div>
                  <h3>
                    {report.status === 'IN_REVIEW'
                      ? 'Báo cáo đang chờ bạn phê duyệt'
                      : report.status === 'APPROVED'
                        ? 'Báo cáo đã được phê duyệt'
                        : report.status === 'FINALIZED' ||
                            report.status === 'DELIVERED'
                          ? 'Báo cáo đã phê duyệt · PDF đã chốt'
                          : 'Báo cáo đang được nhân viên soạn thảo'}
                  </h3>
                  <p>
                    {report.status === 'IN_REVIEW'
                      ? 'Xem lại nội dung và ảnh minh chứng bên dưới trước khi phê duyệt hoặc yêu cầu nhân viên chỉnh sửa.'
                      : report.status === 'APPROVED'
                        ? 'Chốt phiên bản để xuất tệp PDF lưu trữ nội bộ cho quản lý.'
                        : report.status === 'FINALIZED' ||
                            report.status === 'DELIVERED'
                          ? 'Báo cáo giám sát đã hoàn tất phê duyệt nội bộ. Bạn có thể xem hoặc tải tệp PDF ở thanh công cụ phía trên.'
                          : 'Nhân viên chưa gửi phê duyệt phiên bản này. Bạn chỉ có thể xem trước nội dung.'}
                  </p>
                </div>
                <div className="ir-review-bar-actions">
                  {report.canApprove && report.status === 'IN_REVIEW' && (
                    <>
                      <Button
                        disabled={busy}
                        onClick={() => act('request-revision')}
                      >
                        Yêu cầu chỉnh sửa
                      </Button>
                      <Button
                        type="primary"
                        disabled={busy}
                        onClick={() =>
                          Modal.confirm({
                            title:
                              'Xác nhận đã kiểm tra nội dung và bằng chứng?',
                            content:
                              'Tôi đã kiểm tra nội dung, nguồn bằng chứng và các cảnh báo chất lượng ảnh. Phê duyệt sẽ khóa nội dung phiên bản này.',
                            okText: 'Xác nhận phê duyệt',
                            cancelText: 'Hủy',
                            onOk: () =>
                              run(async () =>
                                install(
                                  await reportApi.action(report, 'approve'),
                                ),
                              ),
                          })
                        }
                      >
                        Phê duyệt báo cáo
                      </Button>
                    </>
                  )}
                  {report.canApprove && report.status === 'APPROVED' && (
                    <Button
                      type="primary"
                      loading={busy}
                      onClick={() => act('finalize')}
                    >
                      Chốt phiên bản và tạo PDF
                    </Button>
                  )}
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(async () =>
                        setVersions(await reportApi.versions(report.id)),
                      )
                    }
                  >
                    Lịch sử phiên bản
                  </Button>
                </div>
              </div>

              <Alert
                type="warning"
                showIcon
                message="Nội dung AI cần kiểm tra. Không xem phân tích thay đổi là kết luận hư hỏng hoặc chứng nhận chuyên môn."
              />
              {report.evidence?.warnings.map((w) => (
                <Alert key={w} type="warning" showIcon message={w} />
              ))}

              <article className="ir-review-sheet">
                <div className="ir-review-block">
                  <h4>Tóm tắt điều hành</h4>
                  <p className="ir-review-prose">{draft.executiveSummary}</p>
                </div>

                <div className="ir-review-meta-grid">
                  <div className="ir-review-meta-card">
                    <h4>Mục đích và phạm vi</h4>
                    <p>{draft.inspectionScope}</p>
                  </div>
                  <div className="ir-review-meta-card">
                    <h4>Phương pháp</h4>
                    <p>{draft.methodology}</p>
                  </div>
                </div>

                {draft.sections.map((section, idx) => (
                  <section
                    key={section.sectionId}
                    className="ir-review-section"
                  >
                    <h4>
                      {idx + 1}. {section.title}
                    </h4>
                    <p className="ir-review-prose">{section.content}</p>
                    {section.sourceFindingIds.map((id) => (
                      <details key={id} className="ir-review-finding">
                        <summary>Đánh giá nguồn · {id}</summary>
                        <p>
                          {report.evidence?.findings.find((f) => f.id === id)
                            ?.text ?? 'Nguồn đã bàn giao'}
                        </p>
                      </details>
                    ))}
                    {section.images.length > 0 && (
                      <div className="ir-review-gallery">
                        {section.images.map((image, imgIdx) => (
                          <figure
                            key={`${image.mediaId}:${imgIdx}`}
                            className="ir-review-figure"
                          >
                            <SourceImage
                              reportId={report.id}
                              mediaId={image.mediaId}
                              onOpen={setImagePreview}
                            />
                            <figcaption>
                              <Tag
                                className={`ir-role-tag ${image.role === 'OVERVIEW' ? 'is-primary' : ''}`}
                              >
                                {roleNames[image.role] ?? image.role}
                              </Tag>
                              <span
                                className="ir-review-caption-text"
                                title={image.caption}
                              >
                                {image.caption}
                              </span>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}
                  </section>
                ))}

                {(() => {
                  const limitations = draft.limitations.filter(Boolean)
                  const recommendations = draft.recommendations.filter(Boolean)
                  const hasBoth =
                    limitations.length > 0 && recommendations.length > 0
                  if (limitations.length === 0 && recommendations.length === 0)
                    return null
                  return (
                    <div
                      className={`ir-review-meta-grid${hasBoth ? '' : ' is-single'}`}
                    >
                      {limitations.length > 0 && (
                        <div className="ir-review-meta-card is-limitation">
                          <h4>Giới hạn</h4>
                          <ul>
                            {limitations.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {recommendations.length > 0 && (
                        <div className="ir-review-meta-card is-recommendation">
                          <h4>Khuyến nghị</h4>
                          <ul>
                            {recommendations.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {draft.conclusion && (
                  <div className="ir-review-block ir-review-conclusion">
                    <h4>Kết luận</h4>
                    <p className="ir-review-prose">{draft.conclusion}</p>
                  </div>
                )}

                <footer className="ir-review-footer">
                  <small>
                    Mô hình AI: {report.model ?? 'Chưa tạo'} · Vai trò:{' '}
                    {formatUserRole(authSession.getUser()?.role)}
                  </small>
                </footer>
              </article>

              {images.length > 0 && (
                <details className="ir-review-evidence">
                  <summary>
                    Thư viện bằng chứng nguồn ({images.length} tệp)
                  </summary>
                  <div className="ir-review-evidence-grid">
                    {images.map((image) => (
                      <article
                        key={image.mediaId}
                        className={`ir-evidence-card ${selectedIds.has(image.mediaId) ? 'is-selected' : ''}`}
                      >
                        <SourceImage
                          reportId={report.id}
                          mediaId={image.mediaId}
                          onOpen={setImagePreview}
                        />
                        <strong title={image.fileName}>{image.fileName}</strong>
                        <small>
                          {image.width} × {image.height} ·{' '}
                          {image.capturedAt
                            ? new Date(image.capturedAt).toLocaleDateString(
                                'vi-VN',
                              )
                            : 'Chưa có thời điểm chụp'}
                        </small>
                        <Tag
                          color={
                            image.qualityStatus === 'PASS' ||
                            image.qualityStatus === 'PASSED'
                              ? 'green'
                              : 'orange'
                          }
                        >
                          {formatQualityStatus(image.qualityStatus)}
                        </Tag>
                      </article>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ) : draft && (
            <div className={`ir-grid ${customer ? 'is-customer' : ''}`}>
              {!customer && (
                <aside className="ir-evidence">
                  <h3>
                    Thư viện bằng chứng <Tag>{images.length}</Tag>
                  </h3>
                  <Input
                    aria-label="Tìm ảnh"
                    placeholder="Tìm tên ảnh hoặc mã bằng chứng"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="ir-evidence-grid">
                    {images
                      .filter((i) =>
                        (i.fileName + ' ' + i.mediaId)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((image) => (
                        <article
                          key={image.mediaId}
                          className={`ir-evidence-card ${selectedIds.has(image.mediaId) ? 'is-selected' : ''}`}
                        >
                          <SourceImage
                            reportId={report.id}
                            mediaId={image.mediaId}
                            onOpen={setImagePreview}
                          />
                          <strong title={image.fileName}>
                            {image.fileName}
                          </strong>
                          <small>
                            {image.qualityStatus === 'VIDEO_NOT_ANALYZED' ? 'Video' : `${image.width} × ${image.height}`} ·{' '}
                            {image.capturedAt
                              ? new Date(image.capturedAt).toLocaleDateString(
                                  'vi-VN',
                                )
                              : 'Chưa có thời điểm chụp'}
                          </small>
                          <Tag
                            color={
                              image.qualityStatus === 'PASS' ||
                              image.qualityStatus === 'PASSED'
                                ? 'green'
                                : 'orange'
                            }
                          >
                            {formatQualityStatus(image.qualityStatus)}
                          </Tag>
                          <small>
                            {image.findingIds.length} đánh giá liên quan · Điểm{' '}
                            {image.rankingScore.toFixed(1)}
                          </small>
                          <details>
                            <summary>Lý do lựa chọn</summary>
                            <p>
                              {selectionReasons[image.selectionReason] ??
                                image.selectionReason}
                            </p>
                          </details>
                          {!reviewOnly && (
                            <Button
                              size="small"
                              disabled={
                                !editable ||
                                !image.isEligible ||
                                !selected ||
                                selected.images.some(
                                  (i) => i.mediaId === image.mediaId,
                                )
                              }
                              onClick={() =>
                                editSection((s) => ({
                                  ...s,
                                  images: [
                                    ...s.images,
                                    {
                                      mediaId: image.mediaId,
                                      role: 'SUPPORTING',
                                      caption: image.fileName,
                                    },
                                  ],
                                  sourceMediaIds: [
                                    ...new Set([
                                      ...s.sourceMediaIds,
                                      image.mediaId,
                                    ]),
                                  ],
                                }))
                              }
                            >
                              Thêm vào phần này
                            </Button>
                          )}
                        </article>
                      ))}
                  </div>
                </aside>
              )}
              <main className="ir-document">
                <label>
                  Tên báo cáo
                  <Input
                    value={draft.reportTitle}
                    disabled={!editable}
                    maxLength={200}
                    spellCheck={false}
                    onChange={(e) =>
                      edit((d) => ({ ...d, reportTitle: e.target.value }))
                    }
                  />
                </label>
                {(
                  [
                    'executiveSummary',
                    'inspectionScope',
                    'methodology',
                  ] as const
                ).map((key, index) => (
                  <label key={key}>
                    {
                      [
                        'Tóm tắt điều hành',
                        'Mục đích và phạm vi',
                        'Phương pháp',
                      ][index]
                    }
                    <Input.TextArea
                      value={draft[key]}
                      disabled={!editable}
                      autoSize={{ minRows: 2, maxRows: 8 }}
                      maxLength={3000}
                      spellCheck={false}
                      onChange={(e) =>
                        edit((d) => ({ ...d, [key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
                {selected && (
                  <section className="ir-section">
                    <div className="ir-section-toolbar">
                      <div className="ir-section-picker">
                        <span className="ir-section-kicker">
                          Nội dung báo cáo
                        </span>
                        <Select
                          aria-label="Phần báo cáo đang sửa"
                          className="ir-section-select"
                          value={sectionIndex}
                          options={draft.sections.map((s, i) => ({
                            value: i,
                            label: `${i + 1}. ${s.title || `Phần ${i + 1}`}`,
                          }))}
                          onChange={setSectionIndex}
                        />
                        <span className="ir-section-counter">
                          {sectionIndex + 1}/{draft.sections.length}
                        </span>
                      </div>
                      {!reviewOnly && draft.sections.length > 1 && (
                        <div className="ir-section-reorder">
                          <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            title="Đưa phần lên"
                            aria-label="Đưa phần lên"
                            disabled={!editable || sectionIndex === 0}
                            onClick={() =>
                              edit((d) => {
                                const sections = [...d.sections]
                                ;[
                                  sections[sectionIndex - 1],
                                  sections[sectionIndex],
                                ] = [
                                  sections[sectionIndex],
                                  sections[sectionIndex - 1],
                                ]
                                setSectionIndex(sectionIndex - 1)
                                return { ...d, sections }
                              })
                            }
                          >
                            Lên
                          </Button>
                          <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            title="Đưa phần xuống"
                            aria-label="Đưa phần xuống"
                            disabled={
                              !editable ||
                              sectionIndex >= draft.sections.length - 1
                            }
                            onClick={() =>
                              edit((d) => {
                                const sections = [...d.sections]
                                ;[
                                  sections[sectionIndex + 1],
                                  sections[sectionIndex],
                                ] = [
                                  sections[sectionIndex],
                                  sections[sectionIndex + 1],
                                ]
                                setSectionIndex(sectionIndex + 1)
                                return { ...d, sections }
                              })
                            }
                          >
                            Xuống
                          </Button>
                        </div>
                      )}
                    </div>
                    <label className="ir-section-field">
                      <span>Tiêu đề phần</span>
                      <Input
                        aria-label="Tiêu đề phần báo cáo"
                        value={selected.title}
                        disabled={!editable}
                        spellCheck={false}
                        onChange={(e) =>
                          editSection((s) => ({ ...s, title: e.target.value }))
                        }
                      />
                    </label>
                    <div className="ir-section-field">
                      <span className="ir-section-field-label">
                        Nội dung chi tiết
                      </span>
                      <ReportTextEditor
                        key={`${report.id}:${revisionRef.current}:${selected.sectionId}`}
                        content={selected.content}
                        richText={selected.richText}
                        editable={editable}
                        onChange={(content, richText) =>
                          editSection((s) => ({ ...s, content, richText }))
                        }
                      />
                    </div>
                    {selected.sourceFindingIds.map((id) => (
                      <details key={id}>
                        <summary>Đánh giá nguồn · {id}</summary>
                        <p>
                          {report.evidence?.findings.find((f) => f.id === id)
                            ?.text ?? 'Nguồn đã bàn giao'}
                        </p>
                      </details>
                    ))}
                    {selected.images.map((image, index) => (
                      <figure key={`${image.mediaId}:${index}`}>
                        <SourceImage
                          reportId={report.id}
                          mediaId={image.mediaId}
                          onOpen={setImagePreview}
                        />
                        <figcaption>
                          <Input
                            aria-label={`Chú thích ảnh ${index + 1}`}
                            value={image.caption}
                            disabled={!editable}
                            maxLength={1000}
                            onChange={(e) =>
                              editSection((s) => ({
                                ...s,
                                images: s.images.map((i, n) =>
                                  n === index
                                    ? { ...i, caption: e.target.value }
                                    : i,
                                ),
                              }))
                            }
                          />
                        </figcaption>
                        <small>Mã ảnh: {image.mediaId}</small>
                        {editable && (
                          <Space wrap>
                            <Select
                              aria-label="Vai trò ảnh"
                              value={image.role}
                              options={[
                                'OVERVIEW',
                                'EVIDENCE',
                                'SUPPORTING',
                              ].map((value) => ({
                                value,
                                label: roleNames[value] ?? value,
                              }))}
                              onChange={(role) =>
                                editSection((s) => ({
                                  ...s,
                                  images: s.images.map((i, n) =>
                                    n === index ? { ...i, role } : i,
                                  ),
                                }))
                              }
                            />
                            <Select
                              aria-label="Thay ảnh"
                              placeholder="Thay ảnh"
                              style={{ width: 180 }}
                              options={images
                                .filter((i) => i.isEligible)
                                .map((i) => ({
                                  value: i.mediaId,
                                  label: i.fileName,
                                }))}
                              onChange={(id) => replace(index, id)}
                            />
                            <Button
                              disabled={index === 0}
                              onClick={() =>
                                editSection((s) => {
                                  const next = [...s.images]
                                  ;[next[index - 1], next[index]] = [
                                    next[index],
                                    next[index - 1],
                                  ]
                                  return { ...s, images: next }
                                })
                              }
                            >
                              Lên
                            </Button>
                            <Button
                              danger
                              onClick={() =>
                                editSection((s) => ({
                                  ...s,
                                  images: s.images.filter(
                                    (_, n) => n !== index,
                                  ),
                                }))
                              }
                            >
                              Bỏ khỏi báo cáo
                            </Button>
                          </Space>
                        )}
                      </figure>
                    ))}
                  </section>
                )}
                <label>
                  Giới hạn
                  <Input.TextArea
                    value={draft.limitations.join('\n')}
                    disabled={!editable}
                    onChange={(e) =>
                      edit((d) => ({
                        ...d,
                        limitations: e.target.value.split('\n'),
                      }))
                    }
                  />
                </label>
                <label>
                  Khuyến nghị
                  <Input.TextArea
                    value={draft.recommendations.join('\n')}
                    disabled={!editable}
                    onChange={(e) =>
                      edit((d) => ({
                        ...d,
                        recommendations: e.target.value.split('\n'),
                      }))
                    }
                  />
                </label>
                <label>
                  Kết luận
                  <Input.TextArea
                    value={draft.conclusion}
                    disabled={!editable}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    spellCheck={false}
                    onChange={(e) =>
                      edit((d) => ({ ...d, conclusion: e.target.value }))
                    }
                  />
                </label>
              </main>
              {!customer && (
                <aside className="ir-validation">
                  <h3>Rà soát và phê duyệt</h3>
                  <Tag color="blue">{statusNames[report.status]}</Tag>
                  <p>{selectedIds.size} ảnh/video thực tế trong báo cáo</p>
                  <p>
                    {report.evidence?.findings.length ?? 0} đánh giá đã có người
                    xác nhận
                  </p>
                  <Alert
                    type="warning"
                    message="Nội dung AI cần kiểm tra. Không xem phân tích thay đổi là kết luận hư hỏng hoặc chứng nhận chuyên môn."
                  />
                  {report.evidence?.warnings.map((w) => (
                    <Alert key={w} type="warning" message={w} />
                  ))}
                  {editable && (
                    <>
                      <h4>Trợ lý biên tập</h4>
                      <Select
                        aria-label="Yêu cầu biên tập"
                        value={instruction}
                        onChange={setInstruction}
                        options={[
                          ['professional', 'Chuyên nghiệp hơn'],
                          ['shorten', 'Rút gọn'],
                          ['simplify', 'Dễ hiểu hơn'],
                          ['summarize', 'Tóm tắt nguồn'],
                          ['caption', 'Đề xuất chú thích'],
                        ].map(([value, label]) => ({ value, label }))}
                      />
                      <Button
                        disabled={dirty || busy}
                        loading={busy}
                        onClick={() => void run(async () => {
                          const result = await reportApi.rewrite(report, instruction)
            setProposalMode(instruction)
                          setEditorialWarnings(Array.isArray(result.warnings) ? result.warnings.filter(w => typeof w === 'string') : [])
                          setProposal(result.document)
                        })}
                      >
                        {busy ? 'Đang biên tập và kiểm tra dữ kiện…' : 'Xem đề xuất AI'}
                      </Button>
                      {undoEditorial && <Button disabled={busy} onClick={() => {
                        setDraft(undoEditorial); setUndoEditorial(null); setDirty(true)
                      }}>Hoàn tác biên tập AI</Button>}
                    </>
                  )}
                  <div className="ir-workflow-actions">
                    {editable && (
                      <Button
                        type="primary"
                        disabled={dirty || busy}
                        loading={busy}
                        onClick={() => act('submit-review')}
                      >
                        Gửi phê duyệt
                      </Button>
                    )}
                    {report.canApprove && report.status === 'IN_REVIEW' && (
                      <>
                        <Button
                          disabled={busy}
                          onClick={() => act('request-revision')}
                        >
                          Yêu cầu chỉnh sửa
                        </Button>
                        <Button
                          type="primary"
                          disabled={busy}
                          onClick={() =>
                            Modal.confirm({
                              title:
                                'Xác nhận đã kiểm tra nội dung và bằng chứng?',
                              content:
                                'Tôi đã kiểm tra nội dung, nguồn bằng chứng và các cảnh báo chất lượng ảnh. Phê duyệt sẽ khóa nội dung phiên bản này.',
                              okText: 'Xác nhận phê duyệt',
                              cancelText: 'Hủy',
                              onOk: () =>
                                run(async () =>
                                  install(
                                    await reportApi.action(report, 'approve'),
                                  ),
                                ),
                            })
                          }
                        >
                          Phê duyệt báo cáo
                        </Button>
                      </>
                    )}
                    {report.canApprove && report.status === 'APPROVED' && (
                      <Button
                        type="primary"
                        loading={busy}
                        onClick={() => act('finalize')}
                      >
                        Chốt phiên bản và tạo PDF
                      </Button>
                    )}
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void run(async () =>
                          setVersions(await reportApi.versions(report.id)),
                        )
                      }
                    >
                      Lịch sử phiên bản
                    </Button>
                  </div>
                  <small>
                    Mô hình AI: {report.model ?? 'Chưa tạo'} · Vai trò:{' '}
                    {formatUserRole(authSession.getUser()?.role)}
                  </small>
                </aside>
              )}
            </div>
          )}
        </>
      )}
      <Modal
        open={!!imagePreview}
        onCancel={() => setImagePreview('')}
        footer={null}
        width={1000}
        title="Ảnh nguồn nhiệm vụ"
      >
        <img
          src={imagePreview || undefined}
          alt="Ảnh bằng chứng nguồn"
          style={{ maxWidth: '100%' }}
        />
      </Modal>
      <Modal
        open={!!pdfPreview}
        onCancel={() => setPdfPreview('')}
        footer={null}
        width={1000}
        title="Xem trước PDF"
      >
        <iframe
          title="Báo cáo PDF"
          src={pdfPreview || undefined}
          style={{ width: '100%', height: '75vh', border: 0 }}
        />
      </Modal>
      <Modal
        open={!!proposal}
        onCancel={() => setProposal(null)}
        title="Đề xuất AI · Chưa áp dụng"
        onOk={() => {
          if (proposal) {
            setUndoEditorial(draft)
            setDraft(proposal)
            setSectionIndex(0)
            setDirty(true)
            setProposal(null)
          }
        }}
        width={1000}
        okButtonProps={{ disabled: busy || JSON.stringify(proposal) === JSON.stringify(draft) }}
        okText="Áp dụng vào bản nháp"
        cancelText="Bỏ đề xuất"
      >
        <p>Phần thay đổi được tô sáng. Chỉ áp dụng khi đã đối chiếu nguồn.</p>
        {editorialWarnings
          .filter(warning => !warning.includes('Chưa có nhận định hiện trường đã xác nhận. Đề xuất chỉ biên tập dữ liệu được cung cấp, không phân tích ảnh/video.'))
          .map((warning, i) => <Alert key={i} type="warning" showIcon message={warning} />)}
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <Button loading={busy} disabled={!report || busy} onClick={() => void run(async () => {
            if (!report) return
            const result = await reportApi.rewrite(report, instruction)
            setProposalMode(instruction)
            setEditorialWarnings(Array.isArray(result.warnings) ? result.warnings.filter(w => typeof w === 'string') : []); setProposal(result.document)
          })}>Tạo lại</Button>
          <Button onClick={() => void navigator.clipboard.writeText(editorialFields(proposal).map(f => `${f.label}\n${f.text}`).join('\n\n')).catch(() => setError('Không sao chép được. Hãy chọn nội dung để sao chép thủ công.'))}>Sao chép đề xuất</Button>
        </div>
        <div className="ir-editorial-compare">
          {editorialFields(proposal).map((field, i) => {
            const before = editorialFields(draft)[i]?.text ?? ''
            if (before === field.text) return null
            return <section key={field.label}>
              <h4>{field.label}</h4>
              <div className="ir-editorial-columns">
                <div><b>Hiện tại</b><p><ChangedText before={before} after={field.text} original /></p></div>
                <div><b>Đề xuất</b><p><ChangedText before={before} after={field.text} /></p></div>
              </div>
              <div className="ir-editorial-explanation">
                <b>Vì sao đề xuất thay đổi?</b>
                <ul>{explainEditorialChange(before, field.text, proposalMode).map((reason, n) => <li key={n}>{reason}</li>)}</ul>
              </div>
            </section>
          })}
          {JSON.stringify(proposal) === JSON.stringify(draft) && <Alert type="info" message="Chưa có thay đổi đạt yêu cầu. Bản gốc được giữ nguyên." />}
        </div>
      </Modal>
      <Modal
        open={versions !== null}
        onCancel={() => setVersions(null)}
        footer={null}
        width={600}
        className="ir-history-modal"
        title={
          <div className="ir-history-header">
            <span className="ir-history-header-icon" aria-hidden="true">
              <HistoryOutlined />
            </span>
            <div className="ir-history-header-text">
              <span className="ir-history-title">
                Lịch sử và nhật ký báo cáo
              </span>
              {versions && versions.length > 0 && (
                <span className="ir-history-count">
                  {versions.length} phiên bản
                </span>
              )}
            </div>
          </div>
        }
      >
        {!versions || versions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có lịch sử phiên bản cho báo cáo này."
          />
        ) : (
          <ol className="ir-history-timeline">
            {versions.map((v, index) => {
              const meta = getVersionActionMeta(v.action)
              const actor = formatVersionActor(v.actor)
              const isCurrent =
                report?.revision === v.revision || index === 0
              return (
                <li
                  key={`${v.revision}-${v.created_at}`}
                  className={`ir-history-item${isCurrent ? ' is-current' : ''}`}
                >
                  <span
                    className={`ir-history-node is-${meta.tone}`}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </span>
                  <div className="ir-history-card">
                    <div className="ir-history-card-top">
                      <div className="ir-history-action-group">
                        <span className="ir-history-rev">v{v.revision}</span>
                        <span className="ir-history-action-label">
                          {meta.label}
                        </span>
                        {isCurrent && (
                          <span className="ir-history-current-badge">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <time
                        className="ir-history-time"
                        dateTime={v.created_at}
                      >
                        <ClockCircleOutlined aria-hidden="true" />
                        <span>{formatVersionTimestamp(v.created_at)}</span>
                      </time>
                    </div>
                    <div className="ir-history-card-meta">
                      <span
                        className={`ir-history-actor${actor.isSystem ? ' is-system' : ''}`}
                        title={actor.rawId || undefined}
                      >
                        {actor.isSystem ? (
                          <RobotOutlined aria-hidden="true" />
                        ) : (
                          <UserOutlined aria-hidden="true" />
                        )}
                        <span>{actor.label}</span>
                        {actor.isCurrentUser && (
                          <span className="ir-history-you-badge">Bạn</span>
                        )}
                      </span>
                      {actor.shortId && (
                        <code
                          className="ir-history-actor-id"
                          title={actor.rawId}
                        >
                          #{actor.shortId}
                        </code>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Modal>
    </section>
  )
}
