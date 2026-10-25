import type {
  PreferredTimeCreateRequest,
  PreferredTimeResponse,
  ServiceRequest,
  ServiceResponse,
} from '../api/catalogApi'
import type { AdminService, AdminTimeslot } from '../types/catalog'

export type ServiceFormValues = {
  name: string
  description: string
  basePrice: number
  isActive: boolean
}

export type TimeslotFormValues = PreferredTimeCreateRequest

/** Trims "HH:mm:ss" to "HH:mm" so it fits `<input type="time">`. */
export function toHourMinute(value: string | undefined | null): string {
  return (value ?? '').slice(0, 5)
}

export function mapService(dto: ServiceResponse): AdminService {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? '',
    basePrice: dto.basePrice,
    defaultPrice: dto.defaultPrice,
    priceSource: dto.priceSource,
    imageUrl: dto.imageUrl ?? null,
    isActive: dto.isActive,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  }
}

export function mapTimeslot(dto: PreferredTimeResponse): AdminTimeslot {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    startTime: toHourMinute(dto.startTime),
    endTime: toHourMinute(dto.endTime),
  }
}

export function emptyServiceForm(): ServiceFormValues {
  return { name: '', description: '', basePrice: 3_200_000, isActive: true }
}

export function serviceToForm(s: AdminService): ServiceFormValues {
  return {
    name: s.name,
    description: s.description,
    basePrice: s.basePrice,
    isActive: s.isActive,
  }
}

export function toServiceRequest(v: ServiceFormValues): ServiceRequest {
  return {
    name: v.name.trim(),
    description: v.description.trim(),
    basePrice: v.basePrice,
    isActive: v.isActive,
  }
}

export function emptyTimeslotForm(): TimeslotFormValues {
  return { code: 'MORNING', name: '', startTime: '06:00', endTime: '12:00' }
}

export function timeslotToForm(t: AdminTimeslot): TimeslotFormValues {
  return {
    code: t.code,
    name: t.name,
    startTime: t.startTime,
    endTime: t.endTime,
  }
}

export function toTimeslotRequest(
  v: TimeslotFormValues,
): PreferredTimeCreateRequest {
  return {
    code: v.code,
    name: v.name.trim(),
    startTime: v.startTime,
    endTime: v.endTime,
  }
}

/** Extracts the message and per-field errors from a failed API call. */
export function readApiError(
  err: unknown,
  fallback: string,
): { message: string; fields: Record<string, string> } {
  const fields =
    err && typeof err === 'object' && 'errors' in err
      ? ((err as { errors?: Record<string, string> }).errors ?? {})
      : {}
  const message = err instanceof Error && err.message ? err.message : fallback
  return { message, fields }
}
