import { ApiError } from '../../../shared/api/httpClient'
import type { RequiredEvidenceType } from '../../../shared/types/domain'
import type { OrderChecklistSnapshot } from '../types/orders'

/** Validate both the backend DTO and the legacy mock projection at the API boundary. */
export function readOrderChecklistSnapshot(
  order: { checklistItems?: unknown; checklistSnapshotAt?: unknown },
  orderId: string,
) {
  const fail = () => {
    throw new ApiError('Invalid order checklist snapshot', {
      code: 'INVALID_ORDER_CHECKLIST_SNAPSHOT',
      method: 'GET',
      path: `/api/orders/${orderId}`,
    })
  }
  const timestamp = order.checklistSnapshotAt ?? null
  if (
    timestamp !== null &&
    (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp)))
  )
    fail()
  const raw = order.checklistItems ?? (timestamp === null ? [] : null)
  if (!Array.isArray(raw) || raw.length > 100) return fail()
  const ids = new Set<string>()
  const sources = new Set<string>()
  const items: OrderChecklistSnapshot[] = raw.map((item: unknown) => {
    if (!item || typeof item !== 'object') return fail()
    const entry = item as Record<string, unknown>
    if (
      typeof entry.id !== 'string' ||
      !entry.id.trim() ||
      ids.has(entry.id) ||
      typeof entry.content !== 'string' ||
      !entry.content.trim() ||
      entry.content.length > 500 ||
      !Number.isSafeInteger(entry.displayOrder) ||
      (entry.minimumEvidenceCount !== undefined &&
        (!Number.isSafeInteger(entry.minimumEvidenceCount) ||
          (entry.minimumEvidenceCount as number) < 0 ||
          (entry.minimumEvidenceCount as number) >
            (entry.requiredEvidenceType === 'IMAGE_AND_VIDEO' ? 1000 : 50))) ||
      (entry.requiredEvidenceType !== undefined &&
        !(
          ['IMAGE', 'VIDEO', 'IMAGE_AND_VIDEO', 'IMAGE_OR_VIDEO'] as const
        ).includes(entry.requiredEvidenceType as RequiredEvidenceType)) ||
      (entry.displayOrder as number) < 0
    )
      return fail()
    if (entry.sourceType === 'SERVICE_TEMPLATE') {
      if (
        typeof entry.sourceChecklistId !== 'string' ||
        !entry.sourceChecklistId.trim() ||
        sources.has(entry.sourceChecklistId)
      )
        return fail()
      sources.add(entry.sourceChecklistId)
    } else if (
      entry.sourceType !== 'CUSTOMER_CUSTOM' ||
      entry.sourceChecklistId !== null
    )
      return fail()
    ids.add(entry.id)
    return {
      id: entry.id,
      content: entry.content,
      displayOrder: entry.displayOrder as number,
      sourceChecklistId: entry.sourceChecklistId as string | null,
      sourceType: entry.sourceType,
      ...(entry.minimumEvidenceCount === undefined
        ? {}
        : { minimumEvidenceCount: entry.minimumEvidenceCount as number }),
      ...(Number.isSafeInteger(entry.minimumImageCount)
        ? { minimumImageCount: entry.minimumImageCount as number }
        : {}),
      ...(Number.isSafeInteger(entry.minimumVideoCount)
        ? { minimumVideoCount: entry.minimumVideoCount as number }
        : {}),
      ...(entry.requiredEvidenceType === undefined
        ? {}
        : {
            requiredEvidenceType:
              entry.requiredEvidenceType as RequiredEvidenceType,
          }),
    }
  })
  return {
    checklistItems: items,
    checklistSnapshotAt: timestamp as string | null,
  }
}
