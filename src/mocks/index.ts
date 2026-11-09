// Central entry point for the mock API. `httpClient.ts` dynamically imports
// this module the first time it needs `mockFetch`, so importing it pulls in
// every handler module below and registers their routes exactly once.

import './handlers/auth'
import './handlers/managerDashboard'
import './handlers/customerOrdersBe'
import './handlers/customerMissionHistoryBe'
import './handlers/customerMissionReportBe'
import './handlers/customerMediaBe'
import './handlers/managerOrders'
import './handlers/managerMissions'
import './handlers/managerDrones'
import './handlers/managerMaintenance'
import './handlers/customerOrders'
import './handlers/adminAccounts'
import './handlers/adminCatalog'
import './handlers/customerCreateOrderBe'
import './handlers/weatherForecast'
import './handlers/catalogBe'
import './handlers/adminConfig'
import './handlers/adminAuditLog'
import './handlers/operatorMissions'
import './handlers/operatorAvailability'

export { mockFetch } from './mockServer'
