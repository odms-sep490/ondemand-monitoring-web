import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
} from 'antd'
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  aiOpsApi,
  type AiEvaluationView,
  type AiIncidentView,
  type AiModelView,
  type AiOpsTab,
  type AiOverviewView,
  type AiSecurityOverviewView,
  type AiTraceView,
  type EvaluationCaseView,
  type EvaluationJobView,
  type JudgeCalibrationView,
  type PromptLabOverview,
  type SupervisorEvaluationView,
} from '../../api/aiOpsApi'
import { adminHref } from '../../routes'
import { PromptManagementWorkspace } from './PromptManagementWorkspace'
import './aiOperations.css'

const TABS: Array<{ id: AiOpsTab; label: string }> = [
  { id: 'overview', label: 'Tổng quan AI' },
  { id: 'models', label: 'Danh mục mô hình' },
  { id: 'services', label: 'Giám sát dịch vụ' },
  { id: 'tracing', label: 'Truy vết AI' },
  { id: 'evaluation', label: 'Đánh giá AI' },
  { id: 'supervisor', label: 'Bộ giám sát AI' },
  { id: 'promptLab', label: 'Quản lý Prompt & GEPA' },
  { id: 'security', label: 'Bảo mật & Rào chắn' },
  { id: 'audit', label: 'Nhật ký kiểm toán' },
  { id: 'incidents', label: 'Quản lý sự cố' },
]

const STATUS_META: Record<string, { label: string; color: string }> = {
  HEALTHY: { label: 'Hoạt động tốt', color: 'green' },
  DEGRADED: { label: 'Suy giảm', color: 'orange' },
  OFFLINE: { label: 'Ngoại tuyến', color: 'red' },
  IDLE: { label: 'Sẵn sàng', color: 'blue' },
  LOADING: { label: 'Đang tải', color: 'gold' },
  DISABLED: { label: 'Đã tắt', color: 'default' },
}

const EXPERIMENT_STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Chờ phê duyệt',
  APPROVED: 'Đã phê duyệt',
  ROLLED_BACK: 'Đã khôi phục',
  REJECTED: 'Đã từ chối',
}

const PROMPT_VERSION_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang áp dụng',
  CANDIDATE: 'Ứng viên',
  ARCHIVED: 'Đã lưu trữ',
  DRAFT: 'Bản nháp',
}

const SEVERITY_LABEL: Record<string, string> = {
  CRITICAL: 'Nghiêm trọng',
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
  WARNING: 'Cảnh báo',
  INFO: 'Thông tin',
  NONE: 'Đạt',
}

const EVAL_STATUS_LABEL: Record<string, string> = {
  EVALUATED: 'Đã đánh giá',
  INSUFFICIENT_EVIDENCE: 'Thiếu bằng chứng',
  PENDING: 'Đang chờ',
}

const VALIDATION_STATUS_LABEL: Record<string, string> = {
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
}

const SECURITY_DECISION_LABEL: Record<string, string> = {
  ALLOW: 'Cho phép',
  BLOCK: 'Đã chặn',
}

const MODEL_TYPE_LABEL: Record<string, string> = {
  LLM: 'LLM',
  COMPUTER_VISION: 'Thị giác máy tính',
  ASR: 'Nhận dạng giọng nói',
  TTS: 'Tổng hợp giọng nói',
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function AiOperationsPage({
  initialTab = 'overview',
}: {
  initialTab?: AiOpsTab
}) {
  const [tab, setTab] = useState<AiOpsTab>(initialTab)
  const [overview, setOverview] = useState<AiOverviewView | null>(null)
  const [traces, setTraces] = useState<AiTraceView[]>([])
  const [evaluations, setEvaluations] = useState<AiEvaluationView[]>([])
  const [security, setSecurity] = useState<AiSecurityOverviewView | null>(null)
  const [incidents, setIncidents] = useState<AiIncidentView[]>([])
  const [supEvals, setSupEvals] = useState<SupervisorEvaluationView[]>([])
  const [calibrations, setCalibrations] = useState<JudgeCalibrationView[]>([])
  const [promptLab, setPromptLab] = useState<PromptLabOverview | null>(null)
  const [evalJobs, setEvalJobs] = useState<EvaluationJobView[]>([])
  const [evalHistory, setEvalHistory] = useState<Array<Record<string, unknown>>>([])
  const [explorerMetric, setExplorerMetric] = useState<string | null>(null)
  const [explorerCases, setExplorerCases] = useState<EvaluationCaseView[]>([])
  const [explorerLoading, setExplorerLoading] = useState(false)
  const [explorerStatus, setExplorerStatus] = useState<string>('ALL')
  const [explorerDifficulty, setExplorerDifficulty] = useState<string>('ALL')
  const [explorerLanguage, setExplorerLanguage] = useState<string>('ALL')
  const [explorerSearch, setExplorerSearch] = useState<string>('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [supSeverityFilter, setSupSeverityFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState('')
  const [error, setError] = useState('')
  const [selectedTraceId, setSelectedTraceId] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [configTarget, setConfigTarget] = useState<AiModelView | null>(null)
  const [configDraft, setConfigDraft] = useState('')
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    severity: 'WARNING',
    modelCode: '',
    serviceEndpoint: '',
    summary: '',
    recommendedAction: '',
  })

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, tr, ev, sec, inc, se, cal, pl, jobs, hist] = await Promise.all([
        aiOpsApi.getOverview(),
        aiOpsApi.listTraces(100),
        aiOpsApi.listEvaluations(),
        aiOpsApi.getSecurity(),
        aiOpsApi.listIncidents('ALL'),
        aiOpsApi.listSupervisorEvaluations().catch(() => []),
        aiOpsApi.listCalibrations().catch(() => []),
        aiOpsApi.getPromptLab().catch(() => null),
        aiOpsApi.listEvaluationJobs().catch(() => []),
        aiOpsApi.listEvaluationHistory(10).catch(() => []),
      ])
      setOverview(ov)
      setTraces(tr)
      if (tr.length > 0 && !selectedTraceId) {
        setSelectedTraceId(tr[0].id)
      }
      setEvaluations(ev)
      setSecurity(sec)
      setIncidents(inc)
      setSupEvals(se)
      setCalibrations(cal)
      setPromptLab(pl)
      setEvalJobs(jobs)
      setEvalHistory(hist)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Không thể tải dữ liệu Trung tâm vận hành AI.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const switchTab = (next: AiOpsTab) => {
    setTab(next)
    const targetHash = adminHref({ screen: 'aiOps', tab: next })
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash)
    }
  }

  const handleToggleModel = async (model: AiModelView, enabled: boolean) => {
    setBusyKey(`toggle:${model.code}`)
    setError('')
    try {
      await aiOpsApi.toggleModel(model.code, enabled)
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể đổi trạng thái model.')
    } finally {
      setBusyKey('')
    }
  }

  const handleProbeModel = async (model: AiModelView) => {
    setBusyKey(`probe:${model.code}`)
    setError('')
    try {
      await aiOpsApi.probeModel(model.code)
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kiểm tra sức khỏe thất bại.')
    } finally {
      setBusyKey('')
    }
  }

  const handleSaveConfig = async () => {
    if (!configTarget) return
    setBusyKey(`config:${configTarget.code}`)
    setError('')
    try {
      const parsed = JSON.parse(configDraft) as Record<string, unknown>
      await aiOpsApi.updateModelConfig(configTarget.code, parsed)
      setConfigTarget(null)
      await loadAll()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'JSON cấu hình không hợp lệ hoặc không thể lưu.',
      )
    } finally {
      setBusyKey('')
    }
  }

  const handleSyncEvaluations = async () => {
    setBusyKey('sync-eval')
    setError('')
    try {
      const [rows, jobs, hist] = await Promise.all([
        aiOpsApi.syncEvaluations(),
        aiOpsApi.listEvaluationJobs().catch(() => []),
        aiOpsApi.listEvaluationHistory(10).catch(() => []),
      ])
      setEvaluations(rows)
      setEvalJobs(jobs)
      setEvalHistory(hist)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể đồng bộ DeepEval.')
    } finally {
      setBusyKey('')
    }
  }

  const handleStartEvalJob = async (
    mode: string,
    metric?: string,
    partition = 'all',
  ) => {
    setBusyKey(`job:${mode}:${metric ?? 'all'}`)
    setError('')
    try {
      await aiOpsApi.startEvaluationJob({ mode, metric, partition, livePerMetric: 2 })
      const jobs = await aiOpsApi.listEvaluationJobs().catch(() => [])
      setEvalJobs(jobs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể khởi chạy tác vụ đánh giá.')
    } finally {
      setBusyKey('')
    }
  }

  const handleCancelEvalJob = async (jobId: string) => {
    setBusyKey(`cancel:${jobId}`)
    setError('')
    try {
      await aiOpsApi.cancelEvaluationJob(jobId)
      const jobs = await aiOpsApi.listEvaluationJobs().catch(() => [])
      setEvalJobs(jobs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể hủy tác vụ.')
    } finally {
      setBusyKey('')
    }
  }

  const loadExplorerCases = async (
    metricName: string,
    status = explorerStatus,
    difficulty = explorerDifficulty,
    language = explorerLanguage,
    search = explorerSearch,
  ) => {
    setExplorerLoading(true)
    try {
      const items = await aiOpsApi.listEvaluationCases({
        metric: metricName,
        status,
        difficulty,
        language,
        search,
        limit: 200,
      })
      setExplorerCases(items)
    } catch {
      setExplorerCases([])
    } finally {
      setExplorerLoading(false)
    }
  }

  const openMetricExplorer = (metricName: string) => {
    setExplorerMetric(metricName)
    setExplorerStatus('ALL')
    setExplorerDifficulty('ALL')
    setExplorerLanguage('ALL')
    setExplorerSearch('')
    void loadExplorerCases(metricName, 'ALL', 'ALL', 'ALL', '')
  }

  const handleExportBenchmark = async () => {
    setBusyKey('export-eval')
    setError('')
    try {
      const data = await aiOpsApi.exportBenchmarkReport()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `odm-ai-benchmark-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xuất báo cáo.')
    } finally {
      setBusyKey('')
    }
  }

  const handleRunCalibration = async () => {
    setBusyKey('run-cal')
    setError('')
    try {
      await aiOpsApi.runCalibration()
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể chạy hiệu chuẩn Judge.')
    } finally {
      setBusyKey('')
    }
  }

  const handleApproveExperiment = (id: string, version: string) => {
    Modal.confirm({
      title: `Phê duyệt và kích hoạt phiên bản ${version}?`,
      content:
        'Hệ thống sẽ lưu trữ phiên bản cũ (có thể rollback) và ghi nhật ký kiểm toán.',
      okText: 'Phê duyệt & kích hoạt',
      cancelText: 'Hủy',
      onOk: async () => {
        setBusyKey(`approve:${id}`)
        setError('')
        try {
          await aiOpsApi.approveExperiment(id)
          await loadAll()
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Không thể phê duyệt prompt.')
        } finally {
          setBusyKey('')
        }
      },
    })
  }

  const handleRollbackExperiment = (id: string, baseline: string) => {
    Modal.confirm({
      title: `Rollback về phiên bản gốc ${baseline}?`,
      content: 'Phiên bản đang chạy sẽ được lưu trữ và khôi phục lại phiên bản gốc.',
      okText: 'Xác nhận Rollback',
      cancelText: 'Hủy',
      onOk: async () => {
        setBusyKey(`rollback:${id}`)
        setError('')
        try {
          await aiOpsApi.rollbackExperiment(id)
          await loadAll()
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Không thể rollback prompt.')
        } finally {
          setBusyKey('')
        }
      },
    })
  }

  const handleCreateIncident = async () => {
    if (!incidentForm.title.trim() || !incidentForm.summary.trim()) {
      setError('Vui lòng nhập tiêu đề và mô tả sự cố.')
      return
    }
    setBusyKey('create-incident')
    setError('')
    try {
      await aiOpsApi.createIncident({
        title: incidentForm.title.trim(),
        severity: incidentForm.severity,
        modelCode: incidentForm.modelCode || undefined,
        serviceEndpoint: incidentForm.serviceEndpoint || undefined,
        summary: incidentForm.summary.trim(),
        recommendedAction: incidentForm.recommendedAction.trim() || undefined,
      })
      setIncidentOpen(false)
      setIncidentForm({
        title: '',
        severity: 'WARNING',
        modelCode: '',
        serviceEndpoint: '',
        summary: '',
        recommendedAction: '',
      })
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tạo sự cố.')
    } finally {
      setBusyKey('')
    }
  }

  const handleResolveIncident = async (id: string) => {
    setBusyKey(`resolve:${id}`)
    setError('')
    try {
      await aiOpsApi.resolveIncident(id)
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể xử lý sự cố.')
    } finally {
      setBusyKey('')
    }
  }

  const selectedTrace = useMemo(
    () => traces.find((t) => t.id === selectedTraceId) ?? traces[0] ?? null,
    [traces, selectedTraceId],
  )

  const filteredAudits = useMemo(() => {
    const q = auditSearch.trim().toLowerCase()
    if (!q) return traces
    return traces.filter((t) =>
      [t.traceId, t.modelCode, t.feature, t.userRole, t.resourceId, t.validationStatus]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [traces, auditSearch])

  const maxVolume = useMemo(
    () =>
      Math.max(
        1,
        ...(overview?.volumeSeries ?? []).map((p) => p.requests),
      ),
    [overview],
  )

  return (
    <div className="aiops-page">
      <header className="aiops-header">
        <div>
          <div className="aiops-header-title-row">
            <h1>Trung tâm Vận hành &amp; Quản trị AI</h1>
            {overview && overview.openIncidents > 0 ? (
              <Tag color="red" icon={<WarningOutlined />}>
                {overview.openIncidents} cảnh báo đang mở
              </Tag>
            ) : (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Hệ thống ổn định
              </Tag>
            )}
          </div>
          <p className="aiops-subtitle">
            Trung tâm vận hành, giám sát, kiểm định chất lượng và kiểm toán AI nội bộ · OnDemand Monitor
          </p>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void loadAll()}
          >
            Làm mới trực tiếp
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIncidentOpen(true)}
          >
            Ghi nhận sự cố
          </Button>
        </Space>
      </header>

      <nav className="aiops-tabs" role="tablist" aria-label="Phân hệ quản trị AI">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`aiops-tab${tab === item.id ? ' is-active' : ''}`}
            onClick={() => switchTab(item.id)}
          >
            <span>{item.label}</span>
            {item.id === 'incidents' && (overview?.openIncidents ?? 0) > 0 && (
              <span className="aiops-tab-badge">{overview?.openIncidents}</span>
            )}
          </button>
        ))}
      </nav>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          closable
          onClose={() => setError('')}
        />
      )}

      {loading && !overview ? (
        <div className="aiops-loading">
          <Spin size="large" />
          <p>Đang thu thập trạng thái AI Workers, Ollama và dữ liệu kiểm toán…</p>
        </div>
      ) : null}

      {overview && tab === 'overview' && (
        <div className="aiops-stack">
          <section className="aiops-kpi-grid" aria-label="Chỉ số tổng quan AI">
            <div className="aiops-kpi-card">
              <span>Mô hình AI đã đăng ký</span>
              <strong>{overview.totalModels}</strong>
              <small>
                {overview.activeModels} sẵn sàng · {overview.degradedModels} lỗi/ngoại tuyến
              </small>
            </div>
            <div className="aiops-kpi-card">
              <span>Lượt gọi AI hôm nay</span>
              <strong>{overview.requestsToday}</strong>
              <small>Tổng {traces.length} bản ghi truy vết gần nhất</small>
            </div>
            <div className="aiops-kpi-card">
              <span>Tỷ lệ thành công</span>
              <strong className={overview.successRatePercent >= 95 ? 'is-ok' : 'is-warn'}>
                {overview.successRatePercent.toFixed(1)}%
              </strong>
              <small>Tính trên toàn bộ lượt chạy đã ghi nhận</small>
            </div>
            <div className="aiops-kpi-card">
              <span>Độ trễ P95</span>
              <strong>
                {overview.p95LatencyMs > 0
                  ? `${(overview.p95LatencyMs / 1000).toFixed(2)}s`
                  : '—'}
              </strong>
              <small>Thời gian xử lý phân vị 95%</small>
            </div>
          </section>

          <div className="aiops-two-col">
            <section className="aiops-panel">
              <div className="aiops-panel-head">
                <h2>Tình trạng mô hình AI</h2>
                <Button size="small" onClick={() => switchTab('models')}>
                  Quản lý danh mục
                </Button>
              </div>
              <div className="aiops-model-list">
                {overview.models.map((m) => {
                  const meta = STATUS_META[m.status] ?? {
                    label: m.status,
                    color: 'default',
                  }
                  return (
                    <div key={m.code} className="aiops-model-row">
                      <div>
                        <strong>{m.name}</strong>
                        <small>
                          {MODEL_TYPE_LABEL[m.modelType] ?? m.modelType} · {m.capability}
                        </small>
                      </div>
                      <Tag color={meta.color}>{meta.label}</Tag>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="aiops-panel">
              <div className="aiops-panel-head">
                <h2>Tài nguyên hệ thống &amp; Lưu lượng 7 ngày</h2>
                <small>{overview.resources.osName}</small>
              </div>
              <div className="aiops-resource-bars">
                <div className="aiops-meter">
                  <div>
                    <span>CPU ({overview.resources.availableProcessors} nhân)</span>
                    <strong>{overview.resources.cpuUsagePercent.toFixed(1)}%</strong>
                  </div>
                  <div className="aiops-track">
                    <span style={{ width: `${Math.min(100, overview.resources.cpuUsagePercent)}%` }} />
                  </div>
                </div>
                <div className="aiops-meter">
                  <div>
                    <span>
                      RAM ({overview.resources.memoryUsedMb.toLocaleString('vi-VN')} /{' '}
                      {overview.resources.memoryTotalMb.toLocaleString('vi-VN')} MB)
                    </span>
                    <strong>{overview.resources.memoryUsagePercent.toFixed(1)}%</strong>
                  </div>
                  <div className="aiops-track">
                    <span style={{ width: `${Math.min(100, overview.resources.memoryUsagePercent)}%` }} />
                  </div>
                </div>
                <div className="aiops-meter">
                  <div>
                    <span>
                      JVM Heap ({overview.resources.jvmHeapUsedMb} /{' '}
                      {overview.resources.jvmHeapMaxMb} MB)
                    </span>
                    <strong>
                      {overview.resources.jvmHeapMaxMb > 0
                        ? `${Math.round((overview.resources.jvmHeapUsedMb * 100) / overview.resources.jvmHeapMaxMb)}%`
                        : '0%'}
                    </strong>
                  </div>
                  <div className="aiops-track">
                    <span
                      style={{
                        width: `${overview.resources.jvmHeapMaxMb > 0 ? Math.min(100, Math.round((overview.resources.jvmHeapUsedMb * 100) / overview.resources.jvmHeapMaxMb)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="aiops-volume-chart" aria-label="Biểu đồ lưu lượng request 7 ngày">
                {overview.volumeSeries.map((pt) => (
                  <div key={pt.day} className="aiops-bar-col">
                    <div className="aiops-bar-wrap">
                      <div
                        className="aiops-bar-req"
                        style={{ height: `${Math.max(4, Math.round((pt.requests / maxVolume) * 100))}%` }}
                        title={`${pt.day}: ${pt.requests} requests, ${pt.errors} lỗi`}
                      />
                      {pt.errors > 0 && (
                        <div
                          className="aiops-bar-err"
                          style={{ height: `${Math.max(6, Math.round((pt.errors / maxVolume) * 100))}%` }}
                        />
                      )}
                    </div>
                    <small>{pt.day}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {overview.activeIncidents.length > 0 && (
            <section className="aiops-panel">
              <div className="aiops-panel-head">
                <h2>Sự cố đang mở ({overview.activeIncidents.length})</h2>
                <Button size="small" onClick={() => switchTab('incidents')}>
                  Xem tất cả
                </Button>
              </div>
              <div className="aiops-incident-list">
                {overview.activeIncidents.slice(0, 3).map((inc) => (
                  <div key={inc.id} className="aiops-incident-card is-open">
                    <div>
                      <Space size={8}>
                        <Tag color={inc.severity === 'CRITICAL' ? 'red' : 'orange'}>
                          {inc.severity}
                        </Tag>
                        <strong>{inc.title}</strong>
                      </Space>
                      <p>{inc.summary}</p>
                      {inc.recommendedAction && (
                        <small>Khuyến nghị: {inc.recommendedAction}</small>
                      )}
                    </div>
                    <Button
                      size="small"
                      loading={busyKey === `resolve:${inc.id}`}
                      onClick={() => void handleResolveIncident(inc.id)}
                    >
                      Đánh dấu đã xử lý
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {overview && tab === 'models' && (
        <section className="aiops-panel">
          <div className="aiops-panel-head">
            <div>
              <h2>Danh mục mô hình AI &amp; Công tắc khẩn cấp</h2>
              <small>
                Quản lý phiên bản, nguồn gốc, giấy phép, bật/tắt tính năng AI và cấu hình an toàn (không cho phép thực thi lệnh hệ thống).
              </small>
            </div>
          </div>
          <div className="aiops-table-wrap">
            <table className="aiops-table">
              <thead>
                <tr>
                  <th>Mô hình</th>
                  <th>Loại &amp; Nhiệm vụ</th>
                  <th>Môi trường / Thiết bị</th>
                  <th>Nguồn &amp; Giấy phép</th>
                  <th>Trạng thái</th>
                  <th>Bật / Tắt</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {overview.models.map((m) => {
                  const meta = STATUS_META[m.status] ?? {
                    label: m.status,
                    color: 'default',
                  }
                  return (
                    <tr key={m.code}>
                      <td>
                        <strong>{m.name}</strong>
                        <div className="aiops-cell-sub">
                          {m.code} · {m.version} · {m.modelSize}
                        </div>
                      </td>
                      <td>
                        <div>{MODEL_TYPE_LABEL[m.modelType] ?? m.modelType}</div>
                        <div className="aiops-cell-sub">{m.capability}</div>
                      </td>
                      <td>
                        <div>{m.runtime}</div>
                        <div className="aiops-cell-sub">
                          {m.device} · {m.endpoint}
                        </div>
                      </td>
                      <td>
                        <div>{m.source}</div>
                        <div className="aiops-cell-sub">
                          {m.license} · SHA: {m.checksumSha256}
                        </div>
                      </td>
                      <td>
                        <Tag color={meta.color}>{meta.label}</Tag>
                      </td>
                      <td>
                        <Switch
                          checked={m.enabled}
                          loading={busyKey === `toggle:${m.code}`}
                          checkedChildren="Bật"
                          unCheckedChildren="Tắt"
                          onChange={(checked) => void handleToggleModel(m, checked)}
                        />
                      </td>
                      <td>
                        <Space size={6}>
                          <Button
                            size="small"
                            icon={<ApiOutlined />}
                            loading={busyKey === `probe:${m.code}`}
                            onClick={() => void handleProbeModel(m)}
                          >
                            Kiểm tra
                          </Button>
                          <Button
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={() => {
                              setConfigTarget(m)
                              setConfigDraft(JSON.stringify(m.config ?? {}, null, 2))
                            }}
                          >
                            Cấu hình
                          </Button>
                        </Space>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {overview && tab === 'services' && (
        <div className="aiops-stack">
          <section className="aiops-service-grid">
            {overview.services.map((svc) => {
              const meta = STATUS_META[svc.status] ?? {
                label: svc.status,
                color: 'default',
              }
              return (
                <article key={svc.code} className="aiops-service-card">
                  <div className="aiops-panel-head">
                    <Space size={8}>
                      <CloudServerOutlined />
                      <strong>{svc.name}</strong>
                    </Space>
                    <Tag color={meta.color}>{meta.label}</Tag>
                  </div>
                  <div className="aiops-service-meta">
                    <span>Địa chỉ dịch vụ: <code>{svc.endpoint}</code></span>
                    <span>Độ trễ phản hồi: <strong>{svc.latencyMs} ms</strong></span>
                    <span>Chi tiết: {svc.detail}</span>
                    <span>Kiểm tra lúc: {formatTime(svc.checkedAt)}</span>
                  </div>
                  {svc.loadedModels.length > 0 && (
                    <div className="aiops-loaded-models">
                      <small>Mô hình đang nạp trên Ollama:</small>
                      <div className="aiops-tag-wrap">
                        {svc.loadedModels.map((name) => (
                          <Tag key={name} color="blue">
                            {name}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        </div>
      )}

      {tab === 'tracing' && (
        <div className="aiops-trace-layout">
          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <h2>Danh sách truy vết ({traces.length})</h2>
            </div>
            {traces.length === 0 ? (
              <Empty description="Chưa có bản ghi truy vết AI nào." />
            ) : (
              <div className="aiops-trace-list">
                {traces.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    className={`aiops-trace-item${selectedTrace?.id === tr.id ? ' is-selected' : ''}`}
                    onClick={() => setSelectedTraceId(tr.id)}
                  >
                    <div className="aiops-trace-item-top">
                      <strong>{tr.traceId}</strong>
                      <Tag color={tr.httpStatus < 400 ? 'green' : 'red'}>
                        HTTP {tr.httpStatus}
                      </Tag>
                    </div>
                    <div className="aiops-trace-item-mid">{tr.feature}</div>
                    <small>
                      {tr.modelCode} · {tr.durationMs} ms · {formatTime(tr.createdAt)}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="aiops-panel">
            {selectedTrace ? (
              <div className="aiops-stack">
                <div className="aiops-panel-head">
                  <div>
                    <h2>Truy vết #{selectedTrace.traceId}</h2>
                    <small>{selectedTrace.feature}</small>
                  </div>
                  <Space>
                    <Tag color={selectedTrace.httpStatus < 400 ? 'green' : 'red'}>
                      HTTP {selectedTrace.httpStatus}
                    </Tag>
                    <Tag color="blue">{selectedTrace.durationMs} ms</Tag>
                  </Space>
                </div>

                <dl className="aiops-kv-grid">
                  <div>
                    <dt>Mô hình</dt>
                    <dd>{selectedTrace.modelCode} ({selectedTrace.modelVersion || 'v1'})</dd>
                  </div>
                  <div>
                    <dt>Tài nguyên</dt>
                    <dd>{selectedTrace.resourceId || '—'}</dd>
                  </div>
                  <div>
                    <dt>Người yêu cầu</dt>
                    <dd>{selectedTrace.userRole}</dd>
                  </div>
                  <div>
                    <dt>Thiết bị suy luận</dt>
                    <dd>{selectedTrace.inferenceDevice}</dd>
                  </div>
                  <div>
                    <dt>Dự phòng</dt>
                    <dd>{selectedTrace.fallbackUsed ? 'Có' : 'Không'}</dd>
                  </div>
                  <div>
                    <dt>Kiểm định đầu ra</dt>
                    <dd>{VALIDATION_STATUS_LABEL[selectedTrace.validationStatus] ?? selectedTrace.validationStatus}</dd>
                  </div>
                </dl>

                <div className="aiops-spans">
                  <h3>Chi tiết từng bước xử lý</h3>
                  {selectedTrace.spans.length === 0 ? (
                    <small>Không có chi tiết span cho lượt chạy này.</small>
                  ) : (
                    selectedTrace.spans.map((sp, i) => {
                      const total = Math.max(1, selectedTrace.durationMs)
                      const pct = Math.max(4, Math.min(100, Math.round((sp.durationMs / total) * 100)))
                      return (
                        <div key={`${sp.name}-${i}`} className="aiops-span-row">
                          <div className="aiops-span-head">
                            <span>{sp.name}</span>
                            <strong>{sp.durationMs} ms</strong>
                          </div>
                          <div className="aiops-track">
                            <span
                              className={sp.status === 'ERROR' ? 'is-danger' : ''}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              <Empty description="Chọn một Trace bên trái để xem chi tiết." />
            )}
          </section>
        </div>
      )}

      {tab === 'evaluation' && (() => {
        const coreMetrics = evaluations.filter((e) => (e.suiteGroup || 'core') === 'core')
        const suppMetrics = evaluations.filter((e) => e.suiteGroup === 'supplementary')
        const totalCasesAll = evaluations.reduce((acc, e) => acc + e.totalCases, 0)
        const totalPassedAll = evaluations.reduce((acc, e) => acc + e.passedCases, 0)
        const totalErrorsAll = evaluations.reduce((acc, e) => acc + (e.errorCases || 0), 0)
        const renderMetricCard = (ev: AiEvaluationView) => {
          const passRate =
            typeof ev.passRate === 'number' && ev.passRate > 0
              ? ev.passRate
              : ev.totalCases > 0
                ? Math.round((ev.passedCases * 1000) / ev.totalCases) / 10
                : 0
          return (
            <article
              key={ev.id}
              className="aiops-eval-card is-clickable"
              onClick={() => openMetricExplorer(ev.metricName)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openMetricExplorer(ev.metricName)
                }
              }}
            >
              <div className="aiops-panel-head">
                <strong>{ev.metricName}</strong>
                <Tag color={ev.passed ? 'green' : ev.errorCases > 0 ? 'red' : 'orange'}>
                  {ev.passed ? 'Đạt mục tiêu' : ev.errorCases > 0 ? 'Có lỗi chấm' : 'Chưa đạt'}
                </Tag>
              </div>
              <div className="aiops-eval-dual">
                <div>
                  <small>Điểm trung bình</small>
                  <strong className="aiops-eval-big">{ev.score.toFixed(1)}%</strong>
                </div>
                <div>
                  <small>Tỷ lệ đạt (Pass Rate)</small>
                  <strong className="aiops-eval-big is-secondary">{passRate.toFixed(1)}%</strong>
                </div>
                <div className="aiops-eval-target">
                  <small>Mục tiêu ≥ {ev.targetScore.toFixed(0)}%</small>
                  {ev.baselineDelta !== null && ev.baselineDelta !== undefined && (
                    <Tag color={ev.baselineDelta >= 0 ? 'green' : 'red'}>
                      {ev.baselineDelta >= 0 ? '+' : ''}
                      {ev.baselineDelta.toFixed(1)}% vs baseline
                    </Tag>
                  )}
                </div>
              </div>
              <div className="aiops-track">
                <span
                  className={ev.passed ? 'is-ok' : 'is-warn'}
                  style={{ width: `${Math.min(100, Math.max(0, ev.score))}%` }}
                />
              </div>
              <small>
                {ev.passedCases}/{ev.totalCases} đạt · {ev.failedCases} lỗi · {ev.errorCases || 0} lỗi Judge
                {ev.liveScored > 0 ? ` · Live LLM: ${ev.livePassed}/${ev.liveScored}` : ''}
              </small>
              <small>
                Dataset: {ev.datasetVersion || 'v1'} · Judge: {ev.judgeModel || 'qwen3:4b'} · Prompt:{' '}
                {ev.promptVersion || 'v1'}
              </small>
              <div className="aiops-eval-card-foot">
                <span>{ev.avgLatencyMs > 0 ? `Độ trễ TB: ${ev.avgLatencyMs} ms` : 'Bấm để mở Test Case Explorer'}</span>
                <Button
                  size="small"
                  type="link"
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleStartEvalJob('METRIC', ev.metricName, 'all')
                  }}
                >
                  Chạy metric này
                </Button>
              </div>
            </article>
          )
        }
        return (
          <div className="aiops-stack">
            <section className="aiops-panel">
              <div className="aiops-panel-head">
                <div>
                  <h2>
                    <ExperimentOutlined /> Trung tâm đánh giá AI (DeepEval)
                  </h2>
                  <small>
                    Tổng {totalCasesAll} test case ({totalPassedAll} đạt · {totalErrorsAll} lỗi chấm). Điểm trung bình và Tỷ lệ đạt luôn được tách biệt minh bạch.
                  </small>
                </div>
                <Space wrap>
                  <Button
                    type="primary"
                    loading={busyKey === 'job:ALL:all'}
                    onClick={() => void handleStartEvalJob('ALL', undefined, 'all')}
                  >
                    Chạy tất cả
                  </Button>
                  <Button
                    loading={busyKey === 'job:REGRESSION:all'}
                    onClick={() => void handleStartEvalJob('REGRESSION', undefined, 'held_out')}
                  >
                    Chạy Held-out Regression
                  </Button>
                  <Button onClick={() => setHistoryOpen(true)}>
                    So sánh lịch sử ({evalHistory.length})
                  </Button>
                  <Button
                    loading={busyKey === 'export-eval'}
                    onClick={() => void handleExportBenchmark()}
                  >
                    Xuất báo cáo JSON
                  </Button>
                  <Button
                    icon={<SyncOutlined />}
                    loading={busyKey === 'sync-eval'}
                    onClick={() => void handleSyncEvaluations()}
                  >
                    Đồng bộ kết quả DeepEval
                  </Button>
                </Space>
              </div>

              {evalJobs.length > 0 && (
                <div className="aiops-jobs-strip">
                  <strong>Tác vụ đánh giá gần nhất:</strong>{' '}
                  {evalJobs.slice(0, 3).map((j) => (
                    <Tag
                      key={j.id}
                      color={
                        j.status === 'COMPLETED'
                          ? 'green'
                          : j.status === 'RUNNING' || j.status === 'QUEUED'
                            ? 'processing'
                            : j.status === 'CANCELLED'
                              ? 'default'
                              : 'red'
                      }
                    >
                      {j.mode} ({j.partition}) · {j.status} · {j.completedCases}/{j.totalCases}
                      {(j.status === 'RUNNING' || j.status === 'QUEUED') && (
                        <Button
                          size="small"
                          type="link"
                          danger
                          onClick={() => void handleCancelEvalJob(j.id)}
                        >
                          Hủy
                        </Button>
                      )}
                    </Tag>
                  ))}
                </div>
              )}

              {evaluations.length === 0 ? (
                <Empty description="Chưa có dữ liệu benchmark. Bấm 'Đồng bộ kết quả DeepEval' để nạp từ .ai-runtime/deepeval." />
              ) : (
                <>
                  <h3 className="aiops-section-sub">9 Metric Cốt Lõi (Core DeepEval Suite · {coreMetrics.reduce((s, e) => s + e.totalCases, 0)} cases)</h3>
                  <div className="aiops-eval-grid">
                    {coreMetrics.map(renderMetricCard)}
                  </div>
                  {suppMetrics.length > 0 && (
                    <>
                      <h3 className="aiops-section-sub" style={{ marginTop: 20 }}>
                        12 Bộ Kiểm Thử Bổ Sung — Bảo mật, Ngôn ngữ, Bộ nhớ & Tuân thủ ({suppMetrics.reduce((s, e) => s + e.totalCases, 0)} cases)
                      </h3>
                      <div className="aiops-eval-grid">
                        {suppMetrics.map(renderMetricCard)}
                      </div>
                    </>
                  )}
                </>
              )}
            </section>

            <Modal
              open={explorerMetric !== null}
              onCancel={() => setExplorerMetric(null)}
              footer={null}
              width={980}
              title={`Test Case Explorer · ${explorerMetric ?? ''}`}
            >
              <div className="aiops-explorer-filters">
                <Input.Search
                  placeholder="Tìm mã case, category, câu hỏi, lý do..."
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  onSearch={(val) =>
                    explorerMetric &&
                    void loadExplorerCases(explorerMetric, explorerStatus, explorerDifficulty, explorerLanguage, val)
                  }
                  style={{ maxWidth: 280 }}
                />
                <Select
                  value={explorerStatus}
                  onChange={(v) => {
                    setExplorerStatus(v)
                    if (explorerMetric) void loadExplorerCases(explorerMetric, v, explorerDifficulty, explorerLanguage, explorerSearch)
                  }}
                  options={[
                    { value: 'ALL', label: 'Mọi trạng thái' },
                    { value: 'PASSED', label: 'Đạt (PASSED)' },
                    { value: 'FAILED', label: 'Lỗi (FAILED)' },
                    { value: 'EVALUATION_ERROR', label: 'Lỗi chấm (ERROR)' },
                  ]}
                  style={{ width: 160 }}
                />
                <Select
                  value={explorerDifficulty}
                  onChange={(v) => {
                    setExplorerDifficulty(v)
                    if (explorerMetric) void loadExplorerCases(explorerMetric, explorerStatus, v, explorerLanguage, explorerSearch)
                  }}
                  options={[
                    { value: 'ALL', label: 'Mọi độ khó' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                  style={{ width: 130 }}
                />
                <Select
                  value={explorerLanguage}
                  onChange={(v) => {
                    setExplorerLanguage(v)
                    if (explorerMetric) void loadExplorerCases(explorerMetric, explorerStatus, explorerDifficulty, v, explorerSearch)
                  }}
                  options={[
                    { value: 'ALL', label: 'Mọi ngôn ngữ' },
                    { value: 'vi', label: 'Tiếng Việt' },
                    { value: 'en', label: 'English' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                  style={{ width: 135 }}
                />
              </div>
              {explorerLoading ? (
                <div style={{ padding: 32, textAlign: 'center' }}><Spin /></div>
              ) : explorerCases.length === 0 ? (
                <Empty description="Không có test case khớp bộ lọc." />
              ) : (
                <div className="aiops-explorer-list">
                  {explorerCases.map((c) => (
                    <div key={c.testCaseId} className="aiops-explorer-item">
                      <div className="aiops-panel-head">
                        <Space wrap>
                          <code>{c.testCaseId}</code>
                          <Tag color={c.status === 'PASSED' ? 'green' : c.status === 'FAILED' ? 'orange' : 'red'}>
                            {c.status}
                          </Tag>
                          <Tag>{c.partition}</Tag>
                          <Tag>{c.difficulty}</Tag>
                          <Tag>{c.language}</Tag>
                          <Tag color="blue">{c.evaluationMode}</Tag>
                        </Space>
                        <strong>
                          {c.score !== null ? `${Math.round(c.score * 100)}%` : 'ERR'}
                          {c.latencyMs ? ` · ${c.latencyMs}ms` : ''}
                        </strong>
                      </div>
                      <p><strong>Input ({c.turnsCount} lượt):</strong> {c.input}</p>
                      <p><strong>Kỳ vọng:</strong> {c.expectedBehavior}</p>
                      <p><strong>Thực tế:</strong> {c.actualOutput}</p>
                      <p><strong>Lý do đánh giá:</strong> {c.judgeReason}</p>
                      {c.rootCause && c.rootCause !== 'NONE' && (
                        <Tag color="volcano">Nguyên nhân: {c.rootCause}</Tag>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Modal>

            <Modal
              open={historyOpen}
              onCancel={() => setHistoryOpen(false)}
              footer={null}
              width={860}
              title="So sánh lịch sử các đợt đánh giá (Evaluation Runs)"
            >
              {evalHistory.length === 0 ? (
                <Empty description="Chưa có lịch sử đánh giá." />
              ) : (
                <div className="aiops-explorer-list">
                  {evalHistory.map((h, i) => (
                    <div key={String(h.runId ?? i)} className="aiops-explorer-item">
                      <div className="aiops-panel-head">
                        <strong>{String(h.runId ?? `Run #${i + 1}`)}</strong>
                        <Space>
                          <Tag color="blue">{String(h.partition ?? 'all')}</Tag>
                          <Tag>{String(h.datasetVersion ?? 'v2.0.0')}</Tag>
                          <Tag color="purple">Judge: {String(h.judgeModel ?? '')}</Tag>
                        </Space>
                      </div>
                      <small>
                        Tổng: {String(h.totalCases ?? 0)} cases (Live LLM: {String(h.liveInferenceCases ?? 0)}) · Đạt:{' '}
                        {String(h.passedCases ?? 0)} · Lỗi: {String(h.failedCases ?? 0)} · Lỗi chấm:{' '}
                        {String(h.errorCases ?? 0)} · Prompt: {String(h.promptVersion ?? '')} · Lúc:{' '}
                        {formatTime(String(h.evaluatedAt ?? ''))}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </Modal>
          </div>
        )
      })()}

      {tab === 'supervisor' && (
        <div className="aiops-stack">
          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <div>
                <h2>Hiệu chuẩn bộ chấm điểm AI</h2>
                <small>
                  Kiểm thử độ đồng thuận, dương tính giả (FP), âm tính giả (FN) và tỷ lệ từ chối chấm khi thiếu bằng chứng.
                </small>
              </div>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                loading={busyKey === 'run-cal'}
                onClick={() => void handleRunCalibration()}
              >
                Chạy hiệu chuẩn
              </Button>
            </div>
            {calibrations.length === 0 ? (
              <Empty description="Chưa có lần hiệu chuẩn nào. Bấm 'Chạy hiệu chuẩn' để kiểm định bộ giám sát AI." />
            ) : (
              <div className="aiops-kpi-grid">
                <div className="aiops-kpi-card">
                  <span>Độ đồng thuận</span>
                  <strong className={calibrations[0].agreementRate >= 90 ? 'is-ok' : 'is-warn'}>
                    {calibrations[0].agreementRate.toFixed(1)}%
                  </strong>
                  <small>
                    {calibrations[0].totalCases} ca chuẩn · {calibrations[0].datasetVersion}
                  </small>
                </div>
                <div className="aiops-kpi-card">
                  <span>Dương tính giả / Âm tính giả</span>
                  <strong>
                    {calibrations[0].falsePositives} / {calibrations[0].falseNegatives}
                  </strong>
                  <small>Mô hình chấm: {calibrations[0].judgeModel}</small>
                </div>
                <div className="aiops-kpi-card">
                  <span>Tỷ lệ từ chối chấm (thiếu nguồn)</span>
                  <strong>{calibrations[0].abstentionRate.toFixed(1)}%</strong>
                  <small>Không ép điểm 0 khi thiếu dữ liệu đối chiếu</small>
                </div>
                <div className="aiops-kpi-card">
                  <span>Phiên bản bộ tiêu chí</span>
                  <strong style={{ fontSize: 16 }}>{calibrations[0].rubricVersion}</strong>
                  <small>{formatTime(calibrations[0].createdAt)}</small>
                </div>
              </div>
            )}
          </section>

          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <div>
                <h2>Kết quả đánh giá từ Bộ giám sát AI ({supEvals.length})</h2>
                <small>
                  Kết hợp lớp kiểm tra quy tắc cố định và mô hình chấm độc lập. Vi phạm ràng buộc cứng không bao giờ bị ghi đè bởi điểm LLM.
                </small>
              </div>
              <Select
                value={supSeverityFilter}
                onChange={setSupSeverityFilter}
                style={{ width: 180 }}
                options={[
                  { value: 'ALL', label: 'Tất cả mức độ' },
                  { value: 'CRITICAL', label: 'Nghiêm trọng' },
                  { value: 'HIGH', label: 'Cao' },
                  { value: 'MEDIUM', label: 'Trung bình' },
                  { value: 'LOW', label: 'Thấp' },
                  { value: 'NONE', label: 'Đạt' },
                ]}
              />
            </div>
            {supEvals.length === 0 ? (
              <Empty description="Chưa có bản ghi đánh giá nào. Hãy chạy hiệu chuẩn để tạo dữ liệu kiểm định đầu tiên." />
            ) : (
              <div className="aiops-table-wrap">
                <table className="aiops-table">
                  <thead>
                    <tr>
                      <th>Mã truy vết / Mô hình</th>
                      <th>Trạng thái</th>
                      <th>Điểm chất lượng</th>
                      <th>Mức độ</th>
                      <th>Vi phạm ràng buộc cứng</th>
                      <th>Nguyên nhân nghi ngờ</th>
                      <th>Duyệt người</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supEvals
                      .filter(
                        (e) =>
                          supSeverityFilter === 'ALL' ||
                          e.severity === supSeverityFilter,
                      )
                      .map((e) => (
                        <tr key={e.evaluationId}>
                          <td>
                            <code>{e.traceId}</code>
                            <div className="aiops-cell-sub">
                              {e.targetModel} · Chấm bởi: {e.judgeModel}
                            </div>
                          </td>
                          <td>
                            <Tag
                              color={
                                e.evaluationStatus === 'EVALUATED'
                                  ? 'green'
                                  : e.evaluationStatus === 'INSUFFICIENT_EVIDENCE'
                                    ? 'gold'
                                    : 'blue'
                              }
                            >
                              {EVAL_STATUS_LABEL[e.evaluationStatus] ?? e.evaluationStatus}
                            </Tag>
                          </td>
                          <td>
                            <strong>
                              {e.qualityScore != null ? `${e.qualityScore.toFixed(1)}%` : '—'}
                            </strong>
                          </td>
                          <td>
                            <Tag
                              color={
                                e.severity === 'CRITICAL'
                                  ? 'red'
                                  : e.severity === 'HIGH'
                                    ? 'volcano'
                                    : e.severity === 'MEDIUM'
                                      ? 'orange'
                                      : 'green'
                              }
                            >
                              {SEVERITY_LABEL[e.severity] ?? e.severity}
                            </Tag>
                          </td>
                          <td>
                            {e.hardConstraintViolations.length === 0 ? (
                              <span className="aiops-cell-sub">Không có</span>
                            ) : (
                              e.hardConstraintViolations.map((v) => (
                                <Tag key={v} color="red">
                                  {v}
                                </Tag>
                              ))
                            )}
                          </td>
                          <td>{e.suspectedRootCause}</td>
                          <td>
                            <Tag color={e.humanReviewRequired ? 'orange' : 'green'}>
                              {e.humanReviewRequired ? 'Cần duyệt' : 'Đạt chuẩn'}
                            </Tag>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'promptLab' && (
        <div className="aiops-stack">
          <PromptManagementWorkspace />
          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <div>
                <h2>Phòng tối ưu Prompt (GEPA · Đa mục tiêu Pareto)</h2>
                <small>
                  So sánh Bản gốc và Ứng viên theo 4 mục tiêu: Chất lượng, Token, Độ trễ và Tỷ lệ lỗi. Không bao giờ tự động kích hoạt khi chưa có Quản trị viên phê duyệt.
                </small>
              </div>
            </div>
            {!promptLab || promptLab.experiments.length === 0 ? (
              <Empty description="Chưa có thí nghiệm tối ưu prompt nào." />
            ) : (
              <div className="aiops-incident-list">
                {promptLab.experiments.map((exp) => (
                  <div key={exp.id} className="aiops-incident-card">
                    <div style={{ flex: 1 }}>
                      <Space size={8} wrap>
                        <code>{exp.promptKey}</code>
                        <Tag color="default">Bản gốc: {exp.baselineVersion}</Tag>
                        <Tag color="blue">Ứng viên: {exp.candidateVersion}</Tag>
                        <Tag
                          color={
                            exp.status === 'APPROVED'
                              ? 'green'
                              : exp.status === 'ROLLED_BACK'
                                ? 'orange'
                                : 'gold'
                          }
                        >
                          {EXPERIMENT_STATUS_LABEL[exp.status] ?? exp.status}
                        </Tag>
                        {exp.hardConstraintViolations > 0 && (
                          <Tag color="red">
                            {exp.hardConstraintViolations} vi phạm ràng buộc cứng (Loại)
                          </Tag>
                        )}
                      </Space>
                      {exp.notes && <p>{exp.notes}</p>}
                      <dl className="aiops-kv-grid" style={{ marginTop: 10 }}>
                        <div>
                          <dt>Chất lượng</dt>
                          <dd>
                            {exp.baselineQuality.toFixed(1)}% →{' '}
                            <strong>{exp.candidateQuality.toFixed(1)}%</strong>
                          </dd>
                        </div>
                        <div>
                          <dt>Token trung bình</dt>
                          <dd>
                            {exp.baselineTokens} → <strong>{exp.candidateTokens}</strong>
                          </dd>
                        </div>
                        <div>
                          <dt>Độ trễ / Tỷ lệ lỗi</dt>
                          <dd>
                            {exp.baselineLatencyMs}ms → {exp.candidateLatencyMs}ms ·{' '}
                            {(exp.candidateErrorRate * 100).toFixed(1)}%
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <Space direction="vertical">
                      {exp.status === 'PENDING_APPROVAL' && (
                        <Button
                          type="primary"
                          size="small"
                          disabled={exp.hardConstraintViolations > 0}
                          loading={busyKey === `approve:${exp.id}`}
                          onClick={() =>
                            handleApproveExperiment(exp.id, exp.candidateVersion)
                          }
                        >
                          Phê duyệt &amp; kích hoạt
                        </Button>
                      )}
                      {exp.status === 'APPROVED' && (
                        <Button
                          danger
                          size="small"
                          loading={busyKey === `rollback:${exp.id}`}
                          onClick={() =>
                            handleRollbackExperiment(exp.id, exp.baselineVersion)
                          }
                        >
                          Khôi phục về {exp.baselineVersion}
                        </Button>
                      )}
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <h2>Phiên bản Prompt đã đăng ký ({promptLab?.versions.length ?? 0})</h2>
            </div>
            <div className="aiops-table-wrap">
              <table className="aiops-table">
                <thead>
                  <tr>
                    <th>Mã Prompt</th>
                    <th>Phiên bản</th>
                    <th>Mô hình</th>
                    <th>Trạng thái</th>
                    <th>Tóm tắt nội dung</th>
                  </tr>
                </thead>
                <tbody>
                  {(promptLab?.versions ?? []).map((v) => (
                    <tr key={v.id}>
                      <td><code>{v.promptKey}</code></td>
                      <td><strong>{v.version}</strong></td>
                      <td>{v.modelCode}</td>
                      <td>
                        <Tag
                          color={
                            v.status === 'ACTIVE'
                              ? 'green'
                              : v.status === 'CANDIDATE'
                                ? 'blue'
                                : 'default'
                          }
                        >
                          {PROMPT_VERSION_STATUS_LABEL[v.status] ?? v.status}
                        </Tag>
                      </td>
                      <td>{v.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {security && tab === 'security' && (
        <div className="aiops-stack">
          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <h2>
                <SafetyCertificateOutlined /> Luồng bảo vệ rào chắn AI
              </h2>
              <Tag color="blue">
                {security.policies.length} lớp kiểm soát đang bật · {security.blockedCount} yêu cầu bị chặn
              </Tag>
            </div>
            <div className="aiops-pipeline">
              <span>1. Yêu cầu đầu vào</span>
              <span>→</span>
              <span>2. Rào chắn đầu vào (Giới hạn tần suất · Chống tiêm lệnh)</span>
              <span>→</span>
              <span>3. Mô hình AI (Qwen / Thị giác)</span>
              <span>→</span>
              <span>4. Rào chắn đầu ra (Cấu trúc · Dẫn chứng nguồn)</span>
              <span>→</span>
              <span>5. Quy tắc nghiệp vụ &amp; Phân quyền</span>
            </div>
          </section>

          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <h2>Ma trận kiểm soát bảo mật AI (10 rủi ro trọng yếu)</h2>
            </div>
            <div className="aiops-table-wrap">
              <table className="aiops-table">
                <thead>
                  <tr>
                    <th>Rủi ro</th>
                    <th>Lớp bảo vệ</th>
                    <th>Cơ chế phòng thủ đang áp dụng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {security.policies.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.risk}</strong></td>
                      <td><Tag>{p.layer}</Tag></td>
                      <td>{p.protection}</td>
                      <td>
                        <Tag color={p.enforced ? 'green' : 'default'}>
                          {p.enforced ? 'Đang kích hoạt' : 'Tắt'}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="aiops-panel">
            <div className="aiops-panel-head">
              <h2>Sự kiện bảo mật AI ({security.events.length})</h2>
            </div>
            {security.events.length === 0 ? (
              <Empty description="Chưa ghi nhận sự kiện vi phạm bảo mật AI nào." />
            ) : (
              <div className="aiops-table-wrap">
                <table className="aiops-table">
                  <thead>
                    <tr>
                      <th>Thời điểm</th>
                      <th>Loại rủi ro</th>
                      <th>Tính năng</th>
                      <th>Quyết định</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {security.events.map((ev) => (
                      <tr key={ev.id}>
                        <td>{formatTime(ev.createdAt)}</td>
                        <td><strong>{ev.riskCategory}</strong></td>
                        <td>{ev.feature}</td>
                        <td>
                          <Tag color={ev.decision === 'BLOCK' ? 'red' : 'green'}>
                            {SECURITY_DECISION_LABEL[ev.decision] ?? ev.decision}
                          </Tag>
                        </td>
                        <td>{ev.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'audit' && (
        <section className="aiops-panel">
          <div className="aiops-panel-head">
            <div>
              <h2>
                <FileSearchOutlined /> Nhật ký kiểm toán AI (Chỉ ghi thêm)
              </h2>
              <small>
                Lưu vết mọi lượt thực thi AI, thay đổi cấu hình và quyết định kiểm duyệt mà không ghi dữ liệu nhạy cảm.
              </small>
            </div>
            <Input
              placeholder="Tìm mã truy vết, mô hình, tính năng..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
          </div>
          {filteredAudits.length === 0 ? (
            <Empty description="Không có bản ghi kiểm toán phù hợp." />
          ) : (
            <div className="aiops-table-wrap">
              <table className="aiops-table">
                <thead>
                  <tr>
                    <th>Mã truy vết</th>
                    <th>Mô hình</th>
                    <th>Tính năng</th>
                    <th>Vai trò</th>
                    <th>Thời gian xử lý</th>
                    <th>Kiểm định</th>
                    <th>Bảo mật</th>
                    <th>Thời điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((a) => (
                    <tr key={a.id}>
                      <td><code>{a.traceId}</code></td>
                      <td><strong>{a.modelCode}</strong></td>
                      <td>{a.feature}</td>
                      <td><Tag>{a.userRole}</Tag></td>
                      <td>{a.durationMs} ms</td>
                      <td>
                        <Tag color={a.validationStatus === 'PASSED' ? 'green' : 'red'}>
                          {VALIDATION_STATUS_LABEL[a.validationStatus] ?? a.validationStatus}
                        </Tag>
                      </td>
                      <td>
                        <Tag color={a.securityDecision === 'ALLOW' ? 'blue' : 'red'}>
                          {SECURITY_DECISION_LABEL[a.securityDecision] ?? a.securityDecision}
                        </Tag>
                      </td>
                      <td>{formatTime(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'incidents' && (
        <section className="aiops-panel">
          <div className="aiops-panel-head">
            <div>
              <h2>
                <ExclamationCircleOutlined /> Quản lý sự cố AI ({incidents.length})
              </h2>
              <small>
                Theo dõi cảnh báo cổng kết nối, worker ngoại tuyến, quá tải VRAM hoặc suy giảm chất lượng model.
              </small>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIncidentOpen(true)}
            >
              Ghi nhận sự cố
            </Button>
          </div>
          {incidents.length === 0 ? (
            <Empty description="Chưa có sự cố AI nào được ghi nhận." />
          ) : (
            <div className="aiops-incident-list">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`aiops-incident-card ${inc.status === 'OPEN' ? 'is-open' : 'is-resolved'}`}
                >
                  <div>
                    <Space size={8} wrap>
                      <Tag
                        color={
                          inc.status === 'RESOLVED'
                            ? 'green'
                            : inc.severity === 'CRITICAL'
                              ? 'red'
                              : 'orange'
                        }
                      >
                        {inc.status === 'RESOLVED' ? 'Đã xử lý' : (SEVERITY_LABEL[inc.severity] ?? inc.severity)}
                      </Tag>
                      <strong>{inc.title}</strong>
                      {inc.modelCode && <Tag color="blue">{inc.modelCode}</Tag>}
                    </Space>
                    <p>{inc.summary}</p>
                    {inc.recommendedAction && (
                      <small>Hướng xử lý: {inc.recommendedAction}</small>
                    )}
                    <div className="aiops-cell-sub">
                      Tạo lúc {formatTime(inc.createdAt)}
                      {inc.resolvedAt ? ` · Đã xử lý lúc ${formatTime(inc.resolvedAt)}` : ''}
                    </div>
                  </div>
                  {inc.status === 'OPEN' && (
                    <Button
                      type="primary"
                      size="small"
                      loading={busyKey === `resolve:${inc.id}`}
                      onClick={() => void handleResolveIncident(inc.id)}
                    >
                      Đánh dấu đã xử lý
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        open={!!configTarget}
        title={`Cấu hình model · ${configTarget?.name ?? ''}`}
        onCancel={() => setConfigTarget(null)}
        onOk={() => void handleSaveConfig()}
        okText="Lưu cấu hình"
        cancelText="Hủy"
        confirmLoading={busyKey.startsWith('config:')}
      >
        <p className="aiops-modal-hint">
          Chỉ cho phép các tham số an toàn: <code>temperature</code>, <code>timeoutSec</code>,{' '}
          <code>maxTokens</code>, <code>threshold</code>, <code>blurThreshold</code>,{' '}
          <code>language</code>, <code>sampleRate</code>.
        </p>
        <Input.TextArea
          rows={8}
          value={configDraft}
          onChange={(e) => setConfigDraft(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      <Modal
        open={incidentOpen}
        title="Ghi nhận sự cố AI mới"
        onCancel={() => setIncidentOpen(false)}
        onOk={() => void handleCreateIncident()}
        okText="Tạo sự cố"
        cancelText="Hủy"
        confirmLoading={busyKey === 'create-incident'}
      >
        <div className="aiops-form-stack">
          <label>
            Tiêu đề sự cố
            <Input
              placeholder="Ví dụ: Port 8002 conflict khi khởi động AI Worker"
              value={incidentForm.title}
              onChange={(e) =>
                setIncidentForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </label>
          <label>
            Mức độ nghiêm trọng
            <Select
              value={incidentForm.severity}
              onChange={(severity) =>
                setIncidentForm((f) => ({ ...f, severity }))
              }
              options={[
                { value: 'CRITICAL', label: 'Nghiêm trọng (CRITICAL)' },
                { value: 'WARNING', label: 'Cảnh báo (WARNING)' },
                { value: 'INFO', label: 'Thông tin (INFO)' },
              ]}
            />
          </label>
          <label>
            Model liên quan (tùy chọn)
            <Select
              allowClear
              placeholder="Chọn model"
              value={incidentForm.modelCode || undefined}
              onChange={(val) =>
                setIncidentForm((f) => ({ ...f, modelCode: val ?? '' }))
              }
              options={(overview?.models ?? []).map((m) => ({
                value: m.code,
                label: `${m.name} (${m.code})`,
              }))}
            />
          </label>
          <label>
            Mô tả sự cố
            <Input.TextArea
              rows={3}
              placeholder="Mô tả biểu hiện, log lỗi hoặc tác động..."
              value={incidentForm.summary}
              onChange={(e) =>
                setIncidentForm((f) => ({ ...f, summary: e.target.value }))
              }
            />
          </label>
          <label>
            Hành động khuyến nghị
            <Input
              placeholder="Ví dụ: Kiểm tra tiến trình chiếm port 8002 trước khi khởi động lại"
              value={incidentForm.recommendedAction}
              onChange={(e) =>
                setIncidentForm((f) => ({
                  ...f,
                  recommendedAction: e.target.value,
                }))
              }
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
