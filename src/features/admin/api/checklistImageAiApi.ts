import { apiRequest } from '../../../shared/api/httpClient'

export type ChecklistImageAiSettings = {
  enabled: boolean
  providerConfigured: boolean
  effectiveEnabled: boolean
  version: number
  updatedAt: string
  updatedBy: string
}

const path = '/api/admin/config/checklist-image-ai'

export const checklistImageAiApi = {
  get: (signal?: AbortSignal) =>
    apiRequest<ChecklistImageAiSettings>(path, { signal }),
  update: (enabled: boolean, expectedVersion: number) =>
    apiRequest<ChecklistImageAiSettings>(path, {
      method: 'PUT',
      body: { enabled, expectedVersion },
    }),
}
