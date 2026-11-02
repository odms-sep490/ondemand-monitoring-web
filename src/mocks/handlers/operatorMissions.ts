// Mock handlers for the Drone Operator portal (OPR-xxW):
//   GET /api/operator/profile
//   GET /api/operator/missions[?tab=pending|upcoming|history]
//   GET /api/operator/missions/:id
import { missionsByTab } from '../../features/drone-operator/lib/filterMissions'
import { postflightSummary } from '../../features/drone-operator/lib/postflightSummary'
import type {
  ControlHandover,
  FaultType,
  FlightConnection,
  MaintenanceSeverity,
  MaintenanceTicket,
  MediaFile,
  OperatorMission,
  OperatorMissionTab,
  OperatorProfile,
  PostflightItem,
  PostflightRecord,
  PreflightItem,
  PreflightRecord,
} from '../../features/drone-operator/types/mission'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import mediaSeed from '../data/operator-media.json'
import seed from '../data/operator-missions.json'
import authSeed from '../data/auth-users.json'

const POSTFLIGHT_TOTAL = 6

const profile = seed.profile as OperatorProfile
const missions = createCollection(
  seed.missions as OperatorMission[],
) as unknown as OperatorMission[]

const connections = createCollection({} as Record<string, FlightConnection>)
const handovers = createCollection({} as Record<string, ControlHandover>)
const preflights = createCollection({} as Record<string, PreflightRecord>)
const postflights = createCollection({} as Record<string, PostflightRecord>)
const mediaByMission = createCollection({
  'MSN-2609-0142-1': mediaSeed.files as MediaFile[],
} as Record<string, MediaFile[]>)
const maintenanceTickets = createCollection([] as MaintenanceTicket[])

const TABS: OperatorMissionTab[] = ['pending', 'upcoming', 'history']

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/missions/:id/permissions',
    handler: ({ params, headers }) => {
      const token = headers.get('Authorization')?.replace(/^Bearer /i, '')
      const user = authSeed.users.find((entry) => entry.accessToken === token)
      if (!user) return fail(401, 'UNAUTHORIZED', 'Sign in first')
      const mission = missions.find((entry) => entry.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const owner = user.role === 'STAFF' && user.id === profile.id
      if (!owner && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        return fail(403, 'FORBIDDEN', 'Not assigned to this mission')
      }
      // The demo fixture assigns the profile as PILOT without optional specialists.
      const accepted =
        owner && ['ACCEPTED', 'IN_FLIGHT'].includes(mission.status)
      return ok({
        canRespond: owner && mission.status === 'PENDING',
        canControlFlight: accepted,
        canInspectDevice: accepted,
        canOperatePayload: accepted,
        canMaintainDevice: false,
        canUploadMedia: accepted || (owner && mission.status === 'COMPLETED'),
      })
    },
  },
  {
    method: 'GET',
    path: '/api/operator/profile',
    handler: () => ok(profile),
  },
  {
    method: 'GET',
    path: '/api/operator/missions',
    handler: ({ query }) => {
      const tab = query.get('tab') as OperatorMissionTab | null
      if (tab && !TABS.includes(tab)) {
        return fail(400, 'INVALID_TAB', `Unknown tab: ${tab}`)
      }
      const items = tab ? missionsByTab(missions, tab, new Date()) : missions
      return ok({ items })
    },
  },
  {
    method: 'GET',
    path: '/api/operator/missions/:id',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      return ok(mission)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/accept',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      if (mission.status !== 'PENDING') {
        return fail(409, 'INVALID_STATE', 'Mission is not pending')
      }
      mission.status = 'ACCEPTED'
      mission.acceptedAt = new Date().toISOString()
      return ok(mission)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/reject',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      if (mission.status !== 'PENDING') {
        return fail(409, 'INVALID_STATE', 'Mission is not pending')
      }
      const { reason, notes } = (body ?? {}) as {
        reason?: string
        notes?: string
      }
      if (!reason) return fail(400, 'REASON_REQUIRED', 'Reason is required')
      mission.status = 'REJECTED'
      mission.rejectReason = notes ? `${reason}: ${notes}` : reason
      return ok(mission)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/connect',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const { gcsId } = (body ?? {}) as {
        gcsId?: string
      }
      if (!gcsId) return fail(400, 'GCS_REQUIRED', 'gcs_identifier is required')
      const connection: FlightConnection = {
        status: 'CONNECTED',
        gcsId,
        connectedAt: new Date().toISOString(),
      }
      connections[mission.id] = connection
      return ok(connection)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/handover',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      if (
        !connections[mission.id] ||
        connections[mission.id].status !== 'CONNECTED'
      ) {
        return fail(409, 'NOT_CONNECTED', 'Drone chưa kết nối GCS')
      }
      const handover: ControlHandover = {
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
      }
      handovers[mission.id] = handover
      return ok(handover)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/preflight',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const { items } = (body ?? {}) as { items?: PreflightItem[] }
      if (!Array.isArray(items) || items.length === 0) {
        return fail(400, 'ITEMS_REQUIRED', 'Checklist items are required')
      }
      const invalidFail = items.find(
        (item) => item.result === 'fail' && !item.note,
      )
      if (invalidFail) {
        return fail(
          400,
          'NOTE_REQUIRED',
          `Ghi chú lỗi bắt buộc cho ${invalidFail.key}`,
        )
      }
      const record: PreflightRecord = {
        items,
        savedAt: new Date().toISOString(),
      }
      preflights[mission.id] = record
      return ok(record)
    },
  },
  {
    method: 'GET',
    path: '/api/operator/missions/:id/media',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const files = mediaByMission[mission.id] ?? []
      return ok({ files })
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/media/:fileId/retry',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const files = mediaByMission[mission.id] ?? []
      const file = files.find((f) => f.id === params.fileId)
      if (!file) return fail(404, 'NOT_FOUND', 'Media file not found')
      if (file.attempt >= file.maxAttempts) {
        return fail(409, 'MAX_ATTEMPTS', 'Đã đạt số lần thử tối đa')
      }
      file.attempt += 1
      file.status = 'UPLOADED'
      file.progressPct = 100
      return ok(file)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/postflight',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const { items, notes } = (body ?? {}) as {
        items?: PostflightItem[]
        notes?: string
      }
      if (!Array.isArray(items) || items.length !== POSTFLIGHT_TOTAL) {
        return fail(400, 'ITEMS_REQUIRED', 'Checklist items are required')
      }
      const summary = postflightSummary(items, POSTFLIGHT_TOTAL)
      const record: PostflightRecord = {
        items,
        overallOk: summary.overallOk,
        notes,
        savedAt: new Date().toISOString(),
      }
      postflights[mission.id] = record
      if (summary.overallOk) {
        mission.status = 'COMPLETED'
        mission.completedAt = record.savedAt
      }
      return ok(record)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/maintenance-ticket',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const { issueType, severity, description } = (body ?? {}) as {
        issueType?: FaultType
        severity?: MaintenanceSeverity
        description?: string
      }
      if (!issueType)
        return fail(400, 'ISSUE_TYPE_REQUIRED', 'issue_type is required')
      if (!severity)
        return fail(400, 'SEVERITY_REQUIRED', 'severity is required')
      const ticket: MaintenanceTicket = {
        id: `MTK-${String(maintenanceTickets.length + 1).padStart(4, '0')}`,
        droneCode: mission.droneCode ?? '',
        missionId: mission.id,
        issueType,
        severity,
        description: description ?? '',
        createdAt: new Date().toISOString(),
      }
      maintenanceTickets.push(ticket)
      return ok(ticket)
    },
  },
])
