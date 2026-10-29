import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import { Alert, Button, Input, Modal, Radio, Select, Tag, Typography } from 'antd'
import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  PageHeader,
  StatusTag,
  mgrPopupContainer,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { AdminLoading } from '../../components/common/AdminLoading'
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
    <div className="mgr-view checklist-page">
      <PageHeader
        title={t.template}
        description={t.templateSubtitle}
        crumb={
          <a className="checklist-back" href={adminHref({ screen: 'catalog' })}>
            <ArrowLeftOutlined aria-hidden="true" aria-label={undefined} /> {t.back}
          </a>
        }
        actions={
          <Button icon={<ProfileOutlined aria-hidden="true" aria-label={undefined} />} href={adminHref({ screen: 'checklists' })}>
            {t.catalog}
          </Button>
        }
      />
      {services.loading && <AdminLoading />}
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
          <CardComponent>
            <EmptyState title={t.noServices} />
          </CardComponent>
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
    <Button
      type="primary"
      icon={<PlusOutlined aria-hidden="true" aria-label={undefined} />}
      disabled={
        busy ||
        query.loading ||
        query.error !== undefined ||
        !serviceActive ||
        rows.length >= 100
      }
      onClick={() => setPicker(true)}
    >
      {t.add}
    </Button>
  )
  return (
    <>
      <CardComponent>
        <div className="checklist-service-select">
          <label className="checklist-field-label" htmlFor="checklist-service">
            {t.serviceLabel}
          </label>
          <Select
            id="checklist-service"
            value={serviceId}
            getPopupContainer={mgrPopupContainer}
            onChange={(value) => {
              window.location.hash = adminHref({
                screen: 'serviceChecklists',
                serviceId: value,
              })
            }}
            options={[
              ...(service ? [] : [{ value: serviceId, label: serviceId }]),
              ...services.map((row) => ({
                value: row.id,
                label: row.name + (row.isActive ? '' : ' (' + t.inactive + ')'),
              })),
            ]}
          />
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
          <StatusTag tone={serviceActive ? 'success' : 'neutral'}>
            {serviceActive ? t.active : t.inactive}
          </StatusTag>
        </div>
      </CardComponent>
      {error && (
        <Alert
          type="error"
          showIcon
          role="alert"
          message={
            error === t.stale && !query.loading && query.error === undefined
              ? t.staleReloaded
              : error
          }
        />
      )}
      <CardComponent
        title={
          <div className="checklist-card-title">
            <h2 className="mgr-card-title">{t.defaultsTitle}</h2>
            <p className="mgr-cell-sub">{t.snapshotHint}</p>
          </div>
        }
        extra={
          query.data && query.error === undefined && !query.loading && rows.length > 0
            ? add
            : undefined
        }
      >
        {query.loading && <AdminLoading />}
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
                    {!row.checklistActive && <StatusTag tone="neutral">{t.inactive}</StatusTag>}
                    {row.required && <StatusTag tone="warning">{t.requiredBadge}</StatusTag>}
                    {(row.usedByServiceCount ?? 0) > 1 && (
                      <StatusTag tone="info">{t.sharedBadge(row.usedByServiceCount ?? 0)}</StatusTag>
                    )}
                    <PricingChips row={row} />
                  </div>
                  <div className="checklist-actions">
                    <Button disabled={busy} onClick={() => setPricing(row)}>
                      {t.configure}
                    </Button>
                    <ChecklistIconButton
                      icon={<ArrowUpOutlined aria-hidden="true" aria-label={undefined} />}
                      label={t.up + ': ' + row.content}
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                    />
                    <ChecklistIconButton
                      icon={<ArrowDownOutlined aria-hidden="true" aria-label={undefined} />}
                      label={t.down + ': ' + row.content}
                      disabled={busy || index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined aria-hidden="true" aria-label={undefined} />}
                      aria-label={t.remove + ': ' + row.content}
                      title={t.remove}
                      disabled={busy}
                      onClick={() => setRemoving(row)}
                    >
                      {t.remove}
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          ))}
      </CardComponent>
      <ServicePricePreviewCard
        serviceId={serviceId}
        refreshKey={priceRevision}
      />
      <Typography.Paragraph type="secondary" className="checklist-banner">
        {t.future}
      </Typography.Paragraph>
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
          open
          centered
          getContainer={mgrPopupContainer}
          title={t.removeTitle}
          onCancel={() => {
            if (!busy) setRemoving(null)
          }}
          footer={
            <>
              <Button disabled={busy} onClick={() => setRemoving(null)}>
                {t.cancel}
              </Button>
              <Button
                type="primary"
                danger
                loading={busy}
                onClick={() =>
                  void act(() => checklistsApi.remove(serviceId, removing.checklistId))
                }
              >
                {busy ? t.saving : t.remove}
              </Button>
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
    <Tag
      bordered={false}
      color={override ? 'processing' : undefined}
      title={override ? t.overrideValue : t.inheritedValue}
    >
      {text}
      {override ? ' *' : ''}
    </Tag>
  )
  return (
    <div className="checklist-actions checklist-actions-start">
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
      open
      centered
      getContainer={mgrPopupContainer}
      title={t.pick}
      width={620}
      onCancel={() => {
        if (!busy) close()
      }}
      footer={
        <>
          <Button disabled={busy} onClick={close}>
            {t.cancel}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden="true" aria-label={undefined} />}
            loading={busy}
            disabled={
              !selected ||
              query.loading ||
              query.error !== undefined ||
              !candidates.some((row) => row.id === selected)
            }
            onClick={() => void assign()}
          >
            {busy ? t.saving : t.add}
          </Button>
        </>
      }
    >
      <p className="mgr-modal-sub">{t.snapshotHint}</p>
      <div className="checklist-dialog">
        <Input.Search
          aria-label={t.search}
          placeholder={t.search}
          allowClear
          value={search}
          disabled={busy}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
            setSelected(null)
          }}
        />
        {error && <Alert type="error" showIcon role="alert" message={error} />}
        {query.loading && <AdminLoading />}
        {query.error !== undefined && (
          <ChecklistLoadError title={t.catalogLoadError} error={query.error} retry={query.reload} />
        )}
        {!query.loading && query.error === undefined && query.data && (
          <>
            {candidates.length > 0 ? (
              <Radio.Group
                className="checklist-candidates"
                value={selected}
                disabled={busy}
                onChange={(event) => setSelected(event.target.value as string)}
              >
                {candidates.map((row) => (
                  <Radio key={row.id} value={row.id} className="checklist-candidate">
                    {row.content}
                  </Radio>
                ))}
              </Radio.Group>
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
