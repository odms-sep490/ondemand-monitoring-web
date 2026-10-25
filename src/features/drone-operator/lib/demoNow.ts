import { env } from '../../../config/env'

// Keep design snapshots deterministic only for mock/demo data. Real Missions
// must use the current clock for dates, countdowns and "Hôm nay" grouping.
const DEMO_NOW_ISO = '2026-09-19T14:32:00+07:00'

export function demoNow(): Date {
  return env.useMockApi ? new Date(DEMO_NOW_ISO) : new Date()
}
