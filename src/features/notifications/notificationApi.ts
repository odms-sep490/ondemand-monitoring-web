import { apiRequest } from '../../shared/api/httpClient'
import type { NotificationFeed } from './types'

export const notificationApi = {
  list(signal?: AbortSignal) {
    return apiRequest<NotificationFeed>('/api/notifications', {
      signal,
      query: { limit: 30 },
    })
  },
}
