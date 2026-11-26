import { apiRequest } from '../../../shared/api/httpClient'

export type OrderFeedback = {
  id: string
  rating: number
  qualityRating: number | null
  punctualityRating: number | null
  communicationRating: number | null
  comment: string | null
  createdAt: string | null
}

export type OrderFeedbackState = {
  orderId: string
  /** True when the customer may submit feedback now. */
  eligible: boolean
  feedback: OrderFeedback | null
}

export type OrderFeedbackInput = {
  rating: number
  qualityRating?: number | null
  punctualityRating?: number | null
  communicationRating?: number | null
  comment?: string | null
}

const path = (orderId: string) => `/api/orders/${encodeURIComponent(orderId)}/feedback`

export const orderFeedbackApi = {
  get: (orderId: string, signal?: AbortSignal) =>
    apiRequest<OrderFeedbackState>(path(orderId), { signal }),
  submit: (orderId: string, body: OrderFeedbackInput) =>
    apiRequest<OrderFeedbackState>(path(orderId), { method: 'POST', body }),
}
