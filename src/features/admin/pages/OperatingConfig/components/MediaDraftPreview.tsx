import { Alert, Button, Card, InputNumber, Select } from 'antd'
import { useId, useState } from 'react'

import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { displayLocalized, useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { checklistsApi } from '../../../api/checklistsApi'
import { AdminPriceBreakdown } from '../../../components/common/AdminPriceBreakdown'
import { mediaPricingEditorMessages } from './MediaPricingEditor.messages'
import { PricingField } from './PricingInputs'

type Quantities = {
  images: number
  videos: number
  areaHa: number
  lengthKm: number
  altitudeM: number
}

const ZERO: Quantities = {
  images: 0,
  videos: 0,
  areaHa: 0,
  lengthKm: 0,
  altitudeM: 0,
}

/** Prices a sample order with the saved draft (nothing is stored) to check a price list before publishing. */
export function MediaDraftPreview({ draftId }: { draftId: string }) {
  const { t } = useI18n(mediaPricingEditorMessages)
  const uid = useId()
  const services = useApiQuery((signal) => catalogApi.listServices(signal), [])
  const checklists = useApiQuery(
    (signal) => checklistsApi.list('', true, 0, signal, 200),
    [],
  )
  const [serviceId, setServiceId] = useState('')
  const [checklistId, setChecklistId] = useState('')
  const [qty, setQty] = useState<Quantities>(ZERO)
  const [preview, setPreview] = useState<ServicePricePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selected = serviceId || services.data?.[0]?.id || ''

  async function run() {
    if (!selected) return
    setError(null)
    try {
      setPreview(
        await checklistPricingApi.adminPreview({
          serviceId: selected,
          policyId: draftId,
          items: checklistId
            ? [
                {
                  checklistId,
                  requestedImageCount: qty.images,
                  requestedVideoCount: qty.videos,
                },
              ]
            : undefined,
          areaHa: qty.areaHa,
          lengthKm: qty.lengthKm,
          altitudeM: qty.altitudeM,
        }),
      )
    } catch {
      setPreview(null)
      setError(t.previewError)
    }
  }

  const number = (key: keyof Quantities, label: string, max?: number) => (
    <PricingField id={`${uid}-${key}`} label={label}>
      <InputNumber<number>
        id={`${uid}-${key}`}
        className="adm-input-full"
        min={0}
        max={max}
        value={qty[key]}
        onChange={(value) => setQty({ ...qty, [key]: value ?? 0 })}
      />
    </PricingField>
  )

  return (
    <Card
      size="small"
      className="pricing-draft-preview"
      role="region"
      aria-label={t.previewTitle}
      title={t.previewTitle}
    >
      <p>{t.previewHint}</p>
      <div className="pricing-field-grid">
        <PricingField id={`${uid}-service`} label={t.previewService}>
          <Select
            id={`${uid}-service`}
            value={selected}
            onChange={setServiceId}
            options={(services.data ?? []).map((service) => ({
              value: service.id,
              label: displayLocalized(service.name),
            }))}
          />
        </PricingField>
        <PricingField id={`${uid}-checklist`} label={t.previewChecklist}>
          <Select
            id={`${uid}-checklist`}
            value={checklistId}
            onChange={setChecklistId}
            options={[
              { value: '', label: '—' },
              ...(checklists.data?.items ?? []).map((checklist) => ({
                value: checklist.id,
                label: displayLocalized(checklist.content),
              })),
            ]}
          />
        </PricingField>
        {number('images', t.requestedImages, 500)}
        {number('videos', t.requestedVideos, 500)}
        {number('areaHa', t.area)}
        {number('lengthKm', t.length)}
        {number('altitudeM', t.altitude)}
      </div>
      <Button htmlType="button" onClick={() => void run()}>
        {t.previewButton}
      </Button>
      {error && <Alert type="error" showIcon role="alert" message={error} />}
      {preview && <AdminPriceBreakdown preview={preview} />}
    </Card>
  )
}
