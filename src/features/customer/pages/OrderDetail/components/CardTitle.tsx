import type { ReactNode } from 'react'

import { OrderIcon, type OrderIconName } from '../../../../manager/components/common/OrderIcon'

/** Card heading with a gradient icon tile, same look as CardComponent's heading. */
export function CardTitle({ icon, children }: { icon: OrderIconName; children: ReactNode }) {
  return (
    <span className="mgr-card-head">
      <span className="mgr-tile mgr-tile-sm mgr-tone-blue" aria-hidden="true">
        <OrderIcon name={icon} size={16} />
      </span>
      <h3 className="mgr-card-title">{children}</h3>
    </span>
  )
}
