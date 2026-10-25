import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionReportApi } from '../../../api/customerMissionReportApi'
import { sortNewestFirst, toMediaItem } from '../../../lib/media/mapMedia'
import type { MediaItem } from '../../../lib/media/types'

/**
 * The BE has no "media of an order" endpoint: the order's missions come from
 * Customer-safe Order collection and exact Mission media queries; includes ongoing Missions.
 */
export function useOrderMedia(orderId: string) {
  const query = useApiQuery(
    async (signal) => {
      const missions = await customerMissionReportApi.list(orderId, signal)
      return Promise.all(
        missions.map(async (mission) => {
          const items: MediaItem[] = []
          let page = 0
          let last = false
          while (!last) {
            const response = await customerMediaApi.listMissionMedia(
              mission.missionId,
              page,
              100,
              signal,
            )
            if (
              response.items.some(
                (item) => item.missionId !== mission.missionId,
              )
            )
              throw new Error('Invalid Mission media scope')
            items.push(...response.items.map(toMediaItem))
            last =
              response.last ||
              response.totalPages === 0 ||
              page + 1 >= response.totalPages
            page += 1
          }
          return {
            mission: { ...mission, id: mission.missionId },
            items: sortNewestFirst(items),
          }
        }),
      )
    },
    [orderId],
  )

  const [previewId, setPreviewId] = useState<string | null>(null)
  const sections = useMemo(() => query.data ?? [], [query.data])

  const flat: MediaItem[] = sections.flatMap((s) => s.items)
  const index = flat.findIndex((i) => i.id === previewId)
  const previewSection = sections.find((s) =>
    s.items.some((i) => i.id === previewId),
  )

  return {
    loaded: query.data !== undefined,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    sections,
    totalMedia: flat.length,
    preview: index >= 0 ? flat[index] : null,
    previewLabel: previewSection?.mission.missionCode ?? '',
    openPreview: (id: string) => setPreviewId(id),
    closePreview: () => setPreviewId(null),
    prevPreview: index > 0 ? () => setPreviewId(flat[index - 1].id) : undefined,
    nextPreview:
      index >= 0 && index < flat.length - 1
        ? () => setPreviewId(flat[index + 1].id)
        : undefined,
  }
}
