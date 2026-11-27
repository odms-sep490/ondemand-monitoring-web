import { useState } from 'react'

export type CatalogStatus = '' | 'active' | 'inactive'
export type CatalogFilterControls = {
  search: string
  setSearch: (value: string) => void
  status: CatalogStatus
  setStatus: (value: CatalogStatus) => void
  hasStatus: boolean
  filtered: boolean
  reset: () => void
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

/** Catalog endpoints return their lists in full; filter those rows without extra requests. */
export function useCatalogFilter<T>(
  items: T[] | undefined,
  text: (item: T) => string,
  isActive?: (item: T) => boolean,
) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CatalogStatus>('')
  const term = normalize(search.trim())
  const rows = (items ?? []).filter(
    (item) =>
      (!term || normalize(text(item)).includes(term)) &&
      (!status || !isActive || isActive(item) === (status === 'active')),
  )
  const controls: CatalogFilterControls = {
    search,
    setSearch,
    status,
    setStatus,
    hasStatus: Boolean(isActive),
    filtered: Boolean(search.trim() || status),
    reset: () => {
      setSearch('')
      setStatus('')
    },
  }
  return { rows, controls }
}
