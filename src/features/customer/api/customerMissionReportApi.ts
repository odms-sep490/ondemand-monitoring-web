import { apiRequest } from '../../../shared/api/httpClient'
import type { MissionStatus } from '../../../shared/types/domain'

export type CustomerMissionSummary = {
  missionId: string
  orderId: string
  missionCode: string
  scopeLabel: string | null
  status: MissionStatus
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  replacesMissionId: string | null
  reportAvailable: boolean
}
export type CustomerChecklistReportItem = {
  executionId: string
  orderChecklistItemId: string
  content: string
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_CUSTOM'
  displayOrder: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'UNABLE_TO_VERIFY'
  assessment: 'NOT_ASSESSED' | 'COMPLIANT' | 'NON_COMPLIANT'
  observation: string | null
  unableToVerifyReason: string | null
}
export type CustomerMissionReport = {
  mission: CustomerMissionSummary
  reportAvailable: boolean
  result: {
    id: string
    summary: string | null
    startedAt: string | null
    endedAt: string | null
    completedAt: string | null
    durationSeconds: number | null
  } | null
  checklistItems: CustomerChecklistReportItem[]
}
const path = (orderId: string) =>
  `/api/customer/orders/${encodeURIComponent(orderId)}/missions`
export const customerMissionReportApi = {
  list: async (orderId: string, signal?: AbortSignal) => {
    const data = await apiRequest<CustomerMissionSummary[]>(path(orderId), {
      signal,
    })
    if (data.some((m) => m.orderId !== orderId))
      throw new Error('Invalid Order Mission scope')
    return data
  },
  report: async (orderId: string, missionId: string, signal?: AbortSignal) => {
    const data = await apiRequest<CustomerMissionReport>(
      `${path(orderId)}/${encodeURIComponent(missionId)}/report`,
      { signal },
    )
    if (
      data.mission.orderId !== orderId ||
      data.mission.missionId !== missionId
    )
      throw new Error('Invalid report scope')
    return data
  },
}
