import { Alert, Button, Checkbox, Form, Input, InputNumber } from 'antd'
import { useEffect, useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { AdminField } from '../../../components/common/AdminField'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { AdminModal } from '../../../components/common/AdminModal'
import {
  emptyServiceForm,
  mapService,
  readApiError,
  serviceToForm,
  toServiceRequest,
} from '../../../lib/catalogMappers'
import type { AdminService } from '../../../types/catalog'
import { EditLoader } from './EditLoader'
import { serviceModalMessages } from './ServiceModal.messages'
import { PriceBreakdownView } from '../../../../../shared/components/odm/PriceBreakdownView'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import { adminHref } from '../../../routes'

type Props = {
  /** Existing service (edit) or undefined (create). */
  service?: AdminService
  onClose: () => void
  onSaved: () => void
}

function ServiceForm({ service, onClose, onSaved }: Props) {
  const { t } = useI18n(serviceModalMessages)
  const [values, setValues] = useState(
    service ? serviceToForm(service) : emptyServiceForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState(service?.id)
  const [image, setImage] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [priceCheck, setPriceCheck] = useState<ServicePricePreview | null>(null)
  const [priceCheckError, setPriceCheckError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(
    service?.imageUrl ?? null,
  )

  useEffect(() => {
    if (!image) {
      setPreview(removeImage ? null : (service?.imageUrl ?? null))
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image, removeImage, service?.imageUrl])

  /** The stored default checklists priced by the active policy; nothing is saved. */
  async function checkPrice() {
    if (!service?.id) return
    setPriceCheckError(null)
    try {
      setPriceCheck(
        await checklistPricingApi.adminPreview({
          serviceId: service.id,
        }),
      )
    } catch {
      setPriceCheck(null)
      setPriceCheckError(t.previewError)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (
      !values.name.trim() ||
      !Number.isSafeInteger(values.basePrice) ||
      values.basePrice <= 0
    ) {
      setErrors({
        ...(!values.name.trim() ? { name: t.required } : {}),
        ...(!Number.isSafeInteger(values.basePrice) || values.basePrice <= 0
          ? { basePrice: t.invalidPrice }
          : {}),
      })
      return
    }
    setBusy(true)
    setSubmitError(null)
    setErrors({})
    let detailsSaved = false
    try {
      const body = toServiceRequest(values)
      const saved = savedId
        ? await catalogApi.updateService(savedId, body)
        : await catalogApi.createService(body)
      setSavedId(saved.id)
      detailsSaved = true
      if (image) await catalogApi.uploadServiceImage(saved.id, image)
      else if (removeImage) await catalogApi.removeServiceImage(saved.id)
      onSaved()
    } catch (err) {
      const { message, fields } = readApiError(err, t.genericError)
      setErrors(fields)
      setSubmitError(detailsSaved ? `${t.imageError} ${message}` : message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminModal
      width={560}
      title={service ? t.editTitle : t.createTitle}
      subtitle={service ? t.editSubtitle : t.createSubtitle}
      onClose={onClose}
      footer={
        <AdminFormFooter
          formId="adm-service-form"
          busy={busy}
          onClose={onClose}
        />
      }
    >
      <Form
        id="adm-service-form"
        layout="vertical"
        onSubmitCapture={handleSubmit}
        noValidate
      >
        <AdminField
          id="adm-svc-name"
          label={t.name}
          required
          error={errors.name}
        >
          <Input
            id="adm-svc-name"
            value={values.name}
            placeholder={t.namePlaceholder}
            aria-invalid={!!errors.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </AdminField>
        <AdminField
          id="adm-svc-price"
          label={t.basePrice}
          required
          error={errors.basePrice}
        >
          <InputNumber<number>
            id="adm-svc-price"
            className="adm-input-full"
            min={1}
            step={1000}
            value={values.basePrice}
            aria-invalid={!!errors.basePrice}
            onChange={(value) =>
              setValues({ ...values, basePrice: Number(value ?? 0) })
            }
          />
          <small className="adm-check-hint">{t.basePriceHint}</small>
        </AdminField>
        <section
          aria-label={t.previewTitle}
          className="adm-service-price-check"
        >
          <strong>{t.previewTitle}</strong>
          {service?.id ? (
            <>
              <div className="adm-row">
                <Button
                  size="small"
                  disabled={busy}
                  onClick={() => void checkPrice()}
                >
                  {t.previewButton}
                </Button>
                <Button
                  size="small"
                  type="link"
                  href={adminHref({
                    screen: 'serviceChecklists',
                    serviceId: service.id,
                  })}
                >
                  {t.manageChecklists}
                </Button>
              </div>
              {priceCheckError && (
                <Alert
                  type="error"
                  showIcon
                  role="alert"
                  message={priceCheckError}
                />
              )}
              {priceCheck && <PriceBreakdownView preview={priceCheck} />}
            </>
          ) : (
            <small className="adm-check-hint">{t.previewSaveFirst}</small>
          )}
        </section>
        <AdminField
          id="adm-svc-desc"
          label={t.description}
          error={errors.description}
        >
          <Input.TextArea
            id="adm-svc-desc"
            rows={4}
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
          />
        </AdminField>
        <AdminField id="adm-svc-image" label={t.image} error={errors.image}>
          <div className="adm-service-image">
            {preview && <img src={preview} alt={t.image} />}
            <input
              id="adm-svc-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                if (
                  !['image/jpeg', 'image/png', 'image/webp'].includes(
                    file.type,
                  ) ||
                  file.size === 0 ||
                  file.size > 5 * 1024 * 1024
                ) {
                  setErrors((current) => ({
                    ...current,
                    image: t.invalidImage,
                  }))
                  event.target.value = ''
                  return
                }
                setErrors((current) => ({ ...current, image: '' }))
                setImage(file)
                setRemoveImage(false)
              }}
            />
            <small className="adm-check-hint">{t.imageHint}</small>
            {(preview || image) && (
              <Button
                size="small"
                disabled={busy}
                onClick={() => {
                  setImage(null)
                  setRemoveImage(true)
                  setErrors((current) => ({ ...current, image: '' }))
                }}
              >
                {t.removeImage}
              </Button>
            )}
          </div>
        </AdminField>
        <Checkbox
          checked={values.isActive}
          onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
        >
          {t.isActive}
          <small className="adm-check-hint">{t.isActiveHint}</small>
        </Checkbox>
        {submitError && (
          <Alert
            type="error"
            showIcon
            message={submitError}
            className="adm-alert"
          />
        )}
      </Form>
    </AdminModal>
  )
}

export function ServiceModal({ service, onClose, onSaved }: Props) {
  const { t } = useI18n(serviceModalMessages)
  return (
    <EditLoader
      title={t.editTitle}
      onClose={onClose}
      load={
        service
          ? (signal) =>
              catalogApi.getService(service.id, signal).then(mapService)
          : undefined
      }
    >
      {(fresh) => (
        <ServiceForm
          service={fresh ?? service}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </EditLoader>
  )
}
