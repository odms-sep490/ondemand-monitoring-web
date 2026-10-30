import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import type { RequiredEvidenceType } from '../../../../shared/types/domain'
import type { ChecklistQuoteContext } from '../../../../shared/api/checklistPricingApi'
import { customerApi } from '../../api/customerApi'
import type { OrderDetailView } from '../orders/types'
import { checklistError } from './errors'
import { checklistMessages } from './messages'
import {
  EVIDENCE_TYPES,
  evidenceTypeFor,
  mediaTotals,
  normalizeContent,
  serializeChecklist,
  serializeChecklistUpdate,
  usesMedia,
  type CatalogChecklistItem,
  type ChecklistRow,
  type ChecklistSnapshot,
  type ChecklistUpdatePayload,
  type ServiceChecklistItem,
} from './types'
import { useChecklistQuote } from './useChecklistQuote'

const isCount = (value: number) =>
  Number.isInteger(value) && value >= 0 && value <= 500

export function snapshotToChecklistRows(
  items: ChecklistSnapshot[] = [],
): ChecklistRow[] {
  return [...items]
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id))
    .map((item) => {
      const includedImageCount = item.includedImageCountSnapshot ?? 0
      const includedVideoCount = item.includedVideoCountSnapshot ?? 0
      const requestedImageCount =
        item.requestedImageCount ?? includedImageCount
      const requestedVideoCount =
        item.requestedVideoCount ?? includedVideoCount
      const rawType = item.requiredEvidenceType
      const requiredEvidenceType: RequiredEvidenceType =
        !rawType || rawType === 'IMAGE_OR_VIDEO'
          ? evidenceTypeFor(
              requestedImageCount || includedImageCount,
              requestedVideoCount || includedVideoCount,
            )
          : rawType
      return {
        key: `existing-${item.id}`,
        existingItemId: item.id,
        sourceChecklistId: item.sourceChecklistId ?? null,
        version: item.sourceChecklistVersion ?? null,
        originalContent: item.content,
        content: item.content,
        description: item.description,
        executionSteps: item.executionSteps,
        inputRequirements: item.inputRequirements,
        expectedOutputs: item.expectedOutputs,
        selected: true,
        minimumEvidenceCount: item.minimumEvidenceCount ?? 1,
        requiredEvidenceType,
        includedImageCount,
        includedVideoCount,
        requestedImageCount,
        requestedVideoCount,
        mandatory: item.required === true,
        packageItem: item.sourceType === 'SERVICE_TEMPLATE',
      }
    })
}

function mergeCatalogMetadata(
  baseRows: ChecklistRow[],
  templateItems: ServiceChecklistItem[],
  catalogItems: CatalogChecklistItem[],
): ChecklistRow[] {
  const activeTemplate = [...templateItems]
    .filter((item) => item.serviceActive && item.checklistActive)
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
    )
  const templateByChecklistId = new Map(
    activeTemplate.map((item) => [item.checklistId, item]),
  )
  const catalogById = new Map(catalogItems.map((item) => [item.id, item]))
  const existingSourceIds = new Set(
    baseRows
      .map((row) => row.sourceChecklistId)
      .filter((id): id is string => Boolean(id)),
  )

  const enrichedExisting = baseRows.map((row) => {
    if (!row.sourceChecklistId) return row
    const tpl = templateByChecklistId.get(row.sourceChecklistId)
    const cat = catalogById.get(row.sourceChecklistId)
    return {
      ...row,
      version: row.version ?? tpl?.checklistVersion ?? cat?.version ?? 0,
      mandatory: row.mandatory || tpl?.required === true,
      description: row.description ?? tpl?.description ?? cat?.description,
      executionSteps:
        row.executionSteps ?? tpl?.executionSteps ?? cat?.executionSteps,
      inputRequirements:
        row.inputRequirements ??
        tpl?.inputRequirements ??
        cat?.inputRequirements,
      expectedOutputs:
        row.expectedOutputs ?? tpl?.expectedOutputs ?? cat?.expectedOutputs,
    }
  })

  const unselectedTemplateRows: ChecklistRow[] = activeTemplate
    .filter((item) => !existingSourceIds.has(item.checklistId))
    .map((item) => ({
      key: `template-${item.id}`,
      existingItemId: null,
      sourceChecklistId: item.checklistId,
      version: item.checklistVersion,
      originalContent: item.content,
      content: item.content,
      description: item.description,
      executionSteps: item.executionSteps,
      inputRequirements: item.inputRequirements,
      expectedOutputs: item.expectedOutputs,
      selected: false,
      minimumEvidenceCount: item.minimumEvidenceCount ?? 1,
      requiredEvidenceType: evidenceTypeFor(
        item.includedImageCount ?? 0,
        item.includedVideoCount ?? 0,
      ),
      includedImageCount: item.includedImageCount ?? 0,
      includedVideoCount: item.includedVideoCount ?? 0,
      requestedImageCount: item.includedImageCount ?? 0,
      requestedVideoCount: item.includedVideoCount ?? 0,
      mandatory: item.required === true,
      packageItem: true,
    }))

  const templateChecklistIds = new Set(
    activeTemplate.map((item) => item.checklistId),
  )
  const unselectedCatalogRows: ChecklistRow[] = catalogItems
    .filter(
      (item) =>
        !existingSourceIds.has(item.id) && !templateChecklistIds.has(item.id),
    )
    .map((item) => ({
      key: `catalog-${item.id}`,
      existingItemId: null,
      sourceChecklistId: item.id,
      version: item.version,
      originalContent: item.content,
      content: item.content,
      description: item.description,
      executionSteps: item.executionSteps,
      inputRequirements: item.inputRequirements,
      expectedOutputs: item.expectedOutputs,
      selected: false,
      minimumEvidenceCount: 1,
      requiredEvidenceType: evidenceTypeFor(
        item.includedImageCount ?? 0,
        item.includedVideoCount ?? 0,
      ),
      includedImageCount: item.includedImageCount ?? 0,
      includedVideoCount: item.includedVideoCount ?? 0,
      requestedImageCount: item.includedImageCount ?? 0,
      requestedVideoCount: item.includedVideoCount ?? 0,
      mandatory: false,
      packageItem: false,
    }))

  return [
    ...enrichedExisting,
    ...unselectedTemplateRows,
    ...unselectedCatalogRows,
  ]
}

export function useOrderChecklistEdit(
  order: OrderDetailView | undefined,
  enabled: boolean,
) {
  const { t } = useI18n(checklistMessages)
  const serviceId = order?.serviceId ?? ''
  const initialRows = useMemo(
    () => snapshotToChecklistRows(order?.checklistItems ?? []),
    [order?.checklistItems],
  )
  const [rows, setRows] = useState<ChecklistRow[]>(initialRows)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'stale'>('ready')
  const [error, setError] = useState<unknown>(null)
  const [catalogCache, setCatalogCache] = useState<{
    template: ServiceChecklistItem[]
    catalog: CatalogChecklistItem[]
  }>({ template: [], catalog: [] })
  const [reloadCounter, setReloadCounter] = useState(0)
  const customSequence = useRef(0)

  // Keep rows synced with order snapshot when not actively editing or when order revision changes
  useEffect(() => {
    if (!enabled) {
      setRows(mergeCatalogMetadata(initialRows, catalogCache.template, catalogCache.catalog))
      setStatus('ready')
      setError(null)
    }
  }, [catalogCache.catalog, catalogCache.template, enabled, initialRows])

  useEffect(() => {
    if (!enabled || !serviceId) return
    const controller = new AbortController()
    let active = true
    Promise.allSettled([
      customerApi.getServiceChecklist(serviceId, controller.signal),
      customerApi.getChecklistCatalog(controller.signal),
    ]).then(([tplRes, catRes]) => {
      if (!active || controller.signal.aborted) return
      const template = tplRes.status === 'fulfilled' ? tplRes.value : []
      const catalog = catRes.status === 'fulfilled' ? catRes.value : []
      setCatalogCache({ template, catalog })
      setRows((current) => mergeCatalogMetadata(current, template, catalog))
      setStatus('ready')
    })
    return () => {
      active = false
      controller.abort()
    }
  }, [enabled, reloadCounter, serviceId])

  const reset = useCallback(() => {
    setRows(
      mergeCatalogMetadata(
        initialRows,
        catalogCache.template,
        catalogCache.catalog,
      ),
    )
    setStatus('ready')
    setError(null)
  }, [catalogCache.catalog, catalogCache.template, initialRows])

  const selected = rows.filter((row) => row.selected)
  let validation: string | null = null
  if (selected.length > 100) validation = t.limit
  else if (
    selected.some((row) => {
      const length = normalizeContent(row.content).length
      return length < 1 || length > 500
    })
  )
    validation = t.length
  else if (
    selected.some(
      (row) =>
        !Number.isInteger(row.minimumEvidenceCount) ||
        row.minimumEvidenceCount < 1 ||
        row.minimumEvidenceCount > 50,
    )
  )
    validation = t.invalidEvidenceCount
  else if (
    selected.some(
      (row) =>
        !EVIDENCE_TYPES.includes(
          row.requiredEvidenceType as (typeof EVIDENCE_TYPES)[number],
        ),
    )
  )
    validation = t.invalidEvidenceType
  else if (
    selected.some(
      (row) =>
        !isCount(row.requestedImageCount) || !isCount(row.requestedVideoCount),
    )
  )
    validation = t.invalidMediaCount
  else if (
    selected.some(
      (row) =>
        row.includedImageCount + row.includedVideoCount > 0 &&
        row.requestedImageCount + row.requestedVideoCount < 1,
    )
  )
    validation = t.mediaRequired
  else if (
    selected.some(
      (row) =>
        row.requiredEvidenceType === 'IMAGE_AND_VIDEO' &&
        (row.requestedImageCount < 1 || row.requestedVideoCount < 1),
    )
  )
    validation = t.bothMediaRequired
  else if (
    new Set(selected.map((row) => normalizeContent(row.content).toLowerCase()))
      .size !== selected.length
  )
    validation = t.duplicate
  else if (rows.some((row) => row.mandatory && !row.selected))
    validation = t.requiredMissing

  const pricingContext = useMemo<ChecklistQuoteContext | undefined>(() => {
    if (!enabled || !order) return undefined
    const areaHa =
      order.radiusM && order.radiusM > 0
        ? Number(((Math.PI * order.radiusM * order.radiusM) / 10000).toFixed(1))
        : undefined
    const occurrences =
      order.recurrenceType &&
      order.recurrenceType !== 'NONE' &&
      (order.recurrenceOccurrences ?? 1) > 1
        ? order.recurrenceOccurrences!
        : 1
    return {
      orderId: order.id,
      areaHa: areaHa && areaHa > 0 ? areaHa : undefined,
      lengthKm: Number(order.estimatedLengthM || 0) / 1000,
      altitudeM: Number.isFinite(order.altitudeM) ? (order.altitudeM ?? 0) : 0,
      occurrences,
      resultFormats: order.resultFormats,
      permitStatus:
        (order.permitStatus as 'NONE' | 'HAVE_PERMIT' | 'NEED_SUPPORT' | null) ??
        undefined,
    }
  }, [enabled, order])

  const quoteItems =
    enabled && status === 'ready' && !validation
      ? selected.map((row) => ({
          ...(row.existingItemId ? { existingItemId: row.existingItemId } : {}),
          ...(row.sourceChecklistId
            ? { sourceChecklistId: row.sourceChecklistId }
            : { content: normalizeContent(row.content) }),
          ...(usesMedia(row)
            ? {
                requestedImageCount: row.requestedImageCount,
                requestedVideoCount: row.requestedVideoCount,
              }
            : {}),
        }))
      : null

  const quote = useChecklistQuote(
    enabled ? serviceId : '',
    quoteItems,
    pricingContext,
  )

  const initialSerialized = useMemo(
    () => JSON.stringify(serializeChecklistUpdate(initialRows)),
    [initialRows],
  )
  const currentSerialized = useMemo(
    () => JSON.stringify(serializeChecklistUpdate(rows)),
    [rows],
  )
  const isDirty = currentSerialized !== initialSerialized

  function change(
    key: string,
    patch: Partial<
      Pick<
        ChecklistRow,
        | 'content'
        | 'selected'
        | 'minimumEvidenceCount'
        | 'requiredEvidenceType'
        | 'requestedImageCount'
        | 'requestedVideoCount'
      >
    >,
  ) {
    setRows((previous) =>
      previous.map((row) => {
        if (row.key !== key) return row
        if (row.mandatory && patch.selected === false) return row
        return { ...row, ...patch }
      }),
    )
  }

  return {
    rows,
    status,
    validation,
    error: status === 'error' ? checklistError(error, true) : null,
    serviceId,
    selectedCount: selected.length,
    mediaTotals: mediaTotals(rows),
    totalCount: rows.filter((row) => row.packageItem !== false || row.selected)
      .length,
    quote,
    quoteItems: () => quoteItems,
    valid: status === 'ready' && !validation,
    isDirty,
    reset,
    change,
    add: () =>
      setRows((previous) =>
        previous.filter((row) => row.selected).length < 100
          ? [
              ...previous,
              {
                key: `custom-${++customSequence.current}`,
                existingItemId: null,
                sourceChecklistId: null,
                version: null,
                originalContent: '',
                content: '',
                selected: true,
                minimumEvidenceCount: 1,
                requiredEvidenceType: 'IMAGE',
                includedImageCount: 0,
                includedVideoCount: 0,
                requestedImageCount: 0,
                requestedVideoCount: 0,
                mandatory: false,
                packageItem: false,
              },
            ]
          : previous,
      ),
    remove: (key: string) =>
      setRows((previous) =>
        previous.filter((row) => {
          if (row.key !== key) return true
          if (row.mandatory) return true
          // Custom items (including existing custom snapshot items) can be removed from the list;
          // template/catalog items are deselected via change({ selected: false }).
          return row.sourceChecklistId !== null
        }),
      ),
    reload: () => {
      setStatus('ready')
      setError(null)
      setReloadCounter((c) => c + 1)
    },
    markStale: () => {
      setStatus('stale')
      setError(t.stale)
    },
    serialize: () => {
      if (status !== 'ready' || validation)
        throw new Error('Checklist is not ready')
      return serializeChecklist(rows)
    },
    serializeUpdate: (): ChecklistUpdatePayload => {
      if (status !== 'ready' || validation)
        throw new Error('Checklist is not ready')
      return {
        expectedRevision: order?.checklistRevision ?? 1,
        items: serializeChecklistUpdate(rows),
      }
    },
  }
}

