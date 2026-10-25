import { createRoot } from 'react-dom/client'
import InFlightControl from '../../src/features/drone-operator/pages/Flight/components/InFlightControl'
import type { Drone, Mission } from '../../src/features/drone-operator/types/omss'

const mission = {
  id: 'MS-1', orderRef: 'O', title: 'M', state: 'IN_FLIGHT', priority: 'NORMAL', droneId: 'DRN-1',
  operatorId: 'OP', customer: 'C', location: 'L', lat: 10.83, lng: 106.70,
  scheduledAt: new Date().toISOString(), estimatedMinutes: 20, distanceKm: 2, flightPlanId: 'P', maxAltitudeM: 60, notes: '',
} as Mission
const drone = { id: 'DRN-1', name: 'DRN-1', model: 'X500', serialNumber: 'S', state: 'ACTIVE_MISSION', battery: 90, gpsCount: 10, storageMB: 1 } as Drone
localStorage.setItem(`omss.droneOperator.preflightReady.${mission.id}.${drone.id}`, 'true')
createRoot(document.getElementById('root')!).render(
  <InFlightControl mission={mission} drone={drone} onRTB={() => {}} onEmergency={() => {}} autoStartPlan={false} onAutoStartPlanConsumed={() => {}} />,
)
