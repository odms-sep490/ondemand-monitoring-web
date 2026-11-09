import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

export function PricingLoading() {
  const { t } = useI18n(pricingMessages)
  return (
    <div className="finance-workspace">
      <section className="odm-or-card finance-panel finance-fallback">
        {t.loadingPricing}
      </section>
      <div className="finance-sidebar">
        <aside className="odm-or-card finance-quote finance-fallback">
          {null}
          <div className="finance-quote-body">
            <div className="finance-quote-content">{t.loadingQuote}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
