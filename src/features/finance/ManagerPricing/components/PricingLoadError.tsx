import { Alert } from 'antd'
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
      <section className="mgr-card finance-panel finance-error finance-fallback">
        <Alert type="error" showIcon message={errorMessage(query.error)} />
      </section>
      <div className="finance-sidebar">
        <aside className="mgr-card finance-quote finance-fallback">
          {null}
          <div className="finance-quote-body">
            <div className="finance-quote-content" />
          </div>
        </aside>
      </div>
    </div>
  )
}
