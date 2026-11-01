import { Alert, Checkbox, Form, InputNumber } from 'antd'
import { useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { AdminField } from '../../../components/common/AdminField'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { AdminModal } from '../../../components/common/AdminModal'
import { LocalizedTextInput } from '../../../components/common/LocalizedTextInput'
import {
  emptyServiceForm,
  readApiError,
  serviceToForm,
  toServiceRequest,
} from '../../../lib/catalogMappers'
import { LOCALIZED_LIMITS, validateLocalized } from '../../../lib/localizedField'
import type { AdminService } from '../../../types/catalog'
import { serviceModalMessages } from './ServiceModal.messages'
import { ServiceImageField } from './ServiceImageField'
import { ServicePriceCheck } from './ServicePriceCheck'
import { useServiceImage } from './useServiceImage'

export type ServiceFormProps = {
  /** Existing service (edit) or undefined (create). */
  service?: AdminService
  onClose: () => void
  onSaved: () => void
}

export function ServiceForm({ service, onClose, onSaved }: ServiceFormProps) {
  const { t } = useI18n(serviceModalMessages)
  const [values, setValues] = useState(
    service ? serviceToForm(service) : emptyServiceForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState(service?.id)
  const { image, removeImage, preview, pick, remove } = useServiceImage(
    service?.imageUrl,
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nameIssue = validateLocalized(values.name, {
      required: true,
      maxEncoded: LOCALIZED_LIMITS.serviceName,
    })
    if (
      nameIssue ||
      !Number.isSafeInteger(values.basePrice) ||
      values.basePrice <= 0
    ) {
      setErrors({
        ...(nameIssue
          ? { name: nameIssue === 'required' ? t.required : t.nameTooLong }
          : {}),
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
          <LocalizedTextInput
            id="adm-svc-name"
            label={t.name}
            value={values.name}
            required
            placeholder={t.namePlaceholder}
            maxEncoded={LOCALIZED_LIMITS.serviceName}
            onChange={(name) => setValues({ ...values, name })}
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
        <ServicePriceCheck serviceId={service?.id} busy={busy} />
        <AdminField
          id="adm-svc-desc"
          label={t.description}
          error={errors.description}
        >
          <LocalizedTextInput
            id="adm-svc-desc"
            label={t.description}
            multiline
            rows={4}
            value={values.description}
            onChange={(description) => setValues({ ...values, description })}
          />
        </AdminField>
        <ServiceImageField
          preview={preview}
          removable={Boolean(preview || image)}
          busy={busy}
          error={errors.image}
          onPick={(file) => {
            const ok = pick(file)
            setErrors((current) => ({
              ...current,
              image: ok ? '' : t.invalidImage,
            }))
          }}
          onRemove={() => {
            remove()
            setErrors((current) => ({ ...current, image: '' }))
          }}
        />
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
