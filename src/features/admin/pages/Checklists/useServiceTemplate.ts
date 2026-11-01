import { useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { checklistsApi, type ServiceChecklist } from '../../api/checklistsApi'
import { checklistError } from './checklistError'
import { checklistMessages } from './checklists.messages'

/** Rows of a service's default checklist template plus the actions that change them (reorder, remove, refresh). */
export function useServiceTemplate(serviceId: string) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.template(serviceId, signal),
    [serviceId],
  )
  const [removing, setRemoving] = useState<ServiceChecklist | null>(null)
  // Bumped after every successful change so the default-price preview is recomputed by the backend.
  const [priceRevision, setPriceRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rows = [...(query.data ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )

  async function act(operation: () => Promise<unknown>) {
    if (busy || query.loading || query.error !== undefined) return
    setBusy(true)
    setError(null)
    try {
      await operation()
      setRemoving(null)
      setPriceRevision((value) => value + 1)
      query.reload()
    } catch (cause) {
      setError(checklistError(cause, t))
      query.reload()
    } finally {
      setBusy(false)
    }
  }
  function move(index: number, offset: number) {
    const reordered = [...rows]
    ;[reordered[index], reordered[index + offset]] = [
      reordered[index + offset],
      reordered[index],
    ]
    void act(() => checklistsApi.reorder(serviceId, reordered))
  }
  function refresh() {
    setPriceRevision((value) => value + 1)
    query.reload()
  }
  return {
    query,
    rows,
    busy,
    error,
    removing,
    setRemoving,
    priceRevision,
    act,
    move,
    refresh,
  }
}
