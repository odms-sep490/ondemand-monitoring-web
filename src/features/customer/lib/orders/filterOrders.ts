import type { OrderRow } from './types'
import { localizedSearchText } from '../../../../shared/i18n'

const byNewest = (a: OrderRow, b: OrderRow) =>
  (b.createdAt ?? '').localeCompare(a.createdAt ?? '')

export function sortNewestFirst(rows: OrderRow[]): OrderRow[] {
  return [...rows].sort(byNewest)
}

/** Case-insensitive match on title, address, service and code/id. */
export function searchOrders(rows: OrderRow[], query: string): OrderRow[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter((row) =>
    [row.title, row.address, localizedSearchText(row.serviceName), row.code, row.id].some(
      (field) => field?.toLowerCase().includes(needle),
    ),
  )
}

export type Page<T> = {
  items: T[]
  /** Zero-based, clamped to the last page. */
  page: number
  totalPages: number
  totalItems: number
}

/** Client-side paging: the BE list endpoint returns every order at once. */
export function paginate<T>(rows: T[], page: number, size: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(rows.length / size))
  const safePage = Math.min(Math.max(0, page), totalPages - 1)
  return {
    items: rows.slice(safePage * size, safePage * size + size),
    page: safePage,
    totalPages,
    totalItems: rows.length,
  }
}
