// Mock for the backend "my missions" endpoints the Staff portal now calls directly:
//   GET /api/missions/mine
//   GET /api/missions/<seed mission id>
// Built from the same operator seed as the legacy /api/operator/* mocks, mapped to the
// backend mission shape. Detail routes are registered per seed id (not `:id`) so manager
// mission ids keep resolving through managerMissions.
//
// Opt-in (`VITE_MOCK_OPERATOR_MISSIONS=true`): without it `/api/missions/mine` stays on the
// real network path, which several Staff tests rely on to settle with no active mission.
import type { BackendMission } from '../../features/drone-operator/api/liveMission'
import type { OperatorMission } from '../../features/drone-operator/types/mission'
import seed from '../data/operator-missions.json'
import { ok, registerMockRoutes } from '../mockServer'

const STATUS: Record<string, string> = {
  PENDING: 'WAITING_OPERATOR_ACCEPTANCE',
  ACCEPTED: 'READY',
  IN_FLIGHT: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'READY',
}

function toBackend(mission: OperatorMission): BackendMission {
  const start = `${mission.date}T${mission.startTime}:00+07:00`
  const end = `${mission.date}T${mission.endTime}:00+07:00`
  const response =
    mission.status === 'PENDING'
      ? 'PENDING'
      : mission.status === 'REJECTED'
        ? 'REJECTED'
        : 'ACCEPTED'
  return {
    id: mission.id,
    missionCode: mission.id,
    orderTitle: mission.title,
    serviceName: mission.serviceLabel,
    address: mission.location,
    status: STATUS[mission.status] ?? 'READY',
    flightPermitStatus: 'APPROVED',
    scheduledStartAt: start,
    scheduledEndAt: end,
    startedAt: mission.flightStartedAt ?? null,
    deviceId: mission.droneCode,
    deviceCode: mission.droneCode,
    deviceName: mission.droneName,
    staffId: seed.profile.id,
    staffAssignments: [
      {
        staffId: seed.profile.id,
        staffName: seed.profile.fullName,
        assignedRole: 'PILOT',
        responseStatus: response,
      },
    ],
    deviceAssignments: [{ deviceId: mission.droneCode, deviceRole: 'MAIN' }],
  } as BackendMission
}

const missions = (seed.missions as OperatorMission[]).map(toBackend)

if (import.meta.env.VITE_MOCK_OPERATOR_MISSIONS === 'true') {
  registerMockRoutes([
    { method: 'GET', path: '/api/missions/mine', handler: () => ok(missions) },
    ...missions.map((mission) => ({
      method: 'GET' as const,
      path: `/api/missions/${mission.id}`,
      handler: () => ok(mission),
    })),
  ])
}
