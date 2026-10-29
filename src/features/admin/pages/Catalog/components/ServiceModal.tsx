import { Alert, Button, Checkbox, Form, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'

import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { onFormSubmit } from '../../../components/common/formSubmit'
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

  async function handleSubmit() {
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

  const status = (key: string) => (errors[key] ? 'error' : undefined)

  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={560}
      title={service ? t.editTitle : t.createTitle}
      onCancel={onClose}
      footer={<AdminFormFooter formId="adm-service-form" busy={busy} onClose={onClose} />}
    >
      <p className="mgr-modal-sub">{service ? t.editSubtitle : t.createSubtitle}</p>
      <Form
        id="adm-service-form"
        layout="vertical"
        onSubmitCapture={onFormSubmit(handleSubmit)}
        noValidate
      >
        <Form.Item label={t.name} required htmlFor="adm-svc-name" validateStatus={status('name')} help={errors.name}>
          <Input
            id="adm-svc-name"
            value={values.name}
            placeholder={t.namePlaceholder}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </Form.Item>
        <Form.Item
          label={t.basePrice}
          required
          htmlFor="adm-svc-price"
          validateStatus={status('basePrice')}
          help={errors.basePrice}
          extra={t.basePriceHint}
        >
          <Input
            id="adm-svc-price"
            type="number"
            min={1}
            step={1000}
            inputMode="numeric"
            value={values.basePrice}
            onChange={(e) => setValues({ ...values, basePrice: Number(e.target.value) })}
          />
        </Form.Item>
        <section aria-label={t.previewTitle} className="adm-service-price-check">
          <strong>{t.previewTitle}</strong>
          {service?.id ? (
            <>
              <div className="adm-row">
                <Button size="small" disabled={busy} onClick={() => void checkPrice()}>
                  {t.previewButton}
                </Button>
                <Button
                  size="small"
                  type="link"
                  href={adminHref({ screen: 'serviceChecklists', serviceId: service.id })}
                >
                  {t.manageChecklists}
                </Button>
              </div>
              {priceCheckError && <Alert type="error" showIcon role="alert" message={priceCheckError} />}
              {priceCheck && <PriceBreakdownView preview={priceCheck} />}
            </>
          ) : (
            <small className="mgr-cell-sub">{t.previewSaveFirst}</small>
          )}
        </section>
        <Form.Item label={t.description} htmlFor="adm-svc-desc" validateStatus={status('description')} help={errors.description}>
          <Input.TextArea
            id="adm-svc-desc"
            rows={4}
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
          />
        </Form.Item>
        <Form.Item label={t.image} htmlFor="adm-svc-image" validateStatus={status('image')} help={errors.image} extra={t.imageHint}>
          <div className="adm-service-image">
            {preview && <img src={preview} alt={t.image} />}
            <Input
              id="adm-svc-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                if (
                  !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                  file.size === 0 ||
                  file.size > 5 * 1024 * 1024
                ) {
                  setErrors((current) => ({ ...current, image: t.invalidImage }))
                  event.target.value = ''
                  return
                }
                setErrors((current) => ({ ...current, image: '' }))
                setImage(file)
                setRemoveImage(false)
              }}
            />
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
        </Form.Item>
        <Form.Item>
          <Checkbox
            checked={values.isActive}
            onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
          >
            {t.isActive}
            <small className="adm-check-hint">{t.isActiveHint}</small>
          </Checkbox>
        </Form.Item>
        {submitError && <Alert type="error" showIcon role="alert" message={submitError} />}
      </Form>
    </Modal>
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
