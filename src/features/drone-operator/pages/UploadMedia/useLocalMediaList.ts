import { useCallback, useEffect, useRef } from 'react'
import { flightControlApi } from '../../api/flightControlApi'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../media/api/operatorMediaApi'
import { visibleAfterControllerDropStatuses } from './uploadMediaHelpers'
import { resolveUploadState } from '../../../media/upload/resolveUploadState'
import { operatorMissionMediaApi } from '../../../media/api/operatorMissionMediaApi'
import { uploadMediaPageMessages } from './UploadMediaPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { MissionPermissions } from '../../../mission/types/permissions'
import type { BackendMission } from '../../api/liveMission'

export function useLocalMediaList({
  missionId,
  setLoading,
  permissions,
  activeMission,
  itemsRef,
  setAttemptNumbers,
  setStatuses,
  uploadedMediaIds,
  setItems,
  setError,
  setReferenceCount,
  items,
  statuses,
  setChecklistRevision,
  autoRefresh = true,
}: {
  missionId: string | null
  setLoading: Dispatch<SetStateAction<boolean>>
  permissions: UseApiQueryState<MissionPermissions>
  activeMission: {
    data: BackendMission | undefined
    missionId: string
    loading: boolean
    error: unknown
    allMissions: BackendMission[]
    postflightMissions: BackendMission[]
    selectMission: (id: string) => void
    reload: () => void
  }
  itemsRef: RefObject<LocalMedia[]>
  setAttemptNumbers: Dispatch<SetStateAction<Record<string, number>>>
  setStatuses: Dispatch<SetStateAction<Record<string, string>>>
  uploadedMediaIds: RefObject<Record<string, string>>
  setItems: Dispatch<SetStateAction<LocalMedia[]>>
  setError: Dispatch<SetStateAction<string | null>>
  setReferenceCount: Dispatch<SetStateAction<number>>
  items: LocalMedia[]
  statuses: Record<string, string>
  setChecklistRevision: Dispatch<SetStateAction<number>>
  autoRefresh?: boolean
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  const boundSession = useRef<string | null>(null)
  const refresh = useCallback(
    async (options?: { background?: boolean }) => {
      if (!missionId) {
        setLoading(false)
        return
      }
      if (!options?.background) permissions.reload()
      try {
        const mission = activeMission.data
        const deviceId = mission?.deviceId
        const binding = `${missionId}:${deviceId}`
        if (
          deviceId &&
          !options?.background &&
          boundSession.current !== binding
        ) {
          await flightControlApi
            .bindSession(missionId, deviceId)
            .then(() => {
              boundSession.current = binding
            })
            .catch(() => undefined)
        }
        const media = await operatorMediaApi.reviewItems(
          missionId,
          mission?.missionCode ? [mission.missionCode] : [],
        )
        const previous = itemsRef.current
        const ids = [
          ...new Set(
            [...media, ...previous].flatMap((item) =>
              item.backendMediaId ? [item.backendMediaId] : [],
            ),
          ),
        ]
        const results = await Promise.allSettled(
          ids.map((id) => operatorMediaApi.status(id)),
        )
        const refreshedStatuses: Record<string, string> = {}
        results.forEach((result, index) => {
          if (result.status === 'fulfilled')
            refreshedStatuses[ids[index]] = result.value.status
        })
        setAttemptNumbers((previous) => {
          const next = { ...previous }
          results.forEach((result, index) => {
            if (result.status === 'fulfilled')
              next[ids[index]] = result.value.attemptNumber
          })
          return next
        })
        setStatuses((previous) => {
          const next = { ...previous, ...refreshedStatuses }
          return next
        })
        const merged = new Map<string, LocalMedia>(
          media.map((item) => [
            item.localMediaId,
            {
              ...item,
              backendMediaId:
                item.backendMediaId ??
                uploadedMediaIds.current[item.localMediaId] ??
                previous.find((old) => old.localMediaId === item.localMediaId)
                  ?.backendMediaId,
            },
          ]),
        )
        for (const item of previous) {
          if (merged.has(item.localMediaId) || !item.backendMediaId) continue
          const status = refreshedStatuses[item.backendMediaId] ?? item.status
          if (visibleAfterControllerDropStatuses.has(status)) {
            merged.set(item.localMediaId, {
              ...item,
              status: status as LocalMedia['status'],
              localAvailable: false,
            })
          }
        }
        const nextItems = [...merged.values()]
        itemsRef.current = nextItems
        setItems(nextItems)
        setError(null)
        void operatorMissionMediaApi
          .list(missionId, 0)
          .then((page) =>
            setReferenceCount(
              page.items.filter(
                (media) => media.sourceType === 'MAPILLARY_REFERENCE',
              ).length,
            ),
          )
          .catch(() => undefined)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t.loadMediaFailed)
      } finally {
        setLoading(false)
      }
    },
    [
      activeMission.data?.deviceId,
      activeMission.data?.missionCode,
      missionId,
      t,
      permissions.reload,
    ],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Storage validation finishes in the background, after the upload itself. Keep asking the backend while any file
  // is still being checked, so "Đang xác thực" turns into "Đã upload" without a manual reload.
  const stillValidating = items.some((item) => {
    const status = resolveUploadState(
      item.status,
      item.backendMediaId ? statuses[item.backendMediaId] : undefined,
    )
    return (
      status === 'VALIDATING' ||
      status === 'UPLOADING' ||
      status === 'UPLOAD_PENDING'
    )
  })
  const wasValidating = useRef(false)
  useEffect(() => {
    // Once the last file finishes, reload the checklist counts and library once (the reloads keep what is on screen).
    if (wasValidating.current && !stillValidating) {
      setChecklistRevision((value) => value + 1)
    }
    wasValidating.current = stillValidating
  }, [stillValidating])
  useEffect(() => {
    if (!autoRefresh || !stillValidating || !missionId) return
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt > 3 * 60_000) {
        window.clearInterval(timer)
        return
      }
      void refresh({ background: true })
    }, 2500)
    return () => window.clearInterval(timer)
  }, [stillValidating, missionId, refresh, autoRefresh])
  return { refresh }
}
