import { Alert, Form, Modal } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'

import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { onFormSubmit } from '../../../components/common/formSubmit'
import type { NoFlyZone } from '../../../types/operatingConfig'
import { toFormState, toPayload, type ZoneFormState } from './zoneForm'
import { ZoneFormFields } from './ZoneFormFields'
import { zoneModalMessages } from './ZoneModal.messages'

type Props = {
  zone?: NoFlyZone
  onClose: () => void
  onSaved: () => void
}

export function ZoneModal({ zone, onClose, onSaved }: Props) {
  const { t } = useI18n(zoneModalMessages)
  const [form, setForm] = useState<ZoneFormState>(() => toFormState(zone))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!form.name.trim()) {
      setErrors({ name: t.required })
      return
    }
    setErrors({})
    setBusy(true)
    setSubmitError(null)
    try {
      const payload = toPayload(form, zone)
      if (zone) await adminApi.updateNoFlyZone(zone.id, payload)
      else await adminApi.createNoFlyZone(payload)
      onSaved()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={560}
      title={zone ? t.editTitle : t.addTitle}
      onCancel={onClose}
      footer={<AdminFormFooter formId="adm-nfz-form" busy={busy} onClose={onClose} />}
    >
      <p className="mgr-modal-sub">{t.subtitle}</p>
      <Form
        id="adm-nfz-form"
        layout="vertical"
        onSubmitCapture={onFormSubmit(handleSubmit)}
        noValidate
      >
        <ZoneFormFields
          form={form}
          errors={errors}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        />
        {submitError && <Alert type="error" showIcon role="alert" message={submitError} />}
      </Form>
    </Modal>
  )
}
