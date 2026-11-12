import { apiRequest } from '../../../shared/api/httpClient'
import type {
  BusySchedule,
  BusyScheduleInput,
  WeeklyBusySchedule,
} from '../types'

const BASE = '/api/busy-schedules'

export const busyScheduleApi = {
  /** `GET /api/busy-schedules/me?date=` (STAFF): the week containing `date`. */
  getMyWeek: (date?: string, signal?: AbortSignal) =>
    apiRequest<WeeklyBusySchedule>(`${BASE}/me`, {
      query: { date },
      signal,
    }),

  /** `GET /api/busy-schedules/users/{staffId}?date=` (MANAGER / ADMIN). */
  getStaffWeek: (staffId: string, date?: string, signal?: AbortSignal) =>
    apiRequest<WeeklyBusySchedule>(`${BASE}/users/${encodeURIComponent(staffId)}`, {
      query: { date },
      signal,
    }),

  /** `POST /api/busy-schedules` (STAFF). */
  create: (input: BusyScheduleInput) =>
    apiRequest<BusySchedule>(BASE, { method: 'POST', body: input }),

  /** `PUT /api/busy-schedules/{id}` (STAFF, owner). */
  update: (id: string, input: BusyScheduleInput) =>
    apiRequest<BusySchedule>(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: input,
    }),

  /** `DELETE /api/busy-schedules/{id}` (STAFF, owner): cancels the session. */
  remove: (id: string) =>
    apiRequest<null>(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
