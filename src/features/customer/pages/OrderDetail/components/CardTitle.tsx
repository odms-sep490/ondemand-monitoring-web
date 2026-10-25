import type { ReactNode } from 'react'

import { OrderIcon, type OrderIconName } from '../../../../manager/components/common/OrderIcon'

/** Card heading with a soft-blue icon chip, used across the order detail cards. */
export function CardTitle({ icon, children }: { icon: OrderIconName; children: ReactNode }) {
  return (
    <span className="od-card-title">
      <span className="od-card-icon">
        <OrderIcon name={icon} size={16} />
      </span>
      <span>{children}</span>
    </span>
  )
}
