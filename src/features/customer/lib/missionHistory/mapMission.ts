import type { MissionStatus } from '../../../../shared/types/domain'
import type {
  CustomerMissionHistory,
  CustomerMissionMediaStatus,
} from '../../api/customerMissionHistoryApi'
import type { MissionMediaProgress, MissionRow } from './types'

const KNOWN: readonly MissionStatus[] = [
  'PLANNING',
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'READY',
  'SCHEDULED',
  'IN_PROGRESS',
  'AWAITING_REVIEW',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]

export function normalizeMissionStatus(value: string | null | undefined): MissionStatus {
  return KNOWN.includes(value as MissionStatus) ? (value as MissionStatus) : 'PLANNING'
}

export function toMissionRow(dto: CustomerMissionHistory): MissionRow {
  return {
    id: dto.id,
    code: dto.missionCode || dto.id,
    orderId: dto.orderId,
    orderTitle: dto.orderTitle,
    address: dto.address ?? null,
    status: normalizeMissionStatus(dto.status),
    scheduledStartAt: dto.scheduledStartAt ?? null,
    scheduledEndAt: dto.scheduledEndAt ?? null,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    description: dto.description?.trim() || null,
    when: dto.completedAt ?? dto.startedAt ?? dto.scheduledStartAt ?? null,
  }
}

export function toMediaProgress(dto: CustomerMissionMediaStatus): MissionMediaProgress {
  const available = dto.availableCount ?? 0
  const processing = dto.processingCount ?? 0
  const rejected = dto.rejectedCount ?? 0
  return {
    available,
    processing,
    rejected,
    phase: processing > 0 ? 'processing' : available > 0 ? 'ready' : 'none',
  }
}
