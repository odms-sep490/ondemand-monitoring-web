import { ApiError } from '../../../shared/api/httpClient'
import { getLanguage } from '../../../shared/i18n'
import { safeStopPresentationMessages } from './safeStopPresentation.messages'
import type { SafeStop } from '../../manager/types/planning'

export type SafeStopPhase =
  | 'notRequested'
  | 'requested'
  | 'inProgress'
  | 'confirmed'
  | 'cleaned'
  | 'failed'
  | 'unknown'

// Presentation only: confirmation is a timestamp, not a new backend state.
export function safeStopPhase(
  stop: SafeStop | null | undefined,
): SafeStopPhase {
  if (!stop) return 'unknown'
  if (stop.status === 'FAILED') return 'failed'
  if (stop.cleanedAt || stop.status === 'READY_FOR_CANCELLATION')
    return 'cleaned'
  if (stop.confirmedAt) return 'confirmed'
  if (stop.status === 'IN_PROGRESS') return 'inProgress'
  if (stop.status === 'REQUESTED' || (!stop.status && stop.requestedAt))
    return 'requested'
  return stop.status ? 'unknown' : 'notRequested'
}

export function hasStopRequest(stop: SafeStop | null | undefined): boolean {
  return Boolean(
    stop?.status || stop?.requestedAt || stop?.confirmedAt || stop?.cleanedAt,
  )
}

/** Choose one next action from explicit capabilities, never grant permission by phase. */
export function managerStopAction(
  stop: SafeStop | null | undefined,
): 'request' | 'cleanup' | 'cancel' | null {
  if (!stop) return null
  if (stop.canCancelMission === true) return 'cancel'
  if (stop.canCleanupSafeStop === true && !stop.cleanedAt) return 'cleanup'
  if (stop.canRequestSafeStop === true && !hasStopRequest(stop))
    return 'request'
  return null
}

const msgs = () => safeStopPresentationMessages[getLanguage()]

export function safeStopFailure(reason: string | null): string {
  // Keep arbitrary server diagnostics out of the operational presentation.
  const m = msgs()
  return m.errors[reason ?? ''] ?? m.failureFallback
}

export function safeStopError(error: unknown): string {
  const m = msgs()
  return error instanceof ApiError
    ? (m.errors[error.code ?? ''] ?? m.actionFallback)
    : m.loadFallback
}
