import { Button, Checkbox } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Icon } from '../../../../shared/components/Icon'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { ChecklistGuidance } from '../../../../shared/components/ChecklistGuidance'
import { useI18n } from '../../../../shared/i18n'
import { Card } from '../common/ui'
import { checklistMessages } from '../../lib/checklist/messages'
import {
  extraMedia,
  normalizeContent,
  singleEvidenceCount,
  usesMedia,
  withEvidenceType,
  withSingleEvidenceCount,
  type ChecklistRow,
} from '../../lib/checklist/types'
import type { OrderChecklistEditorState } from '../../lib/checklist/useOrderChecklist'
import type { RequiredEvidenceType } from '../../../../shared/types/domain'
import { ChecklistQuoteCard } from './ChecklistQuoteCard'
import './Checklist.css'

/** Rows shown before "show more" in the compact variant. */
const COMPACT_VISIBLE = 50

export function ChecklistEditor({
  checklist,
  disabled = false,
  onReload,
  variant = 'full',
  quote = false,
}: {
  checklist: OrderChecklistEditorState
  disabled?: boolean
  onReload?: () => void
  /** `compact` renders one-line rows; a row expands to a textarea on edit. */
  variant?: 'full' | 'compact'
  /** Show the backend-calculated price of the selection (needs an authenticated customer). */
  quote?: boolean
}) {
  const { t } = useI18n(checklistMessages)
  const { status, rows } = checklist
  // Catalog entries outside the selected service package are kept in state for
  // identity/pricing purposes, but they must not look like service defaults.
  // They become visible only after the customer explicitly selects them.
  const visibleRows = rows.filter(
    (row) => row.packageItem !== false || row.selected,
  )
  const compact = variant === 'compact'
  const showAdvancedToolbar = compact && visibleRows.length > 8
  const ready = status === 'ready'
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'list' | 'group'>('list')
  const openNewRow = useRef(false)
  const previousCount = useRef(visibleRows.length)

  // A row added by the user opens straight into edit mode.
  useEffect(() => {
    if (openNewRow.current && visibleRows.length > previousCount.current) {
      setEditingKey(visibleRows[visibleRows.length - 1].key)
    }
    openNewRow.current = false
    previousCount.current = visibleRows.length
  }, [visibleRows])

  const lastEditingKey = useRef<string | null>(null)

  useEffect(() => {
    if (editingKey) {
      lastEditingKey.current = editingKey
      document.getElementById(`requirement-${editingKey}`)?.focus()
      return
    }

    // Return keyboard focus to the same item's edit action after "Done".
    const key = lastEditingKey.current
    lastEditingKey.current = null
    if (key) document.getElementById(`checklist-edit-${key}`)?.focus()
  }, [editingKey])

  const needle = query.trim().toLowerCase()
  const searching = showAdvancedToolbar && needle !== ''
  const hiddenCount =
    compact && !showAll && !searching
      ? Math.max(0, visibleRows.length - COMPACT_VISIBLE)
      : 0
  const addRow = () => {
    openNewRow.current = true
    setShowAll(true)
    setQuery('')
    checklist.add()
  }

  const grouped = showAdvancedToolbar && view === 'group'
  const selectedTotal = visibleRows.filter((row) => row.selected).length
  const awaitingManagerQuote = (row: ChecklistRow) =>
    (row.packageItem === false || !row.sourceChecklistId) &&
    row.selected &&
    checklist.quote.preview?.checklists.some(
      (priced) =>
        priced.quotePending &&
        normalizeContent(priced.content) === normalizeContent(row.content),
    )
  /** The backend price of a selected row, matched the same way the quote is ordered. */
  const priceOf = (row: ChecklistRow) =>
    checklist.quote.preview?.checklists.find((priced) =>
      row.sourceChecklistId
        ? priced.checklistId === row.sourceChecklistId
        : priced.custom &&
          normalizeContent(priced.content) === normalizeContent(row.content),
    )
  const ordered = visibleRows
    .map((row, index) => ({ row, index }))
    .sort((a, b) =>
      grouped ? Number(b.row.selected) - Number(a.row.selected) : 0,
    )
    .map((entry, pos, all) => ({
      ...entry,
      heading:
        grouped &&
        (pos === 0 || all[pos - 1].row.selected !== entry.row.selected)
          ? entry.row.selected
            ? t.groupSelected(selectedTotal)
            : t.groupUnselected(visibleRows.length - selectedTotal)
          : null,
    }))
  const renderRow = (row: ChecklistRow, index: number) => {
    const normalizedLength = normalizeContent(row.content).length
    const invalid =
      row.selected && (normalizedLength < 1 || normalizedLength > 500)
    const expanded = !compact || editingKey === row.key || invalid
    if (hiddenCount && index >= COMPACT_VISIBLE && !expanded) return null
    if (searching && !expanded && !row.content.toLowerCase().includes(needle))
      return null
    const checkbox = (
      <Checkbox
        className="checklist-check"
        checked={row.selected}
        aria-label={t.select(row.content)}
        aria-describedby={compact ? `checklist-summary-${row.key}` : undefined}
        disabled={row.mandatory}
        onChange={(event) =>
          checklist.change(row.key, {
            selected: event.target.checked,
          })
        }
      />
    )
    const numberInput = (
      label: string,
      value: number,
      min: number,
      max: number,
      onChange: (value: number) => void,
    ) => (
      <label>
        <span className="checklist-evidence-field-label">{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={!row.selected}
          aria-label={`${label} ${index + 1}`}
          onChange={(event) =>
            onChange(event.target.value === '' ? 0 : Number(event.target.value))
          }
        />
      </label>
    )
    const bothTypes = row.requiredEvidenceType === 'IMAGE_AND_VIDEO'
    const evidenceRequirements = (
      <div className="checklist-evidence-requirements">
        <label>
          <span className="checklist-evidence-field-label">
            {t.evidenceTypeLabel}
          </span>
          <select
            value={
              row.requiredEvidenceType === 'IMAGE_OR_VIDEO'
                ? 'IMAGE_AND_VIDEO'
                : row.requiredEvidenceType
            }
            disabled={!row.selected}
            aria-label={t.evidenceType(index + 1)}
            onChange={(event) =>
              checklist.change(
                row.key,
                withEvidenceType(
                  row,
                  event.target.value as RequiredEvidenceType,
                ),
              )
            }
          >
            <option value="IMAGE">{t.image}</option>
            <option value="VIDEO">{t.video}</option>
            <option value="IMAGE_AND_VIDEO">{t.imageAndVideo}</option>
          </select>
        </label>
        {bothTypes ? (
          <>
            {numberInput(
              t.minimumImagesLabel,
              row.requestedImageCount,
              1,
              500,
              (value) =>
                checklist.change(row.key, { requestedImageCount: value }),
            )}
            {numberInput(
              t.minimumVideosLabel,
              row.requestedVideoCount,
              1,
              500,
              (value) =>
                checklist.change(row.key, { requestedVideoCount: value }),
            )}
          </>
        ) : (
          numberInput(
            t.evidenceCountLabel,
            singleEvidenceCount(row),
            1,
            usesMedia(row) ? 500 : 50,
            (value) =>
              checklist.change(row.key, withSingleEvidenceCount(row, value)),
          )
        )}
        {usesMedia(row) && (
          <small className="checklist-hint">
            {t.includedMedia(row.includedImageCount, row.includedVideoCount)}
            {' · '}
            {t.extraMedia(
              extraMedia(row.requestedImageCount, row.includedImageCount),
              extraMedia(row.requestedVideoCount, row.includedVideoCount),
            )}
            {' · '}
            {t.mediaAcceptanceNote}
          </small>
        )}
      </div>
    )
    if (!expanded) {
      return (
        <div
          className={`checklist-row is-compact${row.selected ? ' is-selected' : ' is-removed'}`}
          key={row.key}
        >
          <div className="checklist-row-header">
            {checkbox}
            <span className="checklist-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span
              id={`checklist-summary-${row.key}`}
              className="checklist-summary"
              title={row.content}
            >
              {row.content || t.emptyContent}
              {!row.sourceChecklistId && awaitingManagerQuote(row) && (
                <span className="checklist-custom-tag is-pending-quote">
                  {t.onDemandService}
                </span>
              )}
              {row.mandatory && (
                <span
                  className="checklist-custom-tag is-mandatory"
                  title={t.mandatoryHint}
                >
                  {t.mandatory}
                </span>
              )}
            </span>
            <span className="checklist-evidence-summary">
              {row.requiredEvidenceType === 'IMAGE_AND_VIDEO'
                ? t.imageAndVideoSummary(
                    row.requestedImageCount,
                    row.requestedVideoCount,
                  )
                : `${singleEvidenceCount(row)} · ${
                    row.requiredEvidenceType === 'VIDEO' ? t.video : t.image
                  }`}
            </span>
            {(() => {
              const priced = row.selected ? priceOf(row) : undefined
              return priced && !priced.quotePending ? (
                <span
                  className="checklist-row-price"
                  title={
                    (checklist.quote.preview?.occurrences ?? 1) > 1
                      ? t.rowPriceVisits(
                          checklist.quote.preview?.occurrences ?? 1,
                        )
                      : undefined
                  }
                >
                  {formatVnd(priced.subtotal)}
                </span>
              ) : (
                <span className="checklist-row-price" aria-hidden="true" />
              )
            })()}
            <span className="checklist-length checklist-length-with-evidence">
              {row.content.length} / 500
            </span>
            <div className="checklist-row-actions">
              <button
                id={`checklist-edit-${row.key}`}
                type="button"
                className="checklist-icon-btn"
                aria-label={t.editRow(row.content)}
                title={t.edit}
                disabled={!row.selected}
                onClick={() => setEditingKey(row.key)}
              >
                <Icon name="edit" width={16} height={16} aria-hidden="true" />
              </button>
              {!row.sourceChecklistId && (
                <button
                  type="button"
                  className="checklist-icon-btn is-danger"
                  aria-label={`${t.remove} ${index + 1}`}
                  title={t.remove}
                  onClick={() => checklist.remove(row.key)}
                >
                  <Icon name="trash" width={16} height={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {row.sourceChecklistId ? (
            <div className="checklist-guidance">
              <ChecklistGuidance
                guidance={row}
                summaryLabel={compact ? t.guidanceSummary : undefined}
              />
            </div>
          ) : awaitingManagerQuote(row) ? (
            <div className="checklist-guidance checklist-custom-details">
              <small className="checklist-hint">{t.onDemandHint}</small>
            </div>
          ) : null}
        </div>
      )
    }
    const length = row.content.length
    const lengthState =
      length > 500 ? ' is-over' : length >= 450 ? ' is-near' : ''
    return (
      <div
        className={`checklist-row${row.selected ? '' : ' is-removed'}`}
        key={row.key}
      >
        {checkbox}
        <div className="checklist-row-main">
          <div className="checklist-row-heading">
            <span className="checklist-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            {!row.sourceChecklistId && (
              <span className="checklist-custom-tag">{t.custom}</span>
            )}
            {awaitingManagerQuote(row) && (
              <span className="checklist-custom-tag is-pending-quote">
                {t.awaitingManagerQuote}
              </span>
            )}
            {row.sourceChecklistId && row.packageItem !== false && (
              <span className="checklist-custom-tag is-default">
                {t.defaultItem}
              </span>
            )}
            {row.sourceChecklistId && row.packageItem === false && (
              <span className="checklist-custom-tag">{t.catalogItem}</span>
            )}
            {!row.sourceChecklistId && (
              <button
                type="button"
                className="checklist-remove"
                onClick={() => checklist.remove(row.key)}
              >
                {t.remove}
              </button>
            )}
            {row.mandatory && (
              <span className="checklist-custom-tag" title={t.mandatoryHint}>
                {t.mandatory}
              </span>
            )}
            {row.sourceChecklistId && !row.mandatory && (
              <button
                type="button"
                className="checklist-remove"
                onClick={() =>
                  checklist.change(row.key, { selected: !row.selected })
                }
              >
                {row.selected ? t.removeDefault : t.restoreDefault}
              </button>
            )}
            {compact && (
              <button
                type="button"
                className="checklist-done"
                disabled={invalid}
                onClick={() => setEditingKey(null)}
              >
                {t.done}
              </button>
            )}
          </div>
          <label
            className="checklist-content-label"
            htmlFor={`requirement-${row.key}`}
          >
            {t.content(index + 1)}
          </label>
          <textarea
            id={`requirement-${row.key}`}
            rows={2}
            value={row.content}
            disabled={!row.selected}
            aria-invalid={row.selected && Boolean(checklist.validation)}
            onChange={(event) =>
              checklist.change(row.key, { content: event.target.value })
            }
          />
          {evidenceRequirements}
          <span className={`checklist-length${lengthState}`}>
            {length} / 500
          </span>
        </div>
      </div>
    )
  }
  return (
    <div role="region" aria-label={t.title}>
      <Card
        icon={<UnorderedListOutlined />}
        className={`checklist-card${compact ? ' is-compact' : ''}`}
        title={t.title}
        actions={
          <>
            <span className="checklist-hint">
              {t.count(checklist.selectedCount, checklist.totalCount)}
            </span>
            {compact && ready && (
              <button
                type="button"
                className="checklist-add-top"
                disabled={disabled || checklist.selectedCount >= 100}
                onClick={addRow}
              >
                + {t.add}
              </button>
            )}
          </>
        }
      >
        <p className="checklist-hint">
          {compact ? t.compactHint : t.hint}
        </p>
        {ready && !compact && (
          <p className="checklist-pricing-notice">{t.pricingNotice}</p>
        )}
        {compact && ready && visibleRows.length > 0 && (
          <div
            className={`checklist-toolbar${showAdvancedToolbar ? '' : ' is-simple'}`}
          >
            {showAdvancedToolbar && (
              <label className="checklist-search-wrap">
                <Icon name="search" width={17} height={17} aria-hidden="true" />
                <input
                  type="search"
                  className="checklist-search"
                  aria-label={t.searchLabel}
                  placeholder={t.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            )}
            <div className="checklist-toolbar-selection">
              <Checkbox
                className="checklist-selectall"
                disabled={disabled}
                checked={visibleRows.every((row) => row.selected)}
                indeterminate={
                  selectedTotal > 0 && selectedTotal < visibleRows.length
                }
                onChange={(event) => {
                  for (const row of visibleRows)
                    if (row.selected !== event.target.checked)
                      checklist.change(row.key, {
                        selected: event.target.checked,
                      })
                }}
              >
                {t.selectAll(visibleRows.length)}
              </Checkbox>
            </div>
            {showAdvancedToolbar && (
              <div
                className="checklist-view"
                role="group"
                aria-label={t.viewLabel}
              >
                <button
                  type="button"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <Icon name="menu" width={14} height={14} aria-hidden="true" />
                  {t.viewList}
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'group'}
                  onClick={() => setView('group')}
                >
                  <Icon
                    name="clipboard"
                    width={14}
                    height={14}
                    aria-hidden="true"
                  />
                  {t.viewGroup}
                </button>
              </div>
            )}
          </div>
        )}
        {status === 'idle' && <p>{t.choose}</p>}
        {status === 'loading' && <p role="status">{t.loading}</p>}
        {(status === 'error' || status === 'stale') && (
          <div role="alert" className="co-notice is-danger">
            <p>{status === 'stale' ? t.stale : checklist.error}</p>
            {status === 'stale' && <p>{t.discard}</p>}
            <Button
              disabled={disabled}
              onClick={() => {
                checklist.reload()
                onReload?.()
              }}
            >
              {status === 'stale' ? t.reload : t.retry}
            </Button>
          </div>
        )}
        {ready && !visibleRows.length && <p>{t.empty}</p>}
        <fieldset disabled={disabled || !ready} className="checklist-fields">
          {ordered.map(({ row, index, heading }) => (
            <Fragment key={row.key}>
              {heading && <h3 className="checklist-group-title">{heading}</h3>}
              {renderRow(row, index)}
            </Fragment>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              className="checklist-more"
              onClick={() => setShowAll(true)}
            >
              {t.showMore(hiddenCount)}
            </button>
          )}
          {compact && showAll && visibleRows.length > COMPACT_VISIBLE && (
            <button
              type="button"
              className="checklist-more"
              onClick={() => setShowAll(false)}
            >
              {t.showLess}
            </button>
          )}
          {searching &&
            ready &&
            visibleRows.length > 0 &&
            !visibleRows.some((row) =>
              row.content.toLowerCase().includes(needle),
            ) && <p className="checklist-hint">{t.noMatch}</p>}
          {ready && !compact && (
            <button
              type="button"
              className="checklist-add"
              disabled={checklist.selectedCount >= 100}
              onClick={addRow}
            >
              + {t.add}
            </button>
          )}
        </fieldset>
        {ready && checklist.selectedCount === 0 && (
          <p className="checklist-hint">{t.none}</p>
        )}
        {ready && quote && checklist.serviceId && (
          <ChecklistQuoteCard
            quote={checklist.quote}
            showSummaryTotal={!compact}
          />
        )}
        {checklist.validation && (
          <p role="alert" className="co-notice is-danger">
            {checklist.validation}
          </p>
        )}
      </Card>
    </div>
  )
}
