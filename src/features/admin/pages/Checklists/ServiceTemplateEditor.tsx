import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Skeleton, Typography } from 'antd'
import { useState } from 'react'

import { CardComponent, EmptyState } from '../../../../shared/components/antd'
import { displayLocalized, useI18n } from '../../../../shared/i18n'
import type { ServiceResponse } from '../../api/catalogApi'
import { checklistsApi, type ServiceChecklist } from '../../api/checklistsApi'
import { ChecklistConfigModal } from './ChecklistConfigModal'
import { ChecklistPicker } from './ChecklistPicker'
import { ChecklistLoadError } from './ChecklistUi'
import { checklistMessages } from './checklists.messages'
import { RemoveChecklistModal } from './RemoveChecklistModal'
import { ServiceChecklistList } from './ServiceChecklistList'
import { ServicePricePreviewCard } from './ServicePricePreviewCard'
import { ServiceTemplateHeader } from './ServiceTemplateHeader'
import { useServiceTemplate } from './useServiceTemplate'

export function ServiceTemplateEditor({
  serviceId,
  services,
}: {
  serviceId: string
  services: ServiceResponse[]
}) {
  const { t } = useI18n(checklistMessages)
  const service = services.find((row) => row.id === serviceId)
  const serviceActive = service?.isActive === true
  const {
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
  } = useServiceTemplate(serviceId)
  const [picker, setPicker] = useState(false)
  const [pricing, setPricing] = useState<ServiceChecklist | null>(null)
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
      <ServiceTemplateHeader
        serviceId={serviceId}
        services={services}
        count={query.loading || query.error !== undefined ? null : rows.length}
      />
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
            name: service ? displayLocalized(service.name) : serviceId,
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
