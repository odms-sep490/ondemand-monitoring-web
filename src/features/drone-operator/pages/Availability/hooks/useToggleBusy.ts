import { useState } from 'react'

import { busyScheduleApi } from '../../../../busy-schedule/api/busyScheduleApi'
import { busyScheduleErrorMessage } from '../../../../busy-schedule/lib/busyErrors'
import { cellKey } from '../../../../busy-schedule/lib/busySessions'
import type { BusySchedule, BusySession } from '../../../../busy-schedule/types'

/** Create / cancel a busy session for one grid cell, tracking pending cells and the last error. */
export function useToggleBusy(
  busyByCell: Map<string, BusySchedule>,
  onDone: () => void,
) {
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function toggle(date: string, session: BusySession) {
    const key = cellKey(date, session)
    const existing = busyByCell.get(key)
    setPendingKeys((keys) => new Set(keys).add(key))
    setError(null)
    try {
      if (existing) await busyScheduleApi.remove(existing.id)
      else await busyScheduleApi.create({ date, session })
    } catch (cause) {
      setError(busyScheduleErrorMessage(cause))
    } finally {
      setPendingKeys((keys) => {
        const next = new Set(keys)
        next.delete(key)
        return next
      })
      // Always resync: the BE is the source of truth (e.g. after a conflict).
      onDone()
    }
  }

  return { pendingKeys, error, clearError: () => setError(null), toggle }
}
