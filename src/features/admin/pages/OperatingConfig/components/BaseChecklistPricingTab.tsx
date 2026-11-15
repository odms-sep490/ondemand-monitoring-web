import { useEffect, useState } from 'react'
import { Button } from '../../../../../shared/components/ui'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { ApiError } from '../../../../../shared/api/httpClient'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import {
  baseChecklistPricingApi,
  type BaseChecklistPriceRow,
} from '../../../api/baseChecklistPricingApi'
import './baseChecklistPricing.css'
import { baseChecklistPricingMessages } from './BaseChecklistPricingTab.messages'

type Draft = {
  basePrice: string
  standardAreaHa: string
  extraImageUnitPrice: string
  extraVideoUnitPrice: string
  version: number
}
type ParsedDraft =
  | {
      ok: true
      basePrice: number
      standardAreaM2: number
      extraImageUnitPrice: number
      extraVideoUnitPrice: number
    }
  | { ok: false; error: 'price' | 'area' | 'mediaPrice' }
type BulkSaveResult = { saved: number; requested: number }

export function BaseChecklistPricingTab() {
  const { t, locale } = useI18n(baseChecklistPricingMessages)
  const query = useApiQuery(
    (signal) => baseChecklistPricingApi.list(signal),
    [],
  )
  const [savedRows, setSavedRows] = useState<
    Record<string, BaseChecklistPriceRow>
  >({})
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkSaveResult | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPackage, setSelectedPackage] = useState('all')
  const [sampleAreaHa, setSampleAreaHa] = useState('16.93')
  const [previewRows, setPreviewRows] = useState<
    BaseChecklistPriceRow[] | null
  >(null)
  const [previewBusy, setPreviewBusy] = useState(false)

  useEffect(() => {
    if (!query.data) return
    setSavedRows({})
    setDrafts((current) => {
      const next = { ...current }
      for (const row of query.data ?? []) {
        const draft = next[row.checklistId]
        if (!draft || draft.version !== row.version) {
          next[row.checklistId] = draftFrom(row)
        }
      }
      return next
    })
  }, [query.data])

  const previewById = new Map(
    (previewRows ?? []).map((row) => [row.checklistId, row]),
  )
  const allRows = (query.data ?? []).map(
    (row) => savedRows[row.checklistId] ?? row,
  )
  const packageOptions = [
    ...new Set(allRows.flatMap((row) => row.packageNames)),
  ].sort((left, right) => left.localeCompare(right, 'vi'))
  const search = normalizeSearch(searchTerm.trim())
  const visibleRows = allRows.filter((row) => {
    const matchesSearch =
      !search ||
      normalizeSearch([row.name, ...row.packageNames].join(' ')).includes(
        search,
      )
    const matchesPackage =
      selectedPackage === 'all' ||
      (selectedPackage === '__unassigned__'
        ? row.packageNames.length === 0
        : row.packageNames.includes(selectedPackage))
    return matchesSearch && matchesPackage
  })
  const dirtyRows = allRows.filter((row) =>
    isDraftChanged(row, drafts[row.checklistId] ?? draftFrom(row)),
  )
  const areaHaValue = Number(sampleAreaHa)
  const estimatedAreaM2 =
    Number.isFinite(areaHaValue) && areaHaValue > 0
      ? Math.round(areaHaValue * 10_000)
      : 0
  const formattedSampleArea = estimatedAreaM2
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(areaHaValue)} ha (${new Intl.NumberFormat(locale).format(estimatedAreaM2)} m²)`
    : '—'

  function patchDraft(id: string, changes: Partial<Draft>) {
    setDrafts((rows) => ({ ...rows, [id]: { ...rows[id], ...changes } }))
    setSavedId(null)
    setBulkResult(null)
    setError(null)
  }

  async function save(row: BaseChecklistPriceRow) {
    const draft = drafts[row.checklistId] ?? draftFrom(row)
    const parsed = parseDraft(draft)
    if (!parsed.ok) {
      setError(
        parsed.error === 'price'
          ? t.invalidPrice
          : parsed.error === 'area'
            ? t.invalidArea
            : t.invalidMediaPrice,
      )
      return
    }
    setBusyId(row.checklistId)
    setError(null)
    setSavedId(null)
    setBulkResult(null)
    try {
      const result = await baseChecklistPricingApi.update({
        checklistId: row.checklistId,
        basePrice: parsed.basePrice,
        standardAreaM2: parsed.standardAreaM2,
        extraImageUnitPrice: parsed.extraImageUnitPrice,
        extraVideoUnitPrice: parsed.extraVideoUnitPrice,
        version: draft.version,
      })
      setDrafts((current) => ({
        ...current,
        [row.checklistId]: draftFrom(result),
      }))
      setSavedRows((current) => ({ ...current, [row.checklistId]: result }))
      setSavedId(row.checklistId)
      setPreviewRows(null)
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'STALE_PRICING_REVISION'
          ? t.stale
          : t.saveError,
      )
      query.reload()
    } finally {
      setBusyId(null)
    }
  }

  async function saveAll() {
    const prepared = dirtyRows.map((row) => ({
      row,
      draft: drafts[row.checklistId] ?? draftFrom(row),
    }))
    for (const item of prepared) {
      const parsed = parseDraft(item.draft)
      if (!parsed.ok) {
        setError(
          parsed.error === 'price'
            ? t.invalidPriceFor(item.row.name)
            : parsed.error === 'area'
              ? t.invalidAreaFor(item.row.name)
              : t.invalidMediaPriceFor(item.row.name),
        )
        return
      }
    }

    if (prepared.length === 0) return
    setBulkBusy(true)
    setError(null)
    setSavedId(null)
    setBulkResult(null)
    setPreviewRows(null)
    let saved = 0
    let shouldReload = false
    try {
      for (const { row, draft } of prepared) {
        const parsed = parseDraft(draft)
        if (!parsed.ok) break
        setBusyId(row.checklistId)
        try {
          const result = await baseChecklistPricingApi.update({
            checklistId: row.checklistId,
            basePrice: parsed.basePrice,
            standardAreaM2: parsed.standardAreaM2,
            extraImageUnitPrice: parsed.extraImageUnitPrice,
            extraVideoUnitPrice: parsed.extraVideoUnitPrice,
            version: draft.version,
          })
          setDrafts((current) => ({
            ...current,
            [row.checklistId]: draftFrom(result),
          }))
          setSavedRows((current) => ({ ...current, [row.checklistId]: result }))
          saved += 1
        } catch (cause) {
          setError(
            cause instanceof ApiError && cause.code === 'STALE_PRICING_REVISION'
              ? t.stale
              : t.saveError,
          )
          shouldReload = true
          break
        }
      }
      if (saved > 0) setBulkResult({ saved, requested: prepared.length })
    } finally {
      setBusyId(null)
      setBulkBusy(false)
      if (shouldReload) query.reload()
    }
  }

  async function preview() {
    if (
      !Number.isFinite(areaHaValue) ||
      areaHaValue <= 0 ||
      !Number.isSafeInteger(estimatedAreaM2) ||
      estimatedAreaM2 <= 0
    ) {
      setError(t.invalidSampleArea)
      return
    }
    setPreviewBusy(true)
    setError(null)
    try {
      setPreviewRows(await baseChecklistPricingApi.preview(estimatedAreaM2))
    } catch {
      setError(t.previewError)
    } finally {
      setPreviewBusy(false)
    }
  }

  return (
    <section className="adm-base-price" aria-labelledby="base-price-title">
      <header className="adm-base-price-header">
        <div>
          <h2 id="base-price-title">{t.title}</h2>
          <p>{t.description}</p>
        </div>
        <form
          className="adm-base-price-preview-form"
          onSubmit={(event) => {
            event.preventDefault()
            void preview()
          }}
        >
          <label>
            <span>{t.sampleArea}</span>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={sampleAreaHa}
              onChange={(event) => {
                setSampleAreaHa(event.target.value)
                setPreviewRows(null)
                setError(null)
              }}
            />
            <small className="adm-base-price-sample-hint">
              {t.sampleAreaHint(formattedSampleArea)}
            </small>
          </label>
          <Button type="submit" variant="secondary" loading={previewBusy}>
            {t.showPreview}
          </Button>
        </form>
      </header>

      {error ? (
        <p role="alert" className="adm-base-price-notice is-error">
          {error}
        </p>
      ) : null}
      {savedId ? (
        <p role="status" className="adm-base-price-notice">
          {t.saved}
        </p>
      ) : null}
      {bulkResult ? (
        <p role="status" className="adm-base-price-notice">
          {bulkResult.saved === bulkResult.requested
            ? t.savedMany(bulkResult.saved)
            : t.savedPartially(bulkResult.saved, bulkResult.requested)}
        </p>
      ) : null}
      {query.loading && !query.data ? <p role="status">{t.loading}</p> : null}
      {query.error && !query.data ? <p role="alert">{t.loadError}</p> : null}
      {query.data?.length === 0 ? <p>{t.empty}</p> : null}

      {query.data && query.data.length > 0 ? (
        <>
          <div className="adm-base-price-toolbar">
            <div className="adm-base-price-filters">
              <label className="adm-base-price-filter adm-base-price-search">
                <span>{t.searchLabel}</span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder={t.searchPlaceholder}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <label className="adm-base-price-filter">
                <span>{t.packageFilter}</span>
                <select
                  value={selectedPackage}
                  onChange={(event) => setSelectedPackage(event.target.value)}
                >
                  <option value="all">{t.allPackages}</option>
                  <option value="__unassigned__">{t.unassignedPackage}</option>
                  {packageOptions.map((packageName) => (
                    <option value={packageName} key={packageName}>
                      {packageName}
                    </option>
                  ))}
                </select>
              </label>
              <span className="adm-base-price-result-count" aria-live="polite">
                {t.resultCount(visibleRows.length, allRows.length)}
              </span>
            </div>
            <div className="adm-base-price-bulk-actions">
              {dirtyRows.length > 0 ? (
                <span className="adm-base-price-unsaved-count" role="status">
                  {t.unsavedCount(dirtyRows.length)}
                </span>
              ) : null}
              <Button
                variant="primary"
                loading={bulkBusy}
                disabled={dirtyRows.length === 0 || busyId != null}
                onClick={() => void saveAll()}
              >
                {t.saveAll}
              </Button>
            </div>
          </div>
          {visibleRows.length === 0 ? (
            <div className="adm-base-price-no-results" role="status">
              <p>{t.noResults}</p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedPackage('all')
                }}
              >
                {t.clearFilters}
              </Button>
            </div>
          ) : (
            <div className="adm-base-price-table-scroll">
              <table className="adm-base-price-table">
                <thead>
                  <tr>
                    <th>{t.name}</th>
                    <th>{t.packages}</th>
                    <th>{t.basePrice}</th>
                    <th>{t.standardArea}</th>
                    <th>{t.mediaPrices}</th>
                    <th>{t.preview}</th>
                    <th aria-label={t.save} />
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const draft = drafts[row.checklistId] ?? draftFrom(row)
                    const previewRow = previewById.get(row.checklistId)
                    const dirty = isDraftChanged(row, draft)
                    return (
                      <tr
                        key={row.checklistId}
                        className={dirty ? 'is-dirty' : undefined}
                      >
                        <th scope="row">
                          <span>{row.name}</span>
                          <small
                            className={row.active ? 'is-active' : 'is-inactive'}
                          >
                            {row.active ? t.active : t.inactive}
                          </small>
                          {dirty ? (
                            <small className="is-unsaved">{t.unsaved}</small>
                          ) : null}
                        </th>
                        <td>
                          {row.packageNames.length > 0 ? (
                            <ul
                              className="adm-base-price-packages"
                              aria-label={t.packages}
                            >
                              {row.packageNames.map((packageName) => (
                                <li
                                  className="adm-base-price-package"
                                  key={packageName}
                                >
                                  {packageName}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="is-muted">{t.noPackages}</span>
                          )}
                        </td>
                        <td>
                          <input
                            aria-label={`${t.basePrice}: ${row.name}`}
                            type="number"
                            min="0"
                            step="1"
                            value={draft.basePrice}
                            disabled={bulkBusy || busyId === row.checklistId}
                            onChange={(event) =>
                              patchDraft(row.checklistId, {
                                basePrice: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            aria-label={`${t.standardArea}: ${row.name}`}
                            type="number"
                            min="0.0001"
                            step="0.0001"
                            value={draft.standardAreaHa}
                            disabled={bulkBusy || busyId === row.checklistId}
                            onChange={(event) =>
                              patchDraft(row.checklistId, {
                                standardAreaHa: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td className="adm-base-price-media-cell">
                          <div className="adm-base-price-media-rates">
                            <label>
                              <span>{t.imageUnit}</span>
                              <input
                                aria-label={`${t.extraImagePrice}: ${row.name}`}
                                type="number"
                                min="0"
                                step="1000"
                                value={draft.extraImageUnitPrice}
                                disabled={bulkBusy || busyId === row.checklistId}
                                onChange={(event) =>
                                  patchDraft(row.checklistId, {
                                    extraImageUnitPrice: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span>{t.videoUnit}</span>
                              <input
                                aria-label={`${t.extraVideoPrice}: ${row.name}`}
                                type="number"
                                min="0"
                                step="1000"
                                value={draft.extraVideoUnitPrice}
                                disabled={bulkBusy || busyId === row.checklistId}
                                onChange={(event) =>
                                  patchDraft(row.checklistId, {
                                    extraVideoUnitPrice: event.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                        </td>
                        <td>
                          {previewRow?.calculatedPrice != null ? (
                            <span
                              title={previewRow.calculationDisplay ?? undefined}
                            >
                              {formatVnd(previewRow.calculatedPrice)}
                            </span>
                          ) : previewRows ? (
                            <span className="is-unconfigured">
                              {previewRow?.calculationError ?? t.missingArea}
                            </span>
                          ) : (
                            <span className="is-muted">—</span>
                          )}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="primary"
                            loading={busyId === row.checklistId}
                            disabled={busyId != null || !dirty}
                            onClick={() => void save(row)}
                          >
                            {t.save}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}

function draftFrom(row: BaseChecklistPriceRow): Draft {
  return {
    basePrice: String(row.basePrice ?? 0),
    standardAreaHa: toHectares(row.standardAreaM2),
    extraImageUnitPrice: String(row.extraImageUnitPrice ?? 50_000),
    extraVideoUnitPrice: String(row.extraVideoUnitPrice ?? 100_000),
    version: row.version,
  }
}

function parseDraft(draft: Draft): ParsedDraft {
  if (draft.basePrice.trim() === '') return { ok: false, error: 'price' }
  const basePrice = Number(draft.basePrice)
  if (!Number.isSafeInteger(basePrice) || basePrice < 0)
    return { ok: false, error: 'price' }
  const standardAreaHa = Number(draft.standardAreaHa)
  if (!Number.isFinite(standardAreaHa) || standardAreaHa <= 0)
    return { ok: false, error: 'area' }
  const extraImageUnitPrice = Number(draft.extraImageUnitPrice)
  const extraVideoUnitPrice = Number(draft.extraVideoUnitPrice)
  if (
    !Number.isSafeInteger(extraImageUnitPrice) ||
    extraImageUnitPrice < 0 ||
    !Number.isSafeInteger(extraVideoUnitPrice) ||
    extraVideoUnitPrice < 0
  ) {
    return { ok: false, error: 'mediaPrice' }
  }
  const standardAreaM2 = Math.round(standardAreaHa * 10_000 * 1_000) / 1_000
  return {
    ok: true,
    basePrice,
    standardAreaM2,
    extraImageUnitPrice,
    extraVideoUnitPrice,
  }
}

function toHectares(squareMeters: number | null) {
  return squareMeters == null ? '' : String(squareMeters / 10_000)
}

function isDraftChanged(row: BaseChecklistPriceRow, draft: Draft) {
  return (
    draft.basePrice !== String(row.basePrice ?? 0) ||
    draft.standardAreaHa !== toHectares(row.standardAreaM2) ||
    draft.extraImageUnitPrice !== String(row.extraImageUnitPrice ?? 50_000) ||
    draft.extraVideoUnitPrice !== String(row.extraVideoUnitPrice ?? 100_000)
  )
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLocaleLowerCase('vi-VN')
}
