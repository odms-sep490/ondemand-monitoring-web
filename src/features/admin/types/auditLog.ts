export type AuditAction =
  'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'STATUS_CHANGE'

export type AuditEntry = {
  id: string
  createdAt: string
  actorId: string
  actorName: string
  action: AuditAction
  entityType: string
  entityId: string
  ip: string
  userAgent: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}

export type AuditLogFilters = {
  actorId?: string
  actorQuery?: string
  action?: AuditAction
  entityType?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type AuditLogPage = {
  items: AuditEntry[]
  total: number
  page: number
  limit: number
}
