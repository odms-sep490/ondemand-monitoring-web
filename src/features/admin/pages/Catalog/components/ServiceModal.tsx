import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { Modal } from '../../../../../shared/components/ui'
import {
  emptyServiceForm,
  mapService,
  readApiError,
  serviceToForm,
  toServiceRequest,
} from '../../../lib/catalogMappers'
import type { AdminService } from '../../../types/catalog'
import { EditLoader } from './EditLoader'
import { FormField } from '../../../../../shared/components/ui'
import { FormFooter } from '../../../../../shared/components/ui'
import { serviceModalMessages } from './ServiceModal.messages'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import { adminHref } from '../../../routes'
import { ServicePriceSummary } from '../../Checklists/ServicePriceSummary'
import './serviceModal.css'

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
  const imageInput = useRef<HTMLInputElement>(null)
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

  /** The stored default Base Checklist prices; nothing is saved. */
  async function checkPrice() {
    if (!service?.id) return
    setPriceCheckError(null)
    try {
      setPriceCheck(await checklistPricingApi.defaultPrice(service.id))
    } catch {
      setPriceCheck(null)
      setPriceCheckError(t.previewError)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.name.trim()) {
      setErrors({ name: t.required })
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
    <div className="catalog-service-dialog">
      <Modal
        width={620}
        icon="plus"
        title={service ? t.editTitle : t.createTitle}
        subtitle={service ? t.editSubtitle : t.createSubtitle}
        onClose={onClose}
        footer={
          <FormFooter formId="adm-service-form" busy={busy} onClose={onClose} />
        }
      >
        <form
          id="adm-service-form"
          className="catalog-service-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <FormField
            id="adm-svc-name"
            label={t.name}
            required
            error={errors.name}
          >
            <input
              id="adm-svc-name"
              className="odm-inp"
              disabled={busy}
              value={values.name}
              placeholder={t.namePlaceholder}
              aria-invalid={!!errors.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </FormField>
          <FormField
            id="adm-svc-desc"
            label={t.description}
            error={errors.description}
          >
            <textarea
              id="adm-svc-desc"
              className="odm-inp"
              rows={3}
              disabled={busy}
              placeholder={t.descriptionPlaceholder}
              value={values.description}
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </FormField>
          <section
            aria-label={t.previewTitle}
            className="adm-service-price-check"
          >
            <strong>{t.previewTitle}</strong>
            {service?.id ? (
              <>
                <div className="catalog-service-price-actions">
                  <button
                    type="button"
                    className="odm-btn odm-btn-sm"
                    disabled={busy}
                    onClick={() => void checkPrice()}
                  >
                    {t.previewButton}
                  </button>{' '}
                  <a
                    className="odm-btn odm-btn-gh odm-btn-sm"
                    href={adminHref({
                      screen: 'serviceChecklists',
                      serviceId: service.id,
                    })}
                  >
                    {t.manageChecklists}
                  </a>
                </div>
                {priceCheckError && <p role="alert">{priceCheckError}</p>}
                {priceCheck && <ServicePriceSummary preview={priceCheck} />}
              </>
            ) : (
              <small>{t.previewSaveFirst}</small>
            )}
          </section>
          <FormField id="adm-svc-image" label={t.image} error={errors.image}>
            <div className="adm-service-image">
              {preview && (
                <ImagePreview
                  className="catalog-service-image-preview"
                  src={preview}
                  fileName={t.image}
                />
              )}
              <div className="catalog-service-image-controls">
                <input
                  id="adm-svc-image"
                  ref={imageInput}
                  className="odm-visually-hidden"
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
                <div className="catalog-service-image-picker">
                  <button
                    type="button"
                    className="odm-btn odm-btn-sm"
                    disabled={busy}
                    onClick={() => imageInput.current?.click()}
                  >
                    {preview || image ? t.changeImage : t.chooseImage}
                  </button>
                  <span
                    className="catalog-service-image-name"
                    title={image?.name}
                  >
                    {image?.name ?? (preview ? t.currentImage : t.noImage)}
                  </span>
                </div>
                <small>{t.imageHint}</small>
                {(preview || image) && (
                  <button
                    type="button"
                    className="odm-btn odm-btn-sm"
                    disabled={busy}
                    onClick={() => {
                      setImage(null)
                      if (imageInput.current) imageInput.current.value = ''
                      setRemoveImage(true)
                      setErrors((current) => ({ ...current, image: '' }))
                    }}
                  >
                    {t.removeImage}
                  </button>
                )}
              </div>
            </div>
          </FormField>
          <label className="adm-check catalog-service-status">
            <input
              type="checkbox"
              role="switch"
              aria-label={t.activityLabel}
              disabled={busy}
              checked={values.isActive}
              onChange={(e) =>
                setValues({ ...values, isActive: e.target.checked })
              }
            />
            <span>
              {values.isActive ? t.isActive : t.inactiveState}
              <small>{t.isActiveHint}</small>
            </span>
          </label>
          {submitError && (
            <div role="alert" className="adm-alert is-danger">
              {submitError}
            </div>
          )}
        </form>
      </Modal>
    </div>
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
