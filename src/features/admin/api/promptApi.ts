import { apiRequest } from '../../../shared/api/httpClient'

export type VariableSpec = {
  name: string
  type: string
  required: boolean
  description: string
}

export type PromptSummaryView = {
  id: string
  promptKey: string
  displayName: string
  description: string
  feature: string
  promptType: string
  modelBinding: string
  languages: string
  variableSchema: VariableSpec[]
  activeVersionId: string | null
  activeVersionNumber: number | null
  latestVersionNumber: number | null
  totalVersions: number
  enabled: boolean
  avgEvalScore: number | null
  avgInputTokens: number | null
  avgOutputTokens: number | null
  avgLatencyMs: number | null
  updatedAt: string | null
}

export type PromptVersionView = {
  id: string
  promptId: string
  promptKey: string
  versionNumber: number
  templateContent: string
  modelParameters: Record<string, unknown>
  variableSchema: VariableSpec[]
  contentHash: string
  status: 'DRAFT' | 'TESTED' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED' | 'REJECTED' | string
  changeSummary: string | null
  parentVersionId: string | null
  createdBy: string
  createdAt: string
  approvedBy: string | null
  approvedAt: string | null
  activatedAt: string | null
}

export type ActivationHistoryView = {
  id: string
  promptKey: string
  previousVersionId: string | null
  newVersionId: string
  activatedBy: string
  reason: string
  traceId: string
  activatedAt: string
}

export type TestRunView = {
  id: string
  promptVersionId: string
  promptKey: string
  modelName: string
  renderedPrompt: string
  inputVariables: Record<string, unknown>
  modelOutput: string | null
  inputTokens: number | null
  outputTokens: number | null
  latencyMs: number
  evaluationScore: number | null
  validationStatus: string
  errorType: string | null
  executedBy: string | null
  executedAt: string
}

export type ValidationResult = {
  valid: boolean
  discoveredVariables: string[]
  missingRequiredVariables: string[]
  unknownVariables: string[]
  errors: string[]
  characterCount: number
  estimatedTokens: number
}

export type PreviewResult = {
  renderedPrompt: string
  validation: ValidationResult
}

const BASE = '/api/admin/ai/prompts'

export const promptApi = {
  listPrompts: (feature?: string, search?: string) => {
    const params = new URLSearchParams()
    if (feature && feature !== 'ALL') params.set('feature', feature)
    if (search?.trim()) params.set('search', search.trim())
    const qs = params.toString()
    return apiRequest<PromptSummaryView[]>(`${BASE}${qs ? `?${qs}` : ''}`)
  },
  createPrompt: (body: {
    promptKey: string
    displayName: string
    description?: string
    feature: string
    promptType?: string
    modelBinding: string
    languages?: string
    templateContent: string
  }) =>
    apiRequest<PromptSummaryView>(BASE, {
      method: 'POST',
      body,
    }),
  updatePrompt: (
    promptKey: string,
    body: {
      displayName: string
      description?: string
      feature: string
      promptType?: string
      modelBinding: string
      languages?: string
      enabled?: boolean
    },
  ) =>
    apiRequest<PromptSummaryView>(`${BASE}/${encodeURIComponent(promptKey)}`, {
      method: 'PUT',
      body,
    }),
  deletePrompt: (promptKey: string) =>
    apiRequest<void>(`${BASE}/${encodeURIComponent(promptKey)}`, {
      method: 'DELETE',
    }),
  updateDraft: (
    promptKey: string,
    versionId: string,
    body: {
      templateContent: string
      changeSummary?: string
    },
  ) =>
    apiRequest<PromptVersionView>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}`,
      { method: 'PUT', body },
    ),
  deleteVersion: (promptKey: string, versionId: string) =>
    apiRequest<void>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}`,
      { method: 'DELETE' },
    ),
  listVersions: (promptKey: string) =>
    apiRequest<PromptVersionView[]>(`${BASE}/${encodeURIComponent(promptKey)}/versions`),
  createDraft: (
    promptKey: string,
    body: {
      templateContent: string
      modelParameters?: Record<string, unknown>
      variableSchema?: VariableSpec[]
      changeSummary?: string
      parentVersionId?: string
    },
  ) =>
    apiRequest<PromptVersionView>(`${BASE}/${encodeURIComponent(promptKey)}/versions`, {
      method: 'POST',
      body,
    }),
  validateVersion: (promptKey: string, versionId: string, variables?: Record<string, unknown>) =>
    apiRequest<ValidationResult>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}/validate`,
      { method: 'POST', body: { variables: variables ?? {} } },
    ),
  previewVersion: (promptKey: string, versionId: string, variables?: Record<string, unknown>) =>
    apiRequest<PreviewResult>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}/preview`,
      { method: 'POST', body: { variables: variables ?? {} } },
    ),
  testVersion: (
    promptKey: string,
    versionId: string,
    body: {
      variables?: Record<string, unknown>
      userInput?: string
      modelOverride?: string
      parameterOverrides?: Record<string, unknown>
    },
  ) =>
    apiRequest<TestRunView>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}/test`,
      { method: 'POST', body },
    ),
  approveVersion: (promptKey: string, versionId: string) =>
    apiRequest<PromptVersionView>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}/approve`,
      { method: 'POST' },
    ),
  activateVersion: (promptKey: string, versionId: string, reason?: string) =>
    apiRequest<PromptVersionView>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}/activate`,
      { method: 'POST', body: { reason: reason ?? '' } },
    ),
  rollbackVersion: (promptKey: string, versionId: string, reason?: string) =>
    apiRequest<PromptVersionView>(
      `${BASE}/${encodeURIComponent(promptKey)}/versions/${encodeURIComponent(versionId)}/rollback`,
      { method: 'POST', body: { reason: reason ?? '' } },
    ),
  activationHistory: (promptKey: string) =>
    apiRequest<ActivationHistoryView[]>(
      `${BASE}/${encodeURIComponent(promptKey)}/activation-history`,
    ),
  testRuns: (promptKey: string) =>
    apiRequest<TestRunView[]>(`${BASE}/${encodeURIComponent(promptKey)}/test-runs`),
}
