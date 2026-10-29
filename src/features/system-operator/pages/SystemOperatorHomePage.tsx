import { useEffect, useState } from 'react'

import { PageFrame } from '../../../shared/components/antd/PageFrame'
import { MaintenancePage } from '../../drone-operator/pages/Maintenance/MaintenancePage'
import { SystemOperatorOverview } from '../SystemOperatorOverview'
import { SystemOperatorDevicesScreen } from './SystemOperatorDevicesScreen'

/** Standalone entry for the system operator screens; the staff shell embeds the same screens directly. */
export function SystemOperatorHomePage() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <PageFrame>
      {hash === '#portal/staff/technical/maintenance' ? (
        <MaintenancePage />
      ) : hash === '#portal/staff/technical/devices' ? (
        <SystemOperatorDevicesScreen />
      ) : (
        <SystemOperatorOverview />
      )}
    </PageFrame>
  )
}
