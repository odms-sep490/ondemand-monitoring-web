import { useEffect, useMemo, useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminDevicesApi } from '../../api/adminDevicesApi'
import {
  computeDeviceStats,
  mapDeviceModel,
  mapDevicePage,
} from '../../lib/deviceMappers'
import {
  NO_DEVICE_FILTERS,
  type DeviceFilterState,
} from './components/DeviceFilters'

const STATS_PAGE_SIZE = 200

/** Filters, paging and the three backend queries (list, fleet stats, models) behind the devices screen. */
export function useDevicesData() {
  const [filters, setFilters] = useState<DeviceFilterState>(NO_DEVICE_FILTERS)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  // Debounce free-text search so each keystroke does not hit the backend.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setKeyword(filters.keyword.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [filters.keyword])

  const list = useApiQuery(
    (signal) =>
      adminDevicesApi
        .list({
          page: page - 1,
          size,
          keyword,
          status: filters.status,
          modelId: filters.modelId,
          signal,
        })
        .then(mapDevicePage),
    [page, size, keyword, filters.status, filters.modelId],
  )
  const statsQuery = useApiQuery(
    (signal) =>
      adminDevicesApi
        .list({ page: 0, size: STATS_PAGE_SIZE, signal })
        .then(mapDevicePage),
    [],
  )
  const modelsQuery = useApiQuery(
    (signal) =>
      adminDevicesApi
        .listModels(signal)
        .then((rows) => rows.map(mapDeviceModel)),
    [],
  )
  const stats = useMemo(() => {
    if (!statsQuery.data) return null
    return {
      ...computeDeviceStats(statsQuery.data.items),
      total: statsQuery.data.totalItems,
    }
  }, [statsQuery.data])

  function refresh() {
    list.reload()
    statsQuery.reload()
  }

  function changeFilters(next: DeviceFilterState) {
    if (next.status !== filters.status || next.modelId !== filters.modelId) {
      setPage(1)
    }
    setFilters(next)
  }

  return {
    filters,
    changeFilters,
    keyword,
    page,
    setPage,
    size,
    setSize,
    list,
    stats,
    models: modelsQuery.data ?? [],
    modelsFailed: Boolean(modelsQuery.error),
    refresh,
  }
}
