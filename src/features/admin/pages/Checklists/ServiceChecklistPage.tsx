import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { Icon } from '../../../../shared/components/Icon'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import {
  Modal,
  PageHeader,
  Card,
  StatusBadge,
  EmptyState,
} from '../../../../shared/components/ui'
import { catalogApi, type ServiceResponse } from '../../api/catalogApi'
import { checklistsApi, type ServiceChecklist } from '../../api/checklistsApi'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { adminHref } from '../../routes'
import { ServicePricePreviewCard } from './ServicePricePreviewCard'
import { ChecklistConfigModal } from './ChecklistConfigModal'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import {
  ChecklistIconButton,
  ChecklistPagination,
  ChecklistLoadError,
} from './ChecklistUi'

export function ServiceChecklistPage({ serviceId }: { serviceId?: string }) {
  const { t } = useI18n(checklistMessages)
  const services = useApiQuery((signal) => catalogApi.listServices(signal), [])
  const selected = serviceId ?? services.data?.[0]?.id
  return (
    <div className="checklist-page">
      <PageHeader
        title={t.template}
        subtitle={t.templateSubtitle}
        back={
          <a className="checklist-back" href={adminHref({ screen: 'catalog' })}>
            <Icon name="arrow-left" width={16} height={16} aria-hidden="true" />
            {t.back}
          </a>
        }
        actions={
          <a className="odm-btn" href={adminHref({ screen: 'checklists' })}>
            <Icon name="clipboard" width={16} height={16} aria-hidden="true" />
            {t.catalog}
          </a>
        }
      />
      {services.loading && <LoadingState />}
      {services.error !== undefined && (
        <ChecklistLoadError
          title={t.loadError}
          error={services.error}
          retry={services.reload}
        />
      )}
      {!services.loading &&
        services.error === undefined &&
        services.data &&
        (selected ? (
          <ServiceTemplateEditor
            key={selected}
            serviceId={selected}
            services={services.data}
          />
        ) : (
          <Card>
            <EmptyState title={t.noServices} />
          </Card>
        ))}
    </div>
  )
}

function ServiceTemplateEditor({
  serviceId,
  services,
}: {
  serviceId: string
  services: ServiceResponse[]
}) {
  const { t, lang } = useI18n(checklistMessages)
  const service = services.find((row) => row.id === serviceId)
  const serviceActive = service?.isActive === true
  const query = useApiQuery(
    (signal) => checklistsApi.template(serviceId, signal),
    [serviceId],
  )
  const [picker, setPicker] = useState(false)
  const [removing, setRemoving] = useState<ServiceChecklist | null>(null)
  const [pricing, setPricing] = useState<ServiceChecklist | null>(null)
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
  const add = (
    <button
      type="button"
      className="odm-btn odm-btn-p"
      disabled={
        busy ||
        query.loading ||
        query.error !== undefined ||
        !serviceActive ||
        rows.length >= 100
      }
      onClick={() => setPicker(true)}
    >
      <Icon name="plus" width={16} height={16} aria-hidden="true" />
      {t.add}
    </button>
  )
  return (
    <>
      <Card>
        <div className="checklist-service-select">
          <label className="ui-label" htmlFor="checklist-service">
            {t.serviceLabel}
          </label>
          <select
            id="checklist-service"
            className="odm-inp"
            value={serviceId}
            onChange={(event) => {
              window.location.hash = adminHref({
                screen: 'serviceChecklists',
                serviceId: event.target.value,
              })
            }}
          >
            {!service && <option value={serviceId}>{serviceId}</option>}
            {services.map((row) => (
              <option value={row.id} key={row.id}>
                {row.name}
                {row.isActive ? '' : ' (' + t.inactive + ')'}
              </option>
            ))}
          </select>
        </div>
        <div className="checklist-summary">
          <div>
            <h2>{service?.name ?? serviceId}</h2>
            <p className="checklist-metadata">
              {query.loading || query.error !== undefined ? '—' : rows.length}{' '}
              {t.checklistCount}
              {service?.updatedAt
                ? ' · ' +
                  t.updated +
                  ': ' +
                  new Date(service.updatedAt).toLocaleString(
                    lang === 'vi' ? 'vi-VN' : 'en-US',
                  )
                : ''}
            </p>
          </div>
          <StatusBadge tone={serviceActive ? 'success' : 'neutral'}>
            {serviceActive ? t.active : t.inactive}
          </StatusBadge>
        </div>
      </Card>
      {error && (
        <div className="checklist-banner is-error" role="alert">
          {error === t.stale && !query.loading && query.error === undefined
            ? t.staleReloaded
            : error}
        </div>
      )}
      <Card flush>
        <div className="checklist-section-head">
          <div>
            <h2>{t.defaultsTitle}</h2>
            <p>{t.snapshotHint}</p>
          </div>
          {query.data &&
            query.error === undefined &&
            !query.loading &&
            rows.length > 0 &&
            add}
        </div>
        {query.loading && <LoadingState />}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.loadError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {!query.loading &&
          query.error === undefined &&
          query.data &&
          (rows.length === 0 ? (
            <EmptyState
              title={t.emptyTemplate}
              description={t.emptyDescription}
              action={add}
            />
          ) : (
            <ol className="checklist-list">
              {rows.map((row, index) => (
                <li key={row.id} className="checklist-row">
                  <span className="checklist-order" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="checklist-row-content">
                    <div>{row.content}</div>
                    {!row.checklistActive && (
                      <StatusBadge tone="neutral">{t.inactive}</StatusBadge>
                    )}
                    {row.required && (
                      <StatusBadge tone="warning">
                        {t.requiredBadge}
                      </StatusBadge>
                    )}
                    {(row.usedByServiceCount ?? 0) > 1 && (
                      <StatusBadge tone="info">
                        {t.sharedBadge(row.usedByServiceCount ?? 0)}
                      </StatusBadge>
                    )}
                    <PricingChips row={row} />
                  </div>
                  <div className="checklist-actions">
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh"
                      disabled={busy}
                      onClick={() => setPricing(row)}
                    >
                      {t.configure}
                    </button>
                    <ChecklistIconButton
                      icon="arrow-up"
                      label={t.up + ': ' + row.content}
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                    />
                    <ChecklistIconButton
                      icon="arrow-down"
                      label={t.down + ': ' + row.content}
                      disabled={busy || index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    />
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh checklist-danger"
                      aria-label={t.remove + ': ' + row.content}
                      title={t.remove}
                      disabled={busy}
                      onClick={() => setRemoving(row)}
                    >
                      <Icon
                        name="trash"
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                      {t.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ))}
      </Card>
      <ServicePricePreviewCard
        serviceId={serviceId}
        refreshKey={priceRevision}
      />
      <p className="checklist-banner">{t.future}</p>
      {pricing && (
        <ChecklistConfigModal
          key={pricing.id}
          service={{
            id: serviceId,
            name: service?.name ?? serviceId,
            rows,
            row: pricing,
          }}
          close={() => setPricing(null)}
          saved={() => {
            setPricing(null)
            setPriceRevision((value) => value + 1)
            query.reload()
          }}
        />
      )}
      {picker && (
        <ChecklistPicker
          serviceId={serviceId}
          rows={rows}
          close={() => setPicker(false)}
          saved={() => {
            setPicker(false)
            setPriceRevision((value) => value + 1)
            query.reload()
          }}
        />
      )}
      {removing && (
        <Modal
          title={t.removeTitle}
          icon="trash"
          tone="danger"
          onClose={() => {
            if (!busy) setRemoving(null)
          }}
          footer={
            <>
              <button
                type="button"
                className="odm-btn odm-btn-gh"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-rd"
                disabled={busy}
                onClick={() =>
                  void act(() =>
                    checklistsApi.remove(serviceId, removing.checklistId),
                  )
                }
              >
                {busy ? t.saving : t.remove}
              </button>
            </>
          }
        >
          <div className="checklist-dialog">
            <p>{t.removeConfirm}</p>
            <div className="checklist-danger-summary">{removing.content}</div>
            {error && <p role="alert">{error}</p>}
          </div>
        </Modal>
      )}
    </>
  )
}

/** Effective price and allowance of a row; marks which values are service overrides. */
function PricingChips({ row }: { row: ServiceChecklist }) {
  const { t } = useI18n(checklistMessages)
  const chip = (text: string, override: boolean) => (
    <span
      className={'checklist-pricing-chip' + (override ? ' is-override' : '')}
      title={override ? t.overrideValue : t.inheritedValue}
    >
      {text}
      {override ? ' *' : ''}
    </span>
  )
  return (
    <div className="checklist-actions" style={{ justifyContent: 'flex-start' }}>
      {chip(formatVnd(row.basePrice ?? 0), row.basePriceOverride != null)}
      {chip(
        `${row.includedImageCount ?? 0} ${t.imagesShort}`,
        row.includedImageCountOverride != null,
      )}
      {chip(
        `${row.includedVideoCount ?? 0} ${t.videosShort}`,
        row.includedVideoCountOverride != null,
      )}
      {chip(
        row.pricingProfile ?? 'DEFAULT',
        row.pricingProfileOverride != null,
      )}
    </div>
  )
}

function ChecklistPicker({
  serviceId,
  rows,
  close,
  saved,
}: {
  serviceId: string
  rows: ServiceChecklist[]
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const query = useApiQuery(
    (signal) => checklistsApi.list(search, true, page, signal),
    [search, page],
  )
  const assigned = new Set(rows.map((row) => row.checklistId))
  const candidates =
    query.data?.items.filter((row) => row.isActive && !assigned.has(row.id)) ??
    []
  async function assign() {
    if (
      busy ||
      !selected ||
      query.loading ||
      query.error !== undefined ||
      !candidates.some((row) => row.id === selected)
    )
      return
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.assign(serviceId, selected, rows.length)
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
      query.reload()
    } finally {
      setBusy(false)
    }
  }
  function changePage(next: number) {
    setPage(next)
    setSelected(null)
  }
  return (
    <Modal
      title={t.pick}
      subtitle={t.snapshotHint}
      icon="clipboard"
      width={620}
      onClose={() => {
        if (!busy) close()
      }}
      footer={
        <>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            disabled={busy}
            onClick={close}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={
              busy ||
              !selected ||
              query.loading ||
              query.error !== undefined ||
              !candidates.some((row) => row.id === selected)
            }
            onClick={() => void assign()}
          >
            <Icon name="plus" width={16} height={16} aria-hidden="true" />
            {busy ? t.saving : t.add}
          </button>
        </>
      }
    >
      <div className="checklist-dialog">
        <div className="checklist-search">
          <Icon name="search" width={16} height={16} aria-hidden="true" />
          <input
            className="odm-inp"
            aria-label={t.search}
            placeholder={t.search}
            type="search"
            value={search}
            disabled={busy}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
              setSelected(null)
            }}
          />
        </div>
        {error && (
          <p className="checklist-banner is-error" role="alert">
            {error}
          </p>
        )}
        {query.loading && <LoadingState />}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.catalogLoadError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {!query.loading && query.error === undefined && query.data && (
          <>
            {candidates.length > 0 ? (
              <ul className="checklist-candidates">
                {candidates.map((row) => (
                  <li key={row.id}>
                    <label className="checklist-candidate">
                      <input
                        type="radio"
                        name="checklist-candidate"
                        checked={selected === row.id}
                        disabled={busy}
                        onChange={() => setSelected(row.id)}
                      />
                      <span>{row.content}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t.noCandidates} />
            )}
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              busy={busy}
              change={changePage}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
