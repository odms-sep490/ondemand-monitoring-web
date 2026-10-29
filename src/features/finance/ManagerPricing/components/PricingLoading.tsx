import { Skeleton } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

export function PricingLoading() {
  const { t } = useI18n(pricingMessages)
  return (
    <div className="finance-workspace">
      <section className="mgr-card finance-panel finance-fallback">
        <p role="status">{t.loadingPricing}</p>
        <Skeleton active paragraph={{ rows: 4 }} />
      </section>
      <div className="finance-sidebar">
        <aside className="mgr-card finance-quote finance-fallback">
          <div className="finance-quote-body">
            <div className="finance-quote-content">
              <p role="status">{t.loadingQuote}</p>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
