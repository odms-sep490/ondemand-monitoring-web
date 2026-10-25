import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { customerApi } from '../../api/customerApi'
import { checklistError } from './errors'
import { checklistMessages } from './messages'
import { useChecklistQuote } from './useChecklistQuote'
import type { ChecklistQuoteContext } from '../../../../shared/api/checklistPricingApi'
import {
  EVIDENCE_TYPES,
  evidenceTypeFor,
  mediaTotals,
  normalizeContent,
  serializeChecklist,
  usesMedia,
  type ChecklistRow,
} from './types'

type State = {
  serviceId: string
  status: 'loading' | 'ready' | 'error' | 'stale'
  rows: ChecklistRow[]
  error: unknown
}

const isCount = (value: number) =>
  Number.isInteger(value) && value >= 0 && value <= 500

/** Scoped to one creation flow, never shared with historical order details. */
export function useOrderChecklist(
  serviceId: string,
  pricingContext?: ChecklistQuoteContext,
) {
  const { t } = useI18n(checklistMessages)
  const [state, setState] = useState<State | null>(null)
  const [revision, setRevision] = useState(0)
  const sequence = useRef(0)
  const customSequence = useRef(0)

  useEffect(() => {
    const requestId = ++sequence.current
    const controller = new AbortController()
    if (!serviceId) setState(null)
    if (serviceId) {
      setState({ serviceId, status: 'loading', rows: [], error: null })
      customerApi
        .getServiceChecklist(serviceId, controller.signal)
        .then((items) => {
          if (controller.signal.aborted || requestId !== sequence.current)
            return
          // Versions belong to catalog items, NOT the service association.
          if (
            items.some(
              (item) =>
                item.serviceId !== serviceId ||
                !item.checklistId?.trim() ||
                !Number.isSafeInteger(item.checklistVersion) ||
                item.checklistVersion < 0,
            ) ||
            new Set(items.map((item) => item.checklistId)).size !== items.length
          ) {
            throw new Error('Invalid template response')
          }
          const packageIds = new Set(items.map((item) => item.checklistId))
          const packageRows = [...items]
            .filter((item) => item.serviceActive && item.checklistActive)
            .sort(
              (a, b) =>
                a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
            )
            .map((item) => ({
              key: item.id,
              sourceChecklistId: item.checklistId,
              version: item.checklistVersion,
              originalContent: item.content,
              content: item.content,
              description: item.description,
              executionSteps: item.executionSteps,
              inputRequirements: item.inputRequirements,
              expectedOutputs: item.expectedOutputs,
              selected: true,
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
          setState({
            serviceId,
            status: 'ready',
            rows: packageRows,
            error: null,
          })
          void customerApi
            .getChecklistCatalog(controller.signal)
            .then((catalog) => {
              if (controller.signal.aborted || requestId !== sequence.current)
                return
              const catalogRows = catalog
                .filter((item) => !packageIds.has(item.id))
                .map((item) => ({
                  key: `catalog-${item.id}`,
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
              setState((previous) =>
                previous?.serviceId === serviceId && previous.status === 'ready'
                  ? { ...previous, rows: [...previous.rows, ...catalogRows] }
                  : previous,
              )
            })
            .catch(() => undefined)
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId !== sequence.current)
            return
          setState({
            serviceId,
            status: 'error',
            rows: [],
            error,
          })
        })
    }
    return () => controller.abort()
  }, [serviceId, revision])

  const current = state?.serviceId === serviceId ? state : null
  const status = !serviceId ? 'idle' : (current?.status ?? 'loading')
  const rows = current?.rows ?? []
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

  const quoteItems =
    status === 'ready' && !validation
      ? selected.map((row) => ({
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
  const quote = useChecklistQuote(serviceId, quoteItems, pricingContext)

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
    setState((previous) =>
      previous?.serviceId === serviceId && previous.status === 'ready'
        ? {
            ...previous,
            rows: previous.rows.map((row) =>
              row.key === key ? { ...row, ...patch } : row,
            ),
          }
        : previous,
    )
  }

  return {
    rows,
    status,
    validation,
    error: status === 'error' ? checklistError(current?.error, true) : null,
    serviceId,
    selectedCount: selected.length,
    /** Images and videos requested across the selected checklists. */
    mediaTotals: mediaTotals(rows),
    /** Rows the customer can actually see and pick from (package rows plus anything selected or added). */
    totalCount: rows.filter((row) => row.packageItem !== false || row.selected)
      .length,
    quote,
    /** Choices and quantities for the backend price quote; null while the form is incomplete. */
    quoteItems: () => quoteItems,
    valid: status === 'ready' && !validation,
    change,
    add: () =>
      setState((previous) =>
        previous?.serviceId === serviceId &&
        previous.status === 'ready' &&
        previous.rows.filter((row) => row.selected).length < 100
          ? {
              ...previous,
              rows: [
                ...previous.rows,
                {
                  key: `custom-${++customSequence.current}`,
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
              ],
            }
          : previous,
      ),
    remove: (key: string) =>
      setState((previous) =>
        previous?.serviceId === serviceId && previous.status === 'ready'
          ? {
              ...previous,
              rows: previous.rows.filter(
                (row) => row.key !== key || row.sourceChecklistId !== null,
              ),
            }
          : previous,
      ),
    reload: () => {
      setState({ serviceId, status: 'loading', rows: [], error: null })
      setRevision((value) => value + 1)
    },
    markStale: () =>
      setState((previous) =>
        previous?.serviceId === serviceId
          ? { ...previous, status: 'stale', error: t.stale }
          : previous,
      ),
    serialize: () => {
      if (status !== 'ready' || validation)
        throw new Error('Checklist is not ready')
      return serializeChecklist(rows)
    },
  }
}

export type OrderChecklistEditorState = ReturnType<typeof useOrderChecklist>
