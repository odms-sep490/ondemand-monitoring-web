import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import {
  filterMedia,
  groupByMission,
  sortNewestFirst,
  toMediaItem,
  toMediaNotification,
} from '../../../lib/media/mapMedia'
import type { MediaFilter } from '../../../lib/media/types'

export const LIBRARY_PAGE_SIZE = 12

const ALL: MediaFilter = { missionId: null, kind: 'all', query: '' }

/**
 * `GET /api/customer/available-media` plus the notification count. Mission
 * codes come from the mission history (best effort: a failure only means
 * short ids are shown instead).
 */
export function useMediaLibrary() {
  const media = useApiQuery(
    (signal) =>
      customerMediaApi
        .listAvailable(signal)
        .then((rows) => sortNewestFirst(rows.map(toMediaItem))),
    [],
  )
  const notifications = useApiQuery(
    (signal) =>
      customerMediaApi
        .listNotifications(signal)
        .then((rows) => rows.map(toMediaNotification)),
    [],
  )
  const missions = useApiQuery(
    (signal) => customerMissionHistoryApi.listAll(signal),
    [],
  )

  const [filter, setFilterState] = useState<MediaFilter>(ALL)
  const [page, setPage] = useState(0)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const labels = useMemo(
    () => Object.fromEntries((missions.data ?? []).map((m) => [m.id, m.missionCode])),
    [missions.data],
  )
  const items = useMemo(() => media.data ?? [], [media.data])
  const groups = useMemo(() => groupByMission(items, labels), [items, labels])
  const filtered = useMemo(() => filterMedia(items, filter), [items, filter])
  const kindCounts = useMemo(() => {
    const base = filterMedia(items, { ...filter, kind: 'all' })
    return {
      all: base.length,
      image: base.filter((i) => i.kind === 'image').length,
      video: base.filter((i) => i.kind === 'video').length,
    }
  }, [items, filter])
  const totalPages = Math.ceil(filtered.length / LIBRARY_PAGE_SIZE)
  const safePage = Math.min(page, Math.max(0, totalPages - 1))
  const pageItems = filtered.slice(
    safePage * LIBRARY_PAGE_SIZE,
    safePage * LIBRARY_PAGE_SIZE + LIBRARY_PAGE_SIZE,
  )
  const previewIndex = filtered.findIndex((i) => i.id === previewId)

  function setFilter(patch: Partial<MediaFilter>) {
    setFilterState((prev) => ({ ...prev, ...patch }))
    setPage(0)
  }

  function reload() {
    media.reload()
    notifications.reload()
    missions.reload()
  }

  return {
    media,
    loaded: media.data !== undefined,
    notificationCount: notifications.data?.length ?? 0,
    labels,
    groups,
    kindCounts,
    total: items.length,
    filter,
    isFiltered: filter.missionId !== null || filter.kind !== 'all' || filter.query.trim() !== '',
    setFilter,
    clearFilter: () => setFilter(ALL),
    page: safePage,
    totalPages,
    totalFiltered: filtered.length,
    pageItems,
    setPage,
    preview: previewIndex >= 0 ? filtered[previewIndex] : null,
    openPreview: (id: string) => setPreviewId(id),
    closePreview: () => setPreviewId(null),
    prevPreview: previewIndex > 0 ? () => setPreviewId(filtered[previewIndex - 1].id) : undefined,
    nextPreview:
      previewIndex >= 0 && previewIndex < filtered.length - 1
        ? () => setPreviewId(filtered[previewIndex + 1].id)
        : undefined,
    reload,
  }
}
