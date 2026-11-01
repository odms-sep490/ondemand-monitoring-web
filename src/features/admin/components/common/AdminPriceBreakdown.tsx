import { Card } from 'antd'

import { PriceBreakdownView } from '../../../../shared/components/odm/PriceBreakdownView'
import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'

/**
 * Admin framing for the shared price breakdown: an antd Card using the admin tokens.
 * The shared view is rendered unchanged, so other portals are unaffected.
 */
export function AdminPriceBreakdown({
  preview,
}: {
  preview: ServicePricePreview
}) {
  return (
    <Card size="small" className="adm-price-breakdown">
      <PriceBreakdownView preview={preview} />
    </Card>
  )
}
