export class AuthApiError extends Error {
  readonly code?: string
  readonly errors?: Record<string, string>
  readonly status?: number

  constructor(
    message: string,
    code?: string,
    errors?: Record<string, string>,
    status?: number,
  ) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code
    this.errors = errors
    this.status = status
  }
}

export function sessionChangedError() {
  return new AuthApiError(
    'The authentication session has changed.',
    'SESSION_CHANGED',
  )
}
