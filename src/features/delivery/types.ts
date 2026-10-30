export type DeliveryStatus =
  | 'PROCESSING'
  | 'READY_FOR_MANAGER_REVIEW'
  | 'CUSTOMER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'FINAL_PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'

export type DeliveryPanelLoadState =
  'loading' | 'ready' | 'unavailable' | 'error'

export type DeliveryAsset = {
  id: string
  type: string
  fileName: string
  size: number
  url: string
  urlExpiresAt: string
  downloadable: boolean
}

export type Delivery = {
  orderId: string
  deliveryStatus: DeliveryStatus
  missionStatus: string
  orderStatus: string
  invoiceStatus: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  deliveryNotes: string | null
  previewReleasedAt: string | null
  customerAcceptedAt: string | null
  revisionRequestedAt: string | null
  revisionReason: string | null
  revisionCount: number
  finalPaymentConfirmedAt: string | null
  originalsReleasedAt: string | null
  assets: DeliveryAsset[]
}
