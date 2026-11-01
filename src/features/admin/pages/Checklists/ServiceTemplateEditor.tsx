import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Select, Skeleton, Tag, Typography } from 'antd'
import { useState } from 'react'

import { CardComponent, EmptyState } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import type { ServiceResponse } from '../../api/catalogApi'
import { checklistsApi, type ServiceChecklist } from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { ChecklistConfigModal } from './ChecklistConfigModal'
import { ChecklistPicker } from './ChecklistPicker'
import { ChecklistLoadError } from './ChecklistUi'
import { checklistError } from './checklistError'
import { checklistMessages } from './checklists.messages'
import { RemoveChecklistModal } from './RemoveChecklistModal'
import { ServiceChecklistList } from './ServiceChecklistList'
import { ServicePricePreviewCard } from './ServicePricePreviewCard'

export function ServiceTemplateEditor({
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
  const refresh = () => {
    setPriceRevision((value) => value + 1)
    query.reload()
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
  const ready = query.data && query.error === undefined && !query.loading
  return (
    <>
      <CardComponent>
        <div className="checklist-service-select">
          <label htmlFor="checklist-service">{t.serviceLabel}</label>
          <Select
            id="checklist-service"
            value={serviceId}
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
          <Tag bordered={false} color={serviceActive ? 'success' : 'default'}>
            {serviceActive ? t.active : t.inactive}
          </Tag>
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
      <CardComponent styles={{ body: { padding: 0 } }}>
        <div className="checklist-section-head">
          <div>
            <h2>{t.defaultsTitle}</h2>
            <p>{t.snapshotHint}</p>
          </div>
          {ready && rows.length > 0 && add}
        </div>
        {query.loading && (
          <Skeleton active aria-busy="true" className="adm-card-pad" />
        )}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.loadError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {ready &&
          (rows.length === 0 ? (
            <EmptyState
              title={t.emptyTemplate}
              description={t.emptyDescription}
              action={add}
            />
          ) : (
            <ServiceChecklistList
              rows={rows}
              busy={busy}
              onConfigure={setPricing}
              onMove={move}
              onRemove={setRemoving}
            />
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
            refresh()
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
            refresh()
          }}
        />
      )}
      {removing && (
        <RemoveChecklistModal
          row={removing}
          busy={busy}
          error={error}
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            void act(() =>
              checklistsApi.remove(serviceId, removing.checklistId),
            )
          }
        />
      )}
    </>
  )
}
