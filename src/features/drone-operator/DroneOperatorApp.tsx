import { UserProfilePage } from '../user/pages/UserProfilePage'
import { StaffSupportDashboardPage } from '../support/pages/StaffSupportDashboardPage'
import { SystemOperatorOverview } from '../system-operator/SystemOperatorOverview'
import { SystemOperatorDevicesScreen } from '../system-operator/pages/SystemOperatorDevicesScreen'
import { MissionActionGuard } from './components/common/MissionActionGuard'
import { useEffect, useState } from 'react'
import './staff.css'

import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useLanguage } from '../../shared/i18n'
import { operatorSidebarMessages } from './OperatorSidebar.messages'
import { operatorApi } from './api/operatorApi'
import { missionsByTab } from './lib/filterMissions'
import { demoNow } from './lib/demoNow'
import { OperatorLayout } from './OperatorLayout'
import SimulationZonesScreen from './pages/SimulationZones'
import { FlightPage } from './pages/Flight'
import { MissionDetailPage } from './pages/MissionDetail'
import { MissionListPage } from './pages/MissionList'
import { PlaceholderPage } from './components/common/PlaceholderPage'
import { AvailabilityPage } from './pages/Availability'
import { ConnectDronePage } from './pages/ConnectDrone'
import { HandoverPage } from './pages/Handover'
import { PostflightPage } from './pages/Postflight'
import { PreflightPage } from './pages/Preflight'
import { UploadMediaPage } from './pages/UploadMedia'
import { MaintenancePage } from './pages/Maintenance'
import { operatorActiveLabel } from './OperatorSidebar'
import {
  guardOperatorFlowRoute,
  operatorFlowStep,
  operatorHref,
  parseOperatorRoute,
  type OperatorRoute,
} from './routes'
import {
  getActiveMissionId,
  markActiveMissionFlowStep,
  setActiveMissionId,
} from './api/liveMission'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

export function DroneOperatorApp() {
  const hash = useHash()
  const route = parseOperatorRoute(hash)
  const [searchQuery, setSearchQuery] = useState('')
  const { lang } = useLanguage()
  const guardedRoute = guardOperatorFlowRoute(route, getActiveMissionId())

  useEffect(() => {
    if (guardedRoute) {
      window.location.hash = operatorHref(guardedRoute)
      return
    }
    const step = operatorFlowStep(route.screen)
    if (step === null || !('missionId' in route) || !route.missionId) return
    setActiveMissionId(route.missionId)
    markActiveMissionFlowStep(route.missionId, step)
  }, [guardedRoute, route])

  const missionsQuery = useApiQuery(
    (signal) => operatorApi.listMissions(undefined, signal),
    [],
  )
  const now = demoNow()
  const pendingCount = missionsByTab(
    missionsQuery.data?.items ?? [],
    'pending',
    now,
  ).length

  if (guardedRoute) return null

  // Buồng lái renders full-screen without the shell, same as OMSS.
  if (route.screen === 'flight') {
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="flight"
      >
        <FlightPage missionId={route.missionId} />
      </MissionActionGuard>
    )
  }

  return (
    <OperatorLayout
      route={route}
      pendingCount={pendingCount}
      notificationCount={2}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      fillContent={route.screen === 'zoneMap'}
    >
      {renderScreen(route, searchQuery, lang)}
    </OperatorLayout>
  )
}

function renderScreen(
  route: OperatorRoute,
  searchQuery: string,
  lang: 'vi' | 'en',
) {
  if (route.screen === 'missions')
    return <MissionListPage searchQuery={searchQuery} />
  if (route.screen === 'missionDetail')
    return <MissionDetailPage missionId={route.missionId} />
  if (route.screen === 'availability') return <AvailabilityPage />
  if (route.screen === 'connect')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="connect"
      >
        <ConnectDronePage missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'handover')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="handover"
      >
        <HandoverPage missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'preflight')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="preflight"
      >
        <PreflightPage missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'upload')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="upload"
      >
        <UploadMediaPage missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'postflight')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="postflight"
      >
        <PostflightPage missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'profile') return <UserProfilePage />
  if (route.screen === 'support') return <StaffSupportDashboardPage />
  if (route.screen === 'technical') return <SystemOperatorOverview />
  if (route.screen === 'devices') return <SystemOperatorDevicesScreen />
  if (route.screen === 'maintenance') return <MaintenancePage />
  if (route.screen === 'zoneMap') return <SimulationZonesScreen />
  return (
    <PlaceholderPage
      title={
        operatorActiveLabel(route.screen, lang) ||
        operatorSidebarMessages[lang].notFoundTitle
      }
    />
  )
}
