import { useState, type FormEvent } from 'react'

import {
  checklistPricingApi,
  type AdminPreviewItem,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import { useI18n } from '../../../../shared/i18n'
import {
  checklistsApi,
  type ChecklistDefinition,
} from '../../api/checklistsApi'
import {
  pricingToForm,
  type ChecklistPricingErrors,
  type ChecklistPricingForm,
} from '../../lib/checklistPricing'
import type { OverrideForm } from '../../lib/serviceOverrides'
import { checklistError } from './checklistError'
import {
  collectChecklistForm,
  initialContent,
  initialOverrides,
  type ChecklistPage,
  type ConfigServiceContext,
  type ContentForm,
} from './checklistForm'
import { checklistMessages } from './checklists.messages'

/** State and actions of the checklist configuration form (create, edit, and edit-from-a-service). */
export function useChecklistForm({
  row,
  service,
  saved,
}: {
  row?: ChecklistDefinition
  service?: ConfigServiceContext
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const link = service?.row
  const [content, setContent] = useState<ContentForm>(() => initialContent(row))
  const [pricing, setPricing] = useState<ChecklistPricingForm>(
    pricingToForm(row ?? {}),
  )
  const [overrides, setOverrides] = useState<OverrideForm>(() =>
    initialOverrides(link),
  )
  // What the form looked like when it opened, to tell a shared change from a change for this service only.
  const [initialShared] = useState(() => JSON.stringify([content, pricing]))
  const [initialOverridesJson] = useState(() => JSON.stringify(overrides))
  const [pricingErrors, setPricingErrors] = useState<ChecklistPricingErrors>({})
  const [acknowledged, setAcknowledged] = useState(false)
  const [page, setPage] = useState<ChecklistPage>('content')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ServicePricePreview | null>(null)

  const sharedBy = row?.usedByServiceCount ?? 0
  const shared = sharedBy > 1
  const sharedDirty = JSON.stringify([content, pricing]) !== initialShared
  const overridesDirty = JSON.stringify(overrides) !== initialOverridesJson
  const needsAck = shared && sharedDirty && !acknowledged

  /** Validates everything and returns what to send, or null after showing the problem. */
  function collect() {
    const result = collectChecklistForm({
      content,
      pricing,
      overrides,
      fromService: service !== undefined,
    })
    if (!result.ok) {
      setPage(result.page)
      setError(t[result.error])
      if (result.pricingErrors) setPricingErrors(result.pricingErrors)
      return null
    }
    setPricingErrors({})
    setError(null)
    return result
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const data = collect()
    if (!data) return
    if (needsAck) {
      setError(t.sharedAck(sharedBy))
      return
    }
    setBusy(true)
    try {
      if (!row) {
        await checklistsApi.create(
          data.text,
          content.difficulty,
          data.definition,
        )
      } else if (!service || sharedDirty) {
        await checklistsApi.update(
          row.id,
          data.text,
          content.difficulty,
          data.definition,
        )
      }
      if (service && link && data.override && overridesDirty) {
        await checklistsApi.updatePricing(service.id, link.checklistId, {
          ...data.override,
          expectedVersion: link.version,
        })
      }
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  /** The price of the whole service as it would be with the unsaved values, without saving anything. */
  async function check() {
    if (busy || !service || !link) return
    const data = collect()
    if (!data) return
    setBusy(true)
    try {
      const items: AdminPreviewItem[] = service.rows.map((other) =>
        other.checklistId === link.checklistId
          ? {
              checklistId: other.checklistId,
              basePrice:
                data.override?.basePriceOverride ?? data.definition.basePrice,
              includedImageCount:
                data.override?.includedImageCountOverride ??
                data.definition.includedImageCount,
              includedVideoCount:
                data.override?.includedVideoCountOverride ??
                data.definition.includedVideoCount,
              pricingProfile:
                data.override?.pricingProfileOverride ??
                (pricing.pricingProfile.trim().toUpperCase() || undefined),
            }
          : { checklistId: other.checklistId },
      )
      setPreview(
        await checklistPricingApi.adminPreview({
          serviceId: service.id,
          items,
        }),
      )
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  return {
    content,
    setContent,
    pricing,
    setPricing,
    overrides,
    setOverrides,
    pricingErrors,
    acknowledged,
    setAcknowledged,
    page,
    setPage,
    busy,
    error,
    preview,
    sharedBy,
    shared,
    sharedDirty,
    needsAck,
    submit,
    check,
  }
}
