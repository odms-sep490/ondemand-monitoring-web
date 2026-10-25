import { apiRequest } from '../../../shared/api/httpClient'
import type { ManagerDashboardResponse } from '../types/dashboard'

/** Aggregate operational dashboard backed by the Spring Manager API. */
export const managerApi = {
  getDashboard(range = '30D', signal?: AbortSignal): Promise<ManagerDashboardResponse> {
    return apiRequest<ManagerDashboardResponse>(`/api/manager/dashboard?range=${encodeURIComponent(range)}`, {
      signal,
    })
  },
}
