import { CameraOutlined, AimOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'
import { apiRequest } from '../../../../../shared/api/httpClient'
import { CancelOrderModal } from './CancelOrderModal'
import { cancelOrderModalMessages } from './CancelOrderModal.messages'

import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { orderActionsMessages } from './OrderActions.messages'

export function OrderActions({ order, onUpdated }: { order: OrderDetailView; onUpdated?: () => void }) {
  const { t } = useI18n(orderActionsMessages)
  const { t: cancelText } = useI18n(cancelOrderModalMessages)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canCancel = order.status === 'PENDING'
  async function cancel() {
    if (cancelling) return
    setCancelling(true)
    setError(null)
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(order.id)}/cancel`, { method: 'POST' })
      setCancelOpen(false)
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : cancelText.failed)
      onUpdated?.()
    } finally { setCancelling(false) }
  }
  const active = order.status === 'IN_PROGRESS'
  const hasMedia = active || order.status === 'COMPLETED'
  if (!hasMedia && !canCancel && !cancelOpen) return null

  return (
    <>
      {canCancel && <Button danger onClick={() => { setError(null); setCancelOpen(true) }}>{t.cancelOrder}</Button>}
      {cancelOpen && <CancelOrderModal orderTitle={order.title} cancelling={cancelling} error={error}
        onConfirm={() => void cancel()} onClose={() => setCancelOpen(false)} />}
      {active && (
        <Button
          type="primary"
          icon={<AimOutlined aria-hidden="true" aria-label={undefined} />}
          href={customerHref({ screen: 'live', orderId: order.id })}
        >
          {t.live}
        </Button>
      )}
      {hasMedia && (
        <Button
          icon={<CameraOutlined aria-hidden="true" aria-label={undefined} />}
          href={customerHref({ screen: 'media', orderId: order.id })}
        >
          {t.media}
        </Button>
      )}
    </>
  )
}
