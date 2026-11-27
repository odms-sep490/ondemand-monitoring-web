import { apiRequest } from '../../../shared/api/httpClient'

export type AiOpsTab =
  | 'overview'
  | 'models'
  | 'services'
  | 'tracing'
  | 'evaluation'
  | 'supervisor'
  | 'promptLab'
  | 'security'
  | 'audit'
  | 'incidents'

export type SupervisorEvaluationView = {
  evaluationId: string
  traceId: string
  targetModel: string
  judgeModel: string
  rubricVersion: string
  feature: string
  evaluationStatus: string
  qualityScore: number | null
  metricScores: Record<string, unknown>
  taskCompleted: boolean | null
  hardConstraintViolations: string[]
  detectedErrors: string[]
  severity: string
  evidenceReferences: string[]
  suspectedRootCause: string
  improvementSuggestions: string[]
  humanReviewRequired: boolean
  evaluationLatencyMs: number
  evalInputTokens: number | null
  evalOutputTokens: number | null
  createdAt: string
}

export type JudgeCalibrationView = {
  id: string
  judgeModel: string
  rubricVersion: string
  datasetVersion: string
  totalCases: number
  agreementRate: number
  falsePositives: number
  falseNegatives: number
  abstentionRate: number
  cases: Array<Record<string, unknown>>
  createdAt: string
}

export type PromptVersionView = {
  id: string
  promptKey: string
  version: string
  modelCode: string
  content: string
  status: string
  createdBy: string | null
  approvedBy: string | null
  activatedAt: string | null
  createdAt: string
}

export type PromptExperimentView = {
  id: string
  promptKey: string
  baselineVersion: string
  candidateVersion: string
  baselineQuality: number
  candidateQuality: number
  baselineTokens: number
  candidateTokens: number
  baselineLatencyMs: number
  candidateLatencyMs: number
  baselineErrorRate: number
  candidateErrorRate: number
  hardConstraintViolations: number
  paretoEligible: boolean
  status: string
  notes: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}

export type PromptLabOverview = {
  versions: PromptVersionView[]
  experiments: PromptExperimentView[]
}

export type AiModelView = {
  id: string
  code: string
  name: string
  version: string
  modelType: string
  capability: string
  source: string
  license: string
  checksumSha256: string
  runtime: string
  device: string
  endpoint: string
  modelSize: string
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'IDLE' | 'LOADING' | 'DISABLED' | string
  enabled: boolean
  config: Record<string, unknown>
  lastEvaluatedAt: string | null
  updatedAt: string | null
}

export type ServiceHealthView = {
  code: string
  name: string
  endpoint: string
  status: string
  latencyMs: number
  detail: string
  loadedModels: string[]
  checkedAt: string
}

export type SystemResourceView = {
  cpuUsagePercent: number
  memoryUsagePercent: number
  memoryUsedMb: number
  memoryTotalMb: number
  jvmHeapUsedMb: number
  jvmHeapMaxMb: number
  availableProcessors: number
  osName: string
}

export type DailyVolumePoint = {
  day: string
  requests: number
  errors: number
}

export type TraceSpan = {
  name: string
  durationMs: number
  status: string
  versionId?: string | null
  contentHash?: string | null
  staleCacheUsed?: boolean | null
}

export type AiTraceView = {
  id: string
  traceId: string
  userId: string
  userRole: string
  modelCode: string
  modelVersion: string
  promptVersion: string
  feature: string
  resourceId: string
  inputRef: string
  outputRef: string
  durationMs: number
  httpStatus: number
  inferenceDevice: string
  fallbackUsed: boolean
  validationStatus: string
  securityDecision: string
  humanReviewStatus: string
  spans: TraceSpan[]
  createdAt: string
}

export type AiEvaluationView = {
  id: string
  modelCode: string
  modelVersion: string
  suiteName: string
  metricName: string
  score: number
  passRate: number
  targetScore: number
  passed: boolean
  totalCases: number
  passedCases: number
  failedCases: number
  skippedCases: number
  errorCases: number
  suiteGroup: string
  datasetVersion: string
  judgeModel: string
  promptVersion: string
  runId: string
  baselineDelta: number | null
  avgLatencyMs: number
  p95LatencyMs: number
  liveScored: number
  livePassed: number
  sourceArtifact: string
  createdAt: string
}

export type EvaluationCaseView = {
  testCaseId: string
  metric: string
  suiteGroup: string
  category: string
  difficulty: string
  language: string
  partition: string
  severity: string
  input: string
  turnsCount: number
  expectedBehavior: string
  actualOutput: string
  evaluationMode: string
  score: number | null
  threshold: number
  passed: boolean
  status: string
  judgeReason: string
  rootCause: string
  latencyMs: number | null
  inputTokens: number | null
  outputTokens: number | null
  toolCalls: string[]
  evaluatedAt: string
}

export type EvaluationJobView = {
  id: string
  status: string
  mode: string
  metricFilter: string
  partition: string
  totalCases: number
  completedCases: number
  passedCases: number
  failedCases: number
  errorCases: number
  currentMetric: string
  currentCase: string
  elapsedMs: number
  lastCheckpoint: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type GuardrailPolicyView = {
  id: string
  risk: string
  protection: string
  layer: string
  enforced: boolean
}

export type AiSecurityEventView = {
  id: string
  traceId: string
  eventType: string
  riskCategory: string
  severity: string
  userId: string
  feature: string
  decision: string
  summary: string
  createdAt: string
}

export type AiSecurityOverviewView = {
  policies: GuardrailPolicyView[]
  events: AiSecurityEventView[]
  blockedCount: number
  totalEvents: number
}

export type AiIncidentView = {
  id: string
  title: string
  severity: string
  status: string
  modelCode: string | null
  serviceEndpoint: string | null
  summary: string
  recommendedAction: string | null
  createdBy: string | null
  resolvedBy: string | null
  createdAt: string
  resolvedAt: string | null
}

export type AiOverviewView = {
  totalModels: number
  activeModels: number
  degradedModels: number
  requestsToday: number
  successRatePercent: number
  p95LatencyMs: number
  openIncidents: number
  volumeSeries: DailyVolumePoint[]
  models: AiModelView[]
  services: ServiceHealthView[]
  resources: SystemResourceView
  activeIncidents: AiIncidentView[]
  generatedAt: string
}

const BASE = '/api/admin/ai-ops'

export type ChecklistVisionResult = {
  findings: Array<{ code: string; verdict: string; observation: string }>
}

export const aiOpsApi = {
  runChecklistVision: (image: File, promptVersionId: string, criteria: string[], language: string) => {
    const body = new FormData()
    body.append('image', image)
    body.append('promptVersionId', promptVersionId)
    body.append('criteria', JSON.stringify(criteria))
    body.append('language', language)
    return apiRequest<ChecklistVisionResult>(`${BASE}/checklist-vision/playground`, { method: 'POST', body })
  },
  getOverview: (signal?: AbortSignal) =>
    apiRequest<AiOverviewView>(`${BASE}/overview`, { signal }),
  listModels: (signal?: AbortSignal) =>
    apiRequest<AiModelView[]>(`${BASE}/models`, { signal }),
  toggleModel: (code: string, enabled: boolean) =>
    apiRequest<AiModelView>(`${BASE}/models/${encodeURIComponent(code)}/toggle`, {
      method: 'PATCH',
      body: { enabled },
    }),
  updateModelConfig: (code: string, config: Record<string, unknown>) =>
    apiRequest<AiModelView>(`${BASE}/models/${encodeURIComponent(code)}/config`, {
      method: 'PATCH',
      body: { config },
    }),
  probeModel: (code: string) =>
    apiRequest<ServiceHealthView>(
      `${BASE}/models/${encodeURIComponent(code)}/probe`,
      { method: 'POST' },
    ),
  listServices: (signal?: AbortSignal) =>
    apiRequest<ServiceHealthView[]>(`${BASE}/services`, { signal }),
  listTraces: (limit = 80, signal?: AbortSignal) =>
    apiRequest<AiTraceView[]>(`${BASE}/traces?limit=${limit}`, { signal }),
  getTrace: (traceId: string) =>
    apiRequest<AiTraceView>(`${BASE}/traces/${encodeURIComponent(traceId)}`),
  listEvaluations: (signal?: AbortSignal) =>
    apiRequest<AiEvaluationView[]>(`${BASE}/evaluations`, { signal }),
  syncEvaluations: () =>
    apiRequest<AiEvaluationView[]>(`${BASE}/evaluations/sync`, {
      method: 'POST',
    }),
  listEvaluationCases: (params: {
    metric?: string
    status?: string
    difficulty?: string
    language?: string
    search?: string
    limit?: number
  }) => {
    const qs = new URLSearchParams()
    if (params.metric) qs.set('metric', params.metric)
    if (params.status) qs.set('status', params.status)
    if (params.difficulty) qs.set('difficulty', params.difficulty)
    if (params.language) qs.set('language', params.language)
    if (params.search) qs.set('search', params.search)
    if (params.limit) qs.set('limit', String(params.limit))
    return apiRequest<EvaluationCaseView[]>(`${BASE}/evaluations/cases?${qs.toString()}`)
  },
  listEvaluationHistory: (limit = 10) =>
    apiRequest<Array<Record<string, unknown>>>(`${BASE}/evaluations/history?limit=${limit}`),
  listEvaluationJobs: () =>
    apiRequest<EvaluationJobView[]>(`${BASE}/evaluations/jobs`),
  startEvaluationJob: (body: {
    mode?: string
    metric?: string
    partition?: string
    livePerMetric?: number
  }) =>
    apiRequest<EvaluationJobView>(`${BASE}/evaluations/jobs`, {
      method: 'POST',
      body,
    }),
  cancelEvaluationJob: (id: string) =>
    apiRequest<EvaluationJobView>(`${BASE}/evaluations/jobs/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),
  getSecurity: (signal?: AbortSignal) =>
    apiRequest<AiSecurityOverviewView>(`${BASE}/security`, { signal }),
  listIncidents: (status?: string, signal?: AbortSignal) =>
    apiRequest<AiIncidentView[]>(
      `${BASE}/incidents${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      { signal },
    ),
  createIncident: (body: {
    title: string
    severity: string
    modelCode?: string
    serviceEndpoint?: string
    summary: string
    recommendedAction?: string
  }) =>
    apiRequest<AiIncidentView>(`${BASE}/incidents`, {
      method: 'POST',
      body,
    }),
  resolveIncident: (id: string) =>
    apiRequest<AiIncidentView>(`${BASE}/incidents/${encodeURIComponent(id)}/resolve`, {
      method: 'PATCH',
    }),
  listSupervisorEvaluations: (signal?: AbortSignal) =>
    apiRequest<SupervisorEvaluationView[]>(`${BASE}/supervisor/evaluations`, { signal }),
  listCalibrations: (signal?: AbortSignal) =>
    apiRequest<JudgeCalibrationView[]>(`${BASE}/supervisor/calibrations`, { signal }),
  runCalibration: () =>
    apiRequest<JudgeCalibrationView>(`${BASE}/supervisor/calibrations/run`, {
      method: 'POST',
    }),
  getPromptLab: (signal?: AbortSignal) =>
    apiRequest<PromptLabOverview>(`${BASE}/prompts`, { signal }),
  approveExperiment: (id: string) =>
    apiRequest<PromptExperimentView>(`${BASE}/prompts/experiments/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    }),
  rollbackExperiment: (id: string) =>
    apiRequest<PromptExperimentView>(`${BASE}/prompts/experiments/${encodeURIComponent(id)}/rollback`, {
      method: 'POST',
    }),
  exportBenchmarkReport: () =>
    apiRequest<Record<string, unknown>>(`${BASE}/evaluations/export`),
}
