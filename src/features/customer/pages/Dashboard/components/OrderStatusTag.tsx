import { StatusTag } from '../../../../../shared/components/antd'
import { useLanguage } from '../../../../../shared/i18n'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { getOrderStatusMeta } from '../../../lib/orderStatus'

/** Order status as an antd pill; label (vi/en) and tone come from lib/orderStatus. */
export function OrderStatusTag({ status }: { status: OrderStatus }) {
  const { lang } = useLanguage()
  const meta = getOrderStatusMeta(status, lang)
  return <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
}
