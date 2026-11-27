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
import {
  checklistsApi,
  type MissionTemplate,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { ServicePricePreviewCard } from './ServicePricePreviewCard'
import { ChecklistConfigModal } from './ChecklistConfigModal'
import { ChecklistPicker } from './ChecklistPicker'
import './serviceChecklistRows.css'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { ChecklistIconButton, ChecklistLoadError } from './ChecklistUi'

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
            <ol className="checklist-list service-checklist-list">
              {rows.map((row, index) => (
                <li key={row.id} className="checklist-row">
                  <span className="checklist-order" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="checklist-row-content">
                    <div className="service-checklist-name">{row.content}</div>
                    <div className="service-checklist-meta">
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
                  </div>
                  <div className="checklist-actions service-checklist-actions">
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh service-checklist-configure"
                      disabled={busy}
                      onClick={() => setPricing(row)}
                    >
                      <Icon
                        name="edit"
                        width={14}
                        height={14}
                        aria-hidden="true"
                      />
                      {t.configure}
                    </button>
                    <div className="service-checklist-reorder">
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
                    </div>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh checklist-danger service-checklist-remove"
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
      <MissionTemplatesPanel serviceId={serviceId} rows={rows} />
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
          changed={() => {
            setPriceRevision((value) => value + 1)
            query.reload()
          }}
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

function MissionTemplatesPanel({
  serviceId,
  rows,
}: {
  serviceId: string
  rows: ServiceChecklist[]
}) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.missionTemplates(serviceId, signal),
    [serviceId],
  )
  const [editing, setEditing] = useState<MissionTemplate | 'new' | null>(null)
  const [removing, setRemoving] = useState<MissionTemplate | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const templates = query.data ?? []
  const editingTemplateId =
    editing && editing !== 'new' ? editing.id : undefined
  const unavailableChecklistIds = new Set(
    templates
      .filter((template) => template.id !== editingTemplateId)
      .flatMap((template) => template.checklistIds),
  )

  async function remove() {
    if (!removing || busy) return
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.removeMissionTemplate(serviceId, removing.id)
      setRemoving(null)
      query.reload()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card flush>
      <div className="checklist-section-head">
        <div>
          <h2>{t.missionTemplatesTitle}</h2>
          <p>{t.missionTemplatesHint}</p>
        </div>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          disabled={query.loading || query.error !== undefined}
          onClick={() => setEditing('new')}
        >
          <Icon name="plus" width={16} height={16} aria-hidden="true" />
          {t.missionTemplateAdd}
        </button>
      </div>
      {query.loading && <LoadingState />}
      {query.error !== undefined && (
        <ChecklistLoadError
          title={t.missionTemplatesLoadError}
          error={query.error}
          retry={query.reload}
        />
      )}
      {!query.loading &&
        query.error === undefined &&
        templates.length === 0 && (
          <EmptyState title={t.missionTemplatesEmpty} />
        )}
      {!query.loading && query.error === undefined && templates.length > 0 && (
        <ul className="mission-template-list">
          {templates.map((template) => {
            const selected = new Set(template.checklistIds)
            const labels = rows
              .filter((row) => selected.has(row.checklistId))
              .map((row) => row.content)
            const unresolved = template.checklistIds.filter(
              (id) => !rows.some((row) => row.checklistId === id),
            )
            return (
              <li key={template.id}>
                <div>
                  <strong>{template.scopeLabel}</strong>
                  <p>
                    {[...labels, ...unresolved].join(', ') ||
                      t.missionTemplateNoChecklist}
                  </p>
                </div>
                <div className="checklist-actions">
                  <button
                    type="button"
                    className="odm-btn odm-btn-gh"
                    onClick={() => setEditing(template)}
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    className="odm-btn odm-btn-gh checklist-danger"
                    onClick={() => setRemoving(template)}
                  >
                    {t.removeMissionTemplate}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {editing && (
        <MissionTemplateModal
          serviceId={serviceId}
          template={editing === 'new' ? undefined : editing}
          rows={rows}
          unavailableChecklistIds={unavailableChecklistIds}
          close={() => setEditing(null)}
          saved={() => {
            setEditing(null)
            query.reload()
          }}
        />
      )}
      {removing && (
        <Modal
          title={t.removeMissionTemplate}
          icon="trash"
          tone="danger"
          onClose={() => !busy && setRemoving(null)}
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
                onClick={() => void remove()}
              >
                {busy ? t.saving : t.removeMissionTemplate}
              </button>
            </>
          }
        >
          <p>{t.removeMissionTemplateConfirm}</p>
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </Card>
  )
}

function MissionTemplateModal({
  serviceId,
  template,
  rows,
  unavailableChecklistIds,
  close,
  saved,
}: {
  serviceId: string
  template?: MissionTemplate
  rows: ServiceChecklist[]
  unavailableChecklistIds: ReadonlySet<string>
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [selected, setSelected] = useState(
    () => new Set(template?.checklistIds ?? []),
  )
  const [scopeLabel, setScopeLabel] = useState(template?.scopeLabel ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(checklistId: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(checklistId)) next.delete(checklistId)
      else next.add(checklistId)
      return next
    })
  }

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(null)
    const checklistIds = rows
      .filter((row) => selected.has(row.checklistId))
      .map((row) => row.checklistId)
    try {
      if (template) {
        await checklistsApi.updateMissionTemplate(
          serviceId,
          template.id,
          scopeLabel.trim(),
          checklistIds,
        )
      } else {
        await checklistsApi.createMissionTemplate(
          serviceId,
          scopeLabel.trim(),
          checklistIds,
        )
      }
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
      setBusy(false)
    }
  }

  return (
    <Modal
      title={template ? t.editMissionTemplate : t.missionTemplateAdd}
      icon="clipboard"
      onClose={() => !busy && close()}
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
            disabled={busy || !scopeLabel.trim()}
            onClick={() => void submit()}
          >
            {busy ? t.saving : t.save}
          </button>
        </>
      }
    >
      <div className="checklist-dialog">
        <label className="checklist-field">
          <span className="ui-label">{t.missionTemplateScopeLabel}</span>
          <input
            className="odm-inp"
            value={scopeLabel}
            maxLength={255}
            disabled={busy}
            placeholder={t.missionTemplateScopePlaceholder}
            aria-label={t.missionTemplateScopeLabel}
            onChange={(event) => setScopeLabel(event.target.value)}
          />
        </label>
        <p>{t.missionTemplateSelectHint}</p>
        {rows.length === 0 ? (
          <EmptyState title={t.emptyTemplate} />
        ) : (
          <ul className="mission-template-options">
            {rows.map((row) => {
              const unavailable = unavailableChecklistIds.has(row.checklistId)
              return (
                <li key={row.checklistId}>
                  <label className={unavailable ? 'is-unavailable' : undefined}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.checklistId)}
                      disabled={busy || unavailable}
                      onChange={() => toggle(row.checklistId)}
                    />
                    <span>{row.content}</span>
                    {unavailable && (
                      <small>{t.missionTemplateChecklistUsed}</small>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        {error && (
          <p className="checklist-banner is-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

/** Evidence allowances remain service-scoped; the Base Checklist price is shared globally. */
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
    <div className="service-checklist-media">
      {chip(
        `${row.includedImageCount ?? 0} ${t.imagesShort}`,
        row.includedImageCountOverride != null,
      )}
      {chip(
        `${row.includedVideoCount ?? 0} ${t.videosShort}`,
        row.includedVideoCountOverride != null,
      )}
    </div>
  )
}
