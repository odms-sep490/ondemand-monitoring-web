import { createRoot } from 'react-dom/client'
import { SmartQuoteAssistant } from '../../src/features/finance/SmartQuoteAssistant'
import { ManagerPricingPanel } from '../../src/features/finance/ManagerPricing/ManagerPricingPanel'
import { setHttpTransport } from '../../src/shared/api/httpClient'
import '../../src/styles/global.css'
import '../../src/styles/odm.css'
import '../../src/features/manager/manager.css'

// Browser tests control responses without relying on the app's mock seed data.
setHttpTransport((input, init) => fetch(input, init))
const pricing = location.search.includes('manager-pricing')
createRoot(document.getElementById('root')!).render(
  <main className="odm-manager" style={{ padding: 16, maxWidth: pricing ? 1500 : 800, margin: 'auto' }}>
    {pricing ? <ManagerPricingPanel orderId="o" /> : <SmartQuoteAssistant orderId="o" quoteId="q" customer={!location.search.includes('manager')} />}
  </main>,
)
