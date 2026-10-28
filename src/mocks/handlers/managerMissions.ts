// Mock handlers for MNG-04 through MNG-07. Endpoints:
//   POST   /api/missions                                  [BE]
//   GET    /api/missions?from=&to=&status=                [TK]
//   GET    /api/missions/{id}                             [BE]
//   GET    /api/missions/{id}/resource-suggestions        [BRIEF C4]
//   PATCH  /api/missions/{id}/schedule                   [ĐỀ XUẤT]
//   GET    /api/missions/{id}/live                        [BRIEF C4]
//   POST   /api/missions/{id}/incidents                  [ĐỀ XUẤT]
//   POST   /api/missions/{id}/cancel                     [ĐỀ XUẤT]
//   POST   /api/missions/{id}/assign-drone?droneId=       [BE]
//   POST   /api/missions/{id}/assign-operator?operatorId= [BE]
//   POST   /api/missions/{id}/assignments/{aid}/release   [BRIEF C4 = TK]
import type {
  Mission,
} from '../../features/manager/types/missions'
import type { MissionStatus } from '../../shared/types/domain'
// Loose shape: the manager client no longer calls resource-suggestions, so the
// typed DTO was removed from the app; this legacy mock handler keeps a local one.
type ResourceSuggestions = { timeline: unknown; [key: string]: unknown }

import { NO_FLY_CEILING_M } from '../../features/manager/lib/missionPolicy'
import { hasScheduleConflict } from '../../features/manager/lib/schedule'
import { createCollection } from '../db'
import {
  fail,
  ok,
  created,
  registerMockRoutes,
  type MockContext,
} from '../mockServer'
import resourceSuggestionsSeed from '../data/resource-suggestions.json'
import dronesSeed from '../data/drones.json'
import operatorsSeed from '../data/operators.json'
import calendarSeed from '../data/missions-calendar.json'
import { findOrder } from './ordersStore'
import {
  findMissionById,
  findMissionsForOrder,
  missions,
  newMinimalMission,
  type StoredMission,
} from './missionsStore'

// PROPOSED deterministic trigger for the 422 FLIGHT_PLAN_GENERATION_FAILED
// state [TK MNG-04] — no source gives a real generator failure condition.
const FLIGHT_PLAN_RADIUS_FAILURE_LIMIT_M = 800

type SeedDrone = {
  id: string
  code: string
  name?: string
  status: string
  existingBookings?: { missionCode: string; start: string; end: string }[]
}

type SeedOperator = {
  id: string
  code: string | null
  fullName: string
}

const suggestions = createCollection(
  resourceSuggestionsSeed,
) as typeof resourceSuggestionsSeed
const drones = createCollection(dronesSeed.items) as SeedDrone[]
const operators = createCollection(operatorsSeed.operators) as SeedOperator[]

// Calendar-specific missions for MNG-06/07 (list + live endpoints).
// These are separate from `missions` (which backs MNG-04/05 single-mission
// endpoints) to avoid mutating the P4/P5 seed. Both collections are searched
// by findMissionById / list; calendar items also carry extra display fields
// (droneCode, droneName, operatorName, serviceLabel) not present on StoredMission.
type CalendarMission = StoredMission & {
  droneCode: string | null
  droneName: string | null
  operatorName: string | null
  serviceLabel: string | null
}

const calendarMissions = createCollection(
  calendarSeed.missions,
) as unknown as CalendarMission[]

// In-memory incident log keyed by missionId. PROPOSED: table `mission_incident` [BRIEF A6].
const incidentLog: Record<
  string,
  Array<{
    id: string
    type: string
    description: string
    reportedAt: string
  }>
> = {}

/** Find a mission by id/code across BOTH the P4/P5 store and the calendar store. */
function findAnyMission(
  id: string,
): StoredMission | CalendarMission | undefined {
  return (
    findMissionById(id) ??
    calendarMissions.find((m) => m.id === id || m.missionCode === id)
  )
}

function toMissionDto(m: StoredMission): Mission {
  return {
    id: m.id,
    orderId: m.orderId,
    orderCode: m.orderCode,
    missionCode: m.missionCode,
    status: m.status,
    droneId: m.droneId,
    operatorId: m.operatorId,
    droneAssignmentId: m.droneAssignmentId,
    operatorAssignmentId: m.operatorAssignmentId,
    scheduledStartAt: m.scheduledStartAt,
    scheduledEndAt: m.scheduledEndAt,
    lastRescheduleReason: m.lastRescheduleReason ?? null,
    lastRescheduleNote: m.lastRescheduleNote ?? null,
    lastRescheduledAt: m.lastRescheduledAt ?? null,
    scheduleRevision: m.scheduleRevision ?? 0,
    addressText: m.addressText,
    centerLat: m.centerLat,
    centerLon: m.centerLon,
    radiusM: m.radiusM,
    requiredSensor: m.requiredSensor,
    mediaRequirements: m.mediaRequirements as Mission['mediaRequirements'],
    flightPlan: m.flightPlan as Mission['flightPlan'],
    waypoints: m.waypoints as Mission['waypoints'],
  }
}

// P6: `GET /api/missions/pending-assignment` [BE] — maps a mission (from
// either the P4/P5 store or the calendar store) to the BE `MissionResponse`
// DTO shape. Calendar missions have no BE-only fields seeded (orderTitle,
// customerName, etc.) — those fall back to null/derived values below rather
// than being invented.
function toMissionResponse(m: StoredMission | CalendarMission) {
  const asStored = m as Partial<StoredMission> &
    Partial<{
      orderTitle: string | null
      customerName: string | null
      droneCode: string | null
      latitude: number | null
      longitude: number | null
      address: string | null
      startedAt: string | null
      completedAt: string | null
      description: string | null
      failureReason: string | null
      rejectionReason: string | null
      mediaType: 'IMAGE' | 'VIDEO' | 'STREAMING' | null
      plan: unknown
      preflightRetryCount: number
      preflightPassed: boolean
      preflightFaultType: string | null
      preflightFailureReason: string | null
      preflightCheckedAt: string | null
    }>
  const calendarFields = m as Partial<CalendarMission>
  const droneId = asStored.droneId ?? null
  const drone = droneId
    ? drones.find((item) => item.id === droneId || item.code === droneId)
    : undefined
  const droneCode = asStored.droneCode ?? calendarFields.droneCode ?? drone?.code ?? null
  const droneName = calendarFields.droneName ?? drone?.name ?? null
  return {
    id: m.id,
    orderId: m.orderId,
    orderTitle:
      asStored.orderTitle ?? calendarFields.serviceLabel ?? m.orderCode,
    customerName: asStored.customerName ?? null,
    missionCode: m.missionCode,
    status: m.status,
    operatorId: m.operatorId,
    droneId,
    deviceId: droneId,
    deviceCode: droneCode,
    droneCode,
    droneName,
    latitude: asStored.latitude ?? m.centerLat,
    longitude: asStored.longitude ?? m.centerLon,
    address: asStored.address ?? m.addressText,
    scheduledStartAt: m.scheduledStartAt,
    startedAt: asStored.startedAt ?? null,
    completedAt: asStored.completedAt ?? null,
    description: asStored.description ?? null,
    failureReason: asStored.failureReason ?? null,
    rejectionReason: asStored.rejectionReason ?? null,
    mediaType: asStored.mediaType ?? null,
    plan: asStored.plan ?? null,
    preflightRetryCount: asStored.preflightRetryCount ?? 0,
    preflightPassed: asStored.preflightPassed ?? false,
    preflightFaultType: asStored.preflightFaultType ?? null,
    preflightFailureReason: asStored.preflightFailureReason ?? null,
    preflightCheckedAt: asStored.preflightCheckedAt ?? null,
  }
}

registerMockRoutes([
  // ── P6: pending resource assignment queue [BE] ──────────────────────────
  {
    method: 'GET',
    path: '/api/missions/pending-assignment',
    handler: () => {
      const all: (StoredMission | CalendarMission)[] = [
        ...missions,
        ...calendarMissions,
      ]
      const items = all
        .filter(
          (m) => m.status === 'CREATED' || m.status === 'RESOURCE_ASSIGNING',
        )
        .map(toMissionResponse)
      return ok({ items })
    },
  },

  // ── MNG-06/08: list missions in a date range [TK] ──────────────────────
  {
    method: 'GET',
    path: '/api/missions',
    handler: ({ query }) => {
      const from = query.get('from')
      const to = query.get('to')
      const statusFilter = query.get('status')

      // Merge both stores; calendar missions include richer display fields.
      const all: (StoredMission | CalendarMission)[] = [
        ...missions,
        ...calendarMissions,
      ]

      const items = all.filter((m) => {
        if (statusFilter && m.status !== statusFilter) return false
        if (!from && !to) return true
        const start = m.scheduledStartAt
        const end = m.scheduledEndAt
        if (!start) return false
        if (from && end && end < from) return false
        if (to && start && start > `${to}T23:59:59`) return false
        return true
      })

      return ok({ items })
    },
  },

  // ── MNG-06: update mission schedule ───────────────────────────────────
  {
    method: 'PATCH',
    path: '/api/missions/:id/schedule',
    handler: ({ params, body }) => {
      const mission = findAnyMission(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')

      const req = (body ?? {}) as {
        scheduledStartAt?: string
        scheduledEndAt?: string
        reason?: string
        note?: string
        customerConfirmed?: boolean
      }
      if (!req.scheduledStartAt || !req.scheduledEndAt || !req.reason) {
        return fail(
          400,
          'VALIDATION_ERROR',
          'Thiếu lịch mới hoặc lý do đổi lịch',
          {
            scheduledStartAt: 'Bắt buộc',
            scheduledEndAt: 'Bắt buộc',
            reason: 'Bắt buộc',
          },
        )
      }

      // Check for conflict with OTHER missions (same drone) [P5 helper].
      if (mission.droneId) {
        const otherMissions = [...missions, ...calendarMissions].filter(
          (m) =>
            m.id !== mission.id &&
            m.droneId === mission.droneId &&
            m.scheduledStartAt &&
            m.scheduledEndAt,
        )
        const bookings = otherMissions.map((m) => ({
          start: m.scheduledStartAt!,
          end: m.scheduledEndAt!,
          missionCode: m.missionCode,
        }))
        const conflict = hasScheduleConflict(
          { start: req.scheduledStartAt, end: req.scheduledEndAt },
          bookings,
        )
        if (conflict) {
          return fail(
            409,
            'SCHEDULE_CONFLICT',
            `Khung giờ trùng với ${conflict.missionCode} (${conflict.start.slice(11, 16)}–${conflict.end.slice(11, 16)}). Chọn khung giờ khác.`,
          )
        }
      }

      mission.scheduledStartAt = req.scheduledStartAt
      mission.scheduledEndAt = req.scheduledEndAt
      mission.lastRescheduleReason = req.reason as Mission['lastRescheduleReason']
      mission.lastRescheduleNote = req.note ?? null
      mission.lastRescheduledAt = new Date().toISOString()
      mission.scheduleRevision = (mission.scheduleRevision ?? 0) + 1
      return ok(toMissionDto(mission), 'Đã cập nhật lịch bay')
    },
  },

  // ── MNG-07: live telemetry polling [BRIEF C4] ──────────────────────────
  {
    method: 'GET',
    path: '/api/missions/:id/live',
    handler: ({ params }) => {
      const mission = findAnyMission(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')

      const isMSN0142 =
        mission.id === 'msn-2609-0142-1' ||
        mission.missionCode === 'MSN-2609-0142-1'

      if (isMSN0142) {
        // Seed values for MSN-2609-0142-1 come from evd/design/MNG-07.dc.html
        // "Đang bay" state. Lightweight variation: add small drift each call
        // so repeated polls look like live data.
        const batteryPct = 71
        const flightTimeSec = 58 * 60
        const latitude = 10.7845
        const longitude = 106.7228
        const altitudeM = 68
        const speedMs = 6.2
        // signalDbm — PROPOSED: not shown as a number in design, design shows
        // "18 GPS" (satellite count); using -72 as a plausible strong signal.
        const signalDbm = -72
        // PROPOSED: livestream fields — design shows a LIVE badge + "00:12:41"
        // counter and "1080p · WebRTC"; sessionId/playbackUrl are invented.
        const livestream = {
          sessionId: 'ls-0142-1-live',
          playbackUrl: null, // PROPOSED: no real URL in design
          isLive: true,
        }
        return ok({
          missionStatus: 'IN_FLIGHT' as MissionStatus,
          droneStatus: 'IN_MISSION',
          droneCode: 'DRN-02',
          droneName: 'Hải Âu',
          operatorName: 'Hoàng Đức Thắng',
          batteryPct,
          flightTimeSec,
          latitude,
          longitude,
          altitudeM,
          speedMs,
          signalDbm,
          satelliteCount: 18,
          connectionStatus: 'CONNECTED',
          telemetryActive: true,
          lastTelemetryAt: new Date(Date.now() - 1000).toISOString(),
          activeIncidents: incidentLog[mission.id] ?? [],
          livestream,
        })
      }

      // Generic live state for other active missions
      return ok({
        missionStatus: mission.status as MissionStatus,
        droneStatus: null,
        droneCode: (mission as CalendarMission).droneCode ?? null,
        droneName: (mission as CalendarMission).droneName ?? null,
        operatorName: (mission as CalendarMission).operatorName ?? null,
        batteryPct: null,
        flightTimeSec: null,
        latitude: mission.centerLat,
        longitude: mission.centerLon,
        altitudeM: null,
        speedMs: null,
        signalDbm: null,
        satelliteCount: null,
        connectionStatus: null,
        telemetryActive: false,
        lastTelemetryAt: null,
        activeIncidents: incidentLog[mission.id] ?? [],
        livestream: null,
      })
    },
  },

  // ── MNG-07: report an incident [ĐỀ XUẤT — table mission_incident BRIEF A6] ──
  {
    method: 'POST',
    path: '/api/missions/:id/incidents',
    handler: ({ params, body }) => {
      const mission = findAnyMission(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')

      const req = (body ?? {}) as { type?: string; description?: string }
      if (!req.type || !req.description?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Thiếu type hoặc description', {
          ...(req.type ? {} : { type: 'Bắt buộc' }),
          ...(!req.description?.trim() ? { description: 'Bắt buộc' } : {}),
        })
      }

      if (!incidentLog[mission.id]) incidentLog[mission.id] = []
      const incident = {
        id: `inc-${mission.id}-${Date.now()}`,
        type: req.type,
        description: req.description,
        reportedAt: new Date().toISOString(),
      }
      incidentLog[mission.id].push(incident)
      return created(incident, 'Đã ghi nhận sự cố')
    },
  },

  // ── MNG-08: retry a FAILED mission [ĐỀ XUẤT] ──────────────────────────
  {
    method: 'POST',
    path: '/api/missions/:id/retry',
    handler: ({ params }) => {
      const mission = findAnyMission(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      if (mission.status !== 'FAILED') {
        return fail(
          422,
          'INVALID_STATUS',
          'Chỉ có thể tạo lại mission ở trạng thái FAILED',
        )
      }
      const newMissionId = `${mission.id}-retry-${Date.now()}`
      // Create a shallow copy as the new mission
      const newMission: StoredMission = {
        ...mission,
        id: newMissionId,
        missionCode: `${mission.missionCode}-RETRY`,
        status: 'CREATED',
        attemptNumber: (mission.attemptNumber ?? 1) + 1,
        droneId: null,
        operatorId: null,
        droneAssignmentId: null,
        operatorAssignmentId: null,
      }
      missions.push(newMission)
      return ok({ newMissionId }, 'Đã tạo lại mission')
    },
  },

  // ── MNG-07: cancel a mission [ĐỀ XUẤT — field cancellation_reason BRIEF A6] ──
  {
    method: 'POST',
    path: '/api/missions/:id/cancel',
    handler: ({ params, body }) => {
      const mission = findAnyMission(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')

      const req = (body ?? {}) as { reason?: string }
      if (!req.reason?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Yêu cầu nhập lý do huỷ', {
          reason: 'Bắt buộc',
        })
      }

      mission.status = 'CANCELLED'
      return ok(toMissionDto(mission), 'Mission đã bị huỷ')
    },
  },

  // ── MNG-04/05 routes (P5, unchanged) ──────────────────────────────────
  {
    method: 'POST',
    path: '/api/missions/:id',
    handler: ({ params, body }) => {
      const req = (body ?? {}) as {
        scheduledStart?: string
        scheduledEnd?: string
        scheduledStartAt?: string
        scheduledEndAt?: string
        flightPlan?: {
          planType: 'ORBIT' | 'GRID' | 'POINT'
          centerLat: number
          centerLon: number
          radiusM: number
          altitudeM: number
          speedMs: number | null
          estimatedDurationSec: number
          generatedBy: 'SYSTEM' | 'MANUAL'
        }
        waypoints?: StoredMission['waypoints']
      }
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'APPROVED') {
        return fail(
          409,
          'ORDER_NOT_APPROVED',
          'Đơn chưa được duyệt, chưa thể tạo nhiệm vụ.',
        )
      }

      const scheduledStart = req.scheduledStartAt ?? req.scheduledStart
      const scheduledEnd = req.scheduledEndAt ?? req.scheduledEnd
      if (!scheduledStart || !scheduledEnd) {
        return fail(
          400,
          'VALIDATION_ERROR',
          'Thiếu thông tin lịch bay',
          { scheduledStart: 'Lịch bay là bắt buộc' },
        )
      }

      if (req.flightPlan && req.flightPlan.altitudeM > NO_FLY_CEILING_M) {
        return fail(
          400,
          'VALIDATION_ERROR',
          `Độ cao ${req.flightPlan.altitudeM} m vượt trần cấm bay ${NO_FLY_CEILING_M} m.`,
          { altitudeM: `Không được vượt quá ${NO_FLY_CEILING_M} m` },
        )
      }

      if (req.flightPlan && req.flightPlan.radiusM > FLIGHT_PLAN_RADIUS_FAILURE_LIMIT_M) {
        return fail(
          422,
          'FLIGHT_PLAN_GENERATION_FAILED',
          'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Bạn có thể nhập waypoint thủ công.',
        )
      }

      // If older seed data already has a bare CREATED mission without a
      // plan, attach this request's plan/schedule to it. Otherwise the staff
      // scheduling flow creates the first mission attempt here.
      const existing = findMissionsForOrder(order.id).find(
        (m) => m.status === 'CREATED' && !m.flightPlan,
      )
      const mission = existing ?? newMinimalMission(order.id, order.code)
      if (!existing) missions.push(mission)

      mission.scheduledStartAt = scheduledStart
      mission.scheduledEndAt = scheduledEnd
      if (req.flightPlan) {
        mission.flightPlan = req.flightPlan
        mission.waypoints = req.waypoints ?? []
        mission.centerLat = req.flightPlan.centerLat
        mission.centerLon = req.flightPlan.centerLon
        mission.radiusM = req.flightPlan.radiusM
      }

      return created(toMissionDto(mission), 'Đã tạo flight plan cho mission')
    },
  },
  {
    method: 'GET',
    path: '/api/missions/:id',
    handler: ({ params }) => {
      const mission = findAnyMission(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      return ok(toMissionDto(mission))
    },
  },
  {
    method: 'GET',
    path: '/api/missions/:id/resource-suggestions',
    handler: ({ params, query }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const scenarios = (
        suggestions as unknown as {
          byMission: Record<
            string,
            {
              default: ResourceSuggestions
              insufficient: ResourceSuggestions
            }
          >
          timeline: Record<string, ResourceSuggestions['timeline']>
        }
      ).byMission[mission.id]
      if (!scenarios) {
        const fallback = (
          suggestions as unknown as {
            byMission: Record<
              string,
              { default: ResourceSuggestions; insufficient: ResourceSuggestions }
            >
          }
        ).byMission['msn-2609-0153-1']
        if (!fallback)
          return fail(404, 'NOT_FOUND', 'Chưa có gợi ý nguồn lực.')
        const scenario = query.get('scenario')
        const base =
          scenario === 'insufficient' ? fallback.insufficient : fallback.default
        return ok({
          ...base,
          missionCode: mission.missionCode,
          attemptNumber: mission.attemptNumber,
          scheduledStart: mission.scheduledStartAt ?? '',
          scheduledEnd: mission.scheduledEndAt ?? '',
          addressText: mission.addressText,
          centerLat: mission.centerLat,
          centerLon: mission.centerLon,
          radiusM: mission.radiusM,
          timeline: { date: '', windowStart: '', windowEnd: '', resources: [] },
        })
      }
      const scenario = query.get('scenario')
      const base =
        scenario === 'insufficient' ? scenarios.insufficient : scenarios.default
      const timeline = (
        suggestions as unknown as {
          timeline: Record<string, ResourceSuggestions['timeline']>
        }
      ).timeline[mission.id]

      const response: ResourceSuggestions = {
        ...base,
        missionCode: mission.missionCode,
        attemptNumber: mission.attemptNumber,
        scheduledStart: mission.scheduledStartAt ?? '',
        scheduledEnd: mission.scheduledEndAt ?? '',
        addressText: mission.addressText,
        centerLat: mission.centerLat,
        centerLon: mission.centerLon,
        radiusM: mission.radiusM,
        mediaSummary:
          mission.mediaRequirements.length > 0
            ? mission.mediaRequirements
                .map((r) =>
                  r.mediaType === 'VIDEO'
                    ? `VIDEO ${r.quantity} × ${r.durationSec} s`
                    : r.mediaType === 'PHOTO'
                      ? `PHOTO ${r.quantity}${'width' in r ? ` · ${r.width}×${r.height}` : ''}`
                      : `LIVESTREAM ${r.quantity} × ${r.durationSec} s`,
                )
                .join(' · ')
            : null,
        requiredDurationLabel: mission.flightPlan
          ? `T_required ≈ ${Math.round(mission.flightPlan.estimatedDurationSec / 60)} phút (${mission.flightPlan.planType}, ${mission.flightPlan.altitudeM} m)`
          : null,
        requiredSensor: mission.requiredSensor,
        nearestBase: mission.nearestBase,
        timeline: timeline ?? {
          date: '',
          windowStart: '',
          windowEnd: '',
          resources: [],
        },
      }
      return ok(response)
    },
  },
  // `/assign-device` is the current BE contract (JSON body); `/assign-drone`
  // is the legacy query-string form kept for older callers.
  ...['/api/missions/:id/assign-device', '/api/missions/:id/assign-drone'].map(
    (path) => ({
    method: 'POST' as const,
    path,
    handler: ({ params, query, body }: MockContext) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const droneId =
        query.get('droneId') ?? (body as { deviceId?: string } | null)?.deviceId
      if (!droneId) {
        return fail(400, 'VALIDATION_ERROR', 'Thiếu droneId', {
          droneId: 'droneId là bắt buộc',
        })
      }
      const drone = drones.find((d) => d.id === droneId || d.code === droneId)
      if (!drone) return fail(404, 'NOT_FOUND', 'Không tìm thấy drone')

      if (mission.scheduledStartAt && mission.scheduledEndAt) {
        const conflict = hasScheduleConflict(
          { start: mission.scheduledStartAt, end: mission.scheduledEndAt },
          drone.existingBookings ?? [],
        )
        if (conflict) {
          return fail(
            409,
            'SCHEDULE_CONFLICT',
            `Máy chủ từ chối: khung ${conflict.start.slice(11, 16)}–${conflict.end.slice(11, 16)} vừa bị ${conflict.missionCode} chiếm (ràng buộc EXCLUDE trên scheduled_range). Chọn drone khác hoặc đổi giờ mission.`,
          )
        }
      }

      mission.droneId = drone.id
      mission.droneAssignmentId = `mda-${mission.id}-${drone.id}`
      mission.status = mission.operatorId
        ? 'WAITING_OPERATOR_ACCEPTANCE'
        : 'RESOURCE_ASSIGNING'
      return ok(toMissionDto(mission), 'Đã gán Drone thành công')
    },
    }),
  ),
  // `/assign-staff` is the current BE contract; `/assign-operator` is legacy.
  ...['/api/missions/:id/assign-staff', '/api/missions/:id/assign-operator'].map(
    (path) => ({
    method: 'POST' as const,
    path,
    handler: ({ params, query, body }: MockContext) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const operatorId =
        query.get('operatorId') ?? (body as { staffId?: string } | null)?.staffId
      if (!operatorId) {
        return fail(400, 'VALIDATION_ERROR', 'Thiếu operatorId', {
          operatorId: 'operatorId là bắt buộc',
        })
      }
      const operator = operators.find(
        (o) => o.id === operatorId || o.code === operatorId,
      )
      if (!operator) return fail(404, 'NOT_FOUND', 'Không tìm thấy phi công')

      mission.operatorId = operator.id
      mission.operatorAssignmentId = `moa-${mission.id}-${operator.id}`
      mission.status = mission.droneId
        ? 'WAITING_OPERATOR_ACCEPTANCE'
        : 'RESOURCE_ASSIGNING'
      return ok(toMissionDto(mission), 'Đã gán Operator thành công')
    },
    }),
  ),
  {
    method: 'POST',
    path: '/api/missions/:id/assignments/:aid/release',
    handler: ({ params, body }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const { releaseReason } = (body ?? {}) as { releaseReason?: string }
      if (!releaseReason || !releaseReason.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Yêu cầu nhập lý do thu hồi', {
          releaseReason: 'Lý do là bắt buộc',
        })
      }
      if (
        params.aid !== mission.droneAssignmentId &&
        params.aid !== mission.operatorAssignmentId
      ) {
        return fail(404, 'NOT_FOUND', 'Không tìm thấy assignment')
      }
      if (params.aid === mission.droneAssignmentId) {
        mission.droneId = null
        mission.droneAssignmentId = null
      }
      if (params.aid === mission.operatorAssignmentId) {
        mission.operatorId = null
        mission.operatorAssignmentId = null
      }
      mission.status = 'CREATED'
      return ok(toMissionDto(mission), 'Đã thu hồi phân công')
    },
  },
])

/** Test-only escape hatch to assert on the in-memory mock collections. */
export const __testing = {
  missions,
  drones,
  operators,
  calendarMissions,
  incidentLog,
}
