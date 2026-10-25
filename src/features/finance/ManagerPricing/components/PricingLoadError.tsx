import { errorMessage } from '../pricingHelpers'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { PricingReview } from '../../types'

export function PricingLoadError({
  query,
}: {
  query: UseApiQueryState<PricingReview>
}) {
  return (
    <div className="finance-workspace">
      <section className="odm-or-card finance-panel finance-error finance-fallback">
        {errorMessage(query.error)}
      </section>
      <div className="finance-sidebar">
        <aside className="odm-or-card finance-quote finance-fallback">
          {null}
          <div className="finance-quote-body">
            <div className="finance-quote-content" />
          </div>
        </aside>
      </div>
    </div>
  )
}
