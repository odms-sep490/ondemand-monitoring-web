import { ApiError } from '../../../shared/api/httpClient'

const UNSUPPORTED_STATUSES = new Set([404, 405, 501])

/** True when the backend lacks the endpoint (404/405/501). */
export function isUnsupportedDeviceError(error: unknown): boolean {
  return (
    error instanceof ApiError && UNSUPPORTED_STATUSES.has(error.status ?? 0)
  )
}

/** Localized message for a failed device action. */
export function deviceErrorMessage(
  error: unknown,
  copy: { unsupported: string; actionFailed: string },
): string {
  if (isUnsupportedDeviceError(error)) return copy.unsupported
  if (
    error instanceof ApiError &&
    error.code !== 'NETWORK_ERROR' &&
    error.message
  )
    return error.message
  return copy.actionFailed
}
