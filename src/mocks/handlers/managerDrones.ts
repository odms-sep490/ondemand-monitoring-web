// Mock handlers for MNG-09. Endpoints:
//   GET    /api/drones?status=&page=&pageSize=    [BE DroneController]
//   PATCH  /api/drones/{id}/status               [ĐỀ XUẤT]
import type { DroneStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import { created, fail, ok, registerMockRoutes } from '../mockServer'
import dronesSeed from '../data/drones.json'

type SeedDroneModel = {
  id: string
  modelCode: string
  manufacturer: string
  category: string
  maxFlightTimeMinutes: number
  maxTakeoffWeightKg: number
  maxFlightAltitudeMeters: number
  maxWindResistanceMetersPerSecond: number
  ipRating: string
  specsMetadata: string
  createdAt: string
  updatedAt: string
  version: number
}

type SeedDronePayload = {
  id: string
  modelName: string
  sensorType: string
  weightKg: number
  payloadCapabilities: string
  createdAt: string
  updatedAt: string
  version: number
}

type SeedDrone = {
  id: string
  code: string
  name: string | null
  serialNumber: string | null
  droneModelName: string | null
  status: string
  baseStation: string | null
  batteryPct: number | null
  hoursSinceMaintenance: number | null
  payload: string | null
  lastSeenAt: string | null
  distanceKmToNhaBe?: number | null
  enduranceMarginPct?: number | null
  hasThermalSensor?: boolean | null
  existingBookings?: {
    missionCode: string
    start: string | null
    end: string | null
  }[]
  openTicketSeverity?: string
  // P6 additions — BE `DroneResponse` fields, kept alongside the
  // pre-existing MNG-09 display fields above (see
  // features/manager/types/drones.ts `DroneResponse`).
  droneModel?: SeedDroneModel
  deviceModel?: {
    id: string
    code: string
    modelName: string
    manufacturer: string | null
    specsMetadata?: Record<string, unknown> | null
    deviceTypes?: Array<{
      id: string
      code: string
      name: string
      description?: string | null
      createdAt?: string
      updatedAt?: string
      version?: number
    }> | null
    createdAt?: string
    updatedAt?: string
    version?: number
  }
  dronePayload?: SeedDronePayload
  imageUrl?: string | null
  createdAt?: string
  updatedAt?: string
  version?: number
}

const drones = createCollection(dronesSeed.items) as SeedDrone[]

function parseModelSpecifications(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

// P6: `GET /api/drones/{id}` [BE] — maps straight to the BE `DroneResponse`
// DTO shape rather than the MNG-09 display-only `DroneItem` shape.
function toDroneResponse(d: SeedDrone) {
  const model =
    d.deviceModel ??
    (d.droneModel
      ? {
          id: d.droneModel.id,
          code: d.droneModel.modelCode,
          modelName: d.droneModelName ?? d.droneModel.modelCode,
          manufacturer: d.droneModel.manufacturer,
          specsMetadata: {
            category: d.droneModel.category,
            maxFlightTimeMinutes: d.droneModel.maxFlightTimeMinutes,
            maxTakeoffWeightKg: d.droneModel.maxTakeoffWeightKg,
            maxFlightAltitudeMeters: d.droneModel.maxFlightAltitudeMeters,
            maxWindResistanceMetersPerSecond: d.droneModel.maxWindResistanceMetersPerSecond,
            ipRating: d.droneModel.ipRating,
            ...parseModelSpecifications(d.droneModel.specsMetadata),
          },
          createdAt: d.droneModel.createdAt,
          updatedAt: d.droneModel.updatedAt,
          version: d.droneModel.version,
        }
      : null)
  return {
    id: d.id,
    serialNumber: d.serialNumber ?? '',
    name: d.name,
    deviceModel: model,
    imageUrl: d.imageUrl ?? null,
    droneModel: d.droneModel ?? null,
    dronePayload: d.dronePayload ?? null,
    status: d.status,
    createdAt: d.createdAt ?? '',
    updatedAt: d.updatedAt ?? '',
    version: d.version ?? 1,
  }
}

function listDeviceModels() {
  const models = new Map<
    string,
    NonNullable<ReturnType<typeof toDroneResponse>['deviceModel']>
  >()
  for (const drone of drones) {
    const model = toDroneResponse(drone).deviceModel
    if (model) models.set(model.id, model)
  }
  const items = [...models.values()]
  return ok({
    items,
    page: 0,
    size: items.length,
    totalItems: items.length,
    totalPages: items.length ? 1 : 0,
    first: true,
    last: true,
  })
}

async function createDevice(body: unknown) {
  let request: { serialNumber?: string; name?: string; modelId?: string } = {}
  let imageUrl: string | null = null
  if (body instanceof FormData) {
    const devicePart = body.get('device')
    if (devicePart instanceof Blob) {
      try {
        request = JSON.parse(await devicePart.text()) as typeof request
      } catch {
        return fail(400, 'VALIDATION_ERROR', 'Thông tin thiết bị không hợp lệ')
      }
    }
    const image = body.get('file')
    if (
      image instanceof Blob &&
      image.size > 0 &&
      typeof URL.createObjectURL === 'function'
    ) {
      imageUrl = URL.createObjectURL(image)
    }
  } else if (body && typeof body === 'object') {
    request = body as typeof request
  }

  if (
    !request.serialNumber?.trim() ||
    !request.name?.trim() ||
    !request.modelId
  ) {
    return fail(400, 'VALIDATION_ERROR', 'Vui lòng nhập đủ thông tin thiết bị')
  }
  if (drones.some((drone) => drone.serialNumber === request.serialNumber)) {
    return fail(409, 'DEVICE_SERIAL_NUMBER_EXISTS', 'Số serial đã tồn tại')
  }

  const modelDrone = drones.find(
    (drone) => drone.droneModel?.id === request.modelId,
  )
  if (!modelDrone?.droneModel)
    return fail(404, 'DEVICE_MODEL_NOT_FOUND', 'Không tìm thấy mẫu thiết bị')

  const now = new Date().toISOString()
  const model = toDroneResponse(modelDrone).deviceModel
  const device: SeedDrone = {
    id: `mock-device-${Date.now()}`,
    code: `DRN-${String(drones.length + 1).padStart(3, '0')}`,
    name: request.name.trim(),
    serialNumber: request.serialNumber.trim(),
    droneModelName: modelDrone.droneModelName,
    droneModel: modelDrone.droneModel,
    deviceModel: model ?? undefined,
    imageUrl,
    status: 'AVAILABLE',
    baseStation: null,
    batteryPct: null,
    hoursSinceMaintenance: null,
    payload: null,
    lastSeenAt: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
  drones.unshift(device)
  return created(toDroneResponse(device), 'Đã tạo thiết bị')
}

// Valid status transitions [ĐỀ XUẤT per MNG-09 design context]
const VALID_TRANSITIONS: Partial<Record<DroneStatus, DroneStatus[]>> = {
  AVAILABLE: ['MAINTENANCE', 'RESERVED', 'OFFLINE'],
  MAINTENANCE: ['AVAILABLE', 'OUT_OF_SERVICE'],
  RESERVED: ['AVAILABLE', 'IN_MISSION'],
  IN_MISSION: ['RETURNING'],
  RETURNING: ['AVAILABLE', 'MAINTENANCE'],
  OUT_OF_SERVICE: ['MAINTENANCE'],
  OFFLINE: ['AVAILABLE'],
}

function toDroneItem(d: SeedDrone) {
  return {
    id: d.id,
    code: d.code,
    name: d.name ?? null,
    serialNumber: d.serialNumber ?? null,
    droneModelName: d.droneModelName ?? null,
    status: d.status,
    baseStation: d.baseStation ?? null,
    batteryPct: d.batteryPct ?? null,
    hoursSinceMaintenance: d.hoursSinceMaintenance ?? null,
    payload: d.payload ?? null,
    lastSeenAt: d.lastSeenAt ?? null,
  }
}

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/device-models',
    handler: () => listDeviceModels(),
  },
  {
    method: 'POST',
    path: '/api/drones',
    handler: ({ body }) => createDevice(body),
  },
  {
    method: 'POST',
    path: '/api/drones/with-image',
    handler: ({ body }) => createDevice(body),
  },
  // ── MNG-09: list drones [BE DroneController] ───────────────────────────
  {
    method: 'GET',
    path: '/api/drones',
    handler: ({ query }) => {
      const statusFilter = query.get('status')
      const page = Math.max(1, parseInt(query.get('page') ?? '1', 10))
      const pageSize = Math.max(1, parseInt(query.get('pageSize') ?? '20', 10))

      const filtered = statusFilter
        ? drones.filter((d) => d.status === statusFilter)
        : drones

      const total = filtered.length
      const start = (page - 1) * pageSize
      const items = filtered.slice(start, start + pageSize).map(toDroneItem)

      const totalPages = Math.ceil(total / pageSize)
      return ok({
        items: items.map(toDroneResponse),
        page,
        size: pageSize,
        totalItems: total,
        totalPages,
        first: page === 1,
        last: page >= totalPages,
      })
    },
  },

  // ── P6: GET /api/drones/{id} [BE] — single drone, BE DroneResponse shape ──
  {
    method: 'GET',
    path: '/api/drones/:id',
    handler: ({ params }) => {
      const drone = drones.find(
        (d) => d.id === params.id || d.code === params.id,
      )
      if (!drone) return fail(404, 'NOT_FOUND', 'Không tìm thấy drone')
      return ok(toDroneResponse(drone))
    },
  },

  // ── PUT /api/drones/{id} [BE] — full update ────────────────────────────
  {
    method: 'PUT',
    path: '/api/drones/:id',
    handler: ({ params, body }) => {
      const drone = drones.find(
        (d) => d.id === params.id || d.code === params.id,
      )
      if (!drone) return fail(404, 'NOT_FOUND', 'Không tìm thấy drone')

      const req = (body ?? {}) as {
        serialNumber?: string
        droneModelId?: string
        dronePayloadId?: string
        status?: DroneStatus
      }
      if (req.serialNumber) drone.serialNumber = req.serialNumber
      if (req.status) drone.status = req.status
      drone.updatedAt = new Date().toISOString()

      return ok(toDroneResponse(drone), 'Đã cập nhật drone')
    },
  },

  // ── MNG-09: patch drone status [ĐỀ XUẤT — kept for backward compat] ──
  {
    method: 'PATCH',
    path: '/api/drones/:id/status',
    handler: ({ params, body }) => {
      const drone = drones.find(
        (d) => d.id === params.id || d.code === params.id,
      )
      if (!drone) return fail(404, 'NOT_FOUND', 'Không tìm thấy drone')

      const req = (body ?? {}) as { status?: DroneStatus; reason?: string }
      if (!req.reason?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Lý do là bắt buộc', {
          reason: 'Bắt buộc',
        })
      }

      const validNext = VALID_TRANSITIONS[drone.status as DroneStatus] ?? []
      if (!req.status || !validNext.includes(req.status)) {
        return fail(
          422,
          'INVALID_TRANSITION',
          `Không thể chuyển từ ${drone.status} sang ${req.status ?? '(trống)'}`,
        )
      }

      drone.status = req.status
      return ok(toDroneResponse(drone), 'Đã cập nhật trạng thái drone')
    },
  },
])

/** Test-only escape hatch */
export const __testing = { drones }
