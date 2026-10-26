export function displayOrderCode(
  orderCode?: string | null,
  orderId?: string | null,
) {
  const trimmedCode = orderCode?.trim()
  if (trimmedCode) return trimmedCode

  const rawId = orderId?.trim()
  if (!rawId) return '—'

  // Ids that already look like an order code (ord-2609-0153) are shown whole.
  if (/^ord[-_]?[a-z0-9-]{1,32}$/i.test(rawId)) return rawId.toUpperCase()

  const compact = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  return compact ? `ORD-${compact}` : rawId
}
