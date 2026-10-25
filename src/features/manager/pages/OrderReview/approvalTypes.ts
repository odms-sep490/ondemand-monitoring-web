import { ordersApi } from '../../api/ordersApi'

export type ModalKind = 'reject' | 'info' | null

export type ApproveResult = Awaited<ReturnType<typeof ordersApi.approve>>
