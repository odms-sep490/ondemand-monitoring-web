import { apiRequest } from '../../shared/api/httpClient'
import type { JSONContent } from '@tiptap/core'
export type ReportImage = {
  mediaId: string
  role: 'OVERVIEW' | 'EVIDENCE' | 'SUPPORTING'
  caption: string
}
export type ReportSection = {
  sectionId: string
  title: string
  content: string
  images: ReportImage[]
  sourceFindingIds: string[]
  sourceMediaIds: string[]
  richText?: JSONContent | null
}
export type ReportDocument = {
  reportTitle: string
  executiveSummary: string
  inspectionScope: string
  methodology: string
  sections: ReportSection[]
  limitations: string[]
  conclusion: string
  recommendations: string[]
}
export type Evidence = {
  mediaId: string
  fileName: string
  capturedAt: string | null
  width: number
  height: number
  qualityStatus: string
  rankingScore: number
  isEligible: boolean
  selectionReason: string
  findingIds: string[]
  priority: boolean
}
export type InspectionReport = {
  id: string
  missionId: string
  status: string
  revision: number
  document: ReportDocument | null
  evidence: {
    images: Evidence[]
    findings: {
      id: string
      text: string
      assessment: string
      mediaIds: string[]
    }[]
    warnings: string[]
  } | null
  jobStage: string | null
  error: string | null
  model: string | null
  canEdit: boolean
  canApprove: boolean
  approvedBy: string | null
  approvedAt: string | null
}
const path = (id: string) => `/api/inspection-reports/${encodeURIComponent(id)}`
export const reportApi = {
  capabilities: (mission: string) =>
    apiRequest<{ canCreate: boolean }>(
      `/api/missions/${encodeURIComponent(mission)}/inspection-reports/capabilities`,
    ),
  list: (mission: string) =>
    apiRequest<InspectionReport[]>(
      `/api/missions/${encodeURIComponent(mission)}/inspection-reports`,
    ),
  create: (mission: string) =>
    apiRequest<InspectionReport>(
      `/api/missions/${encodeURIComponent(mission)}/inspection-reports`,
      { method: 'POST' },
    ),
  get: (id: string) => apiRequest<InspectionReport>(path(id)),
  save: (r: InspectionReport, document: ReportDocument) =>
    apiRequest<InspectionReport>(path(r.id), {
      method: 'PATCH',
      body: { revision: r.revision, document },
    }),
  action: (r: InspectionReport, action: string) =>
    apiRequest<InspectionReport>(`${path(r.id)}/${action}`, {
      method: 'POST',
      body: { revision: r.revision },
    }),
  rewrite: (r: InspectionReport, instruction: string) =>
    apiRequest<{ document: ReportDocument; warnings?: string[]; changed?: boolean; skill?: string; latencyMs?: number }>(`${path(r.id)}/rewrite`, {
      method: 'POST',
      body: { revision: r.revision, instruction },
    }),
  video: (id: string, mediaId: string) =>
    apiRequest<{ url: string }>(`${path(id)}/videos/${encodeURIComponent(mediaId)}`),
  image: (id: string, mediaId: string) =>
    apiRequest<Blob>(`${path(id)}/images/${encodeURIComponent(mediaId)}`, {
      responseType: 'blob',
    }),
  pdf: (id: string, preview: boolean) =>
    apiRequest<Blob>(`${path(id)}/${preview ? 'preview' : 'pdf'}`, {
      responseType: 'blob',
    }),
  versions: (id: string) =>
    apiRequest<
      { revision: number; action: string; actor: string; created_at: string }[]
    >(`${path(id)}/versions`),
}
