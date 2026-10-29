import { Alert, Form, Input, Modal, Select } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'

import { useI18n } from '../../../../../shared/i18n'
import {
  PREFERRED_TIME_CODES,
  catalogApi,
  type PreferredTimeCode,
} from '../../../api/catalogApi'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { onFormSubmit } from '../../../components/common/formSubmit'
import {
  emptyTimeslotForm,
  mapTimeslot,
  readApiError,
  timeslotToForm,
  toTimeslotRequest,
} from '../../../lib/catalogMappers'
import type { AdminTimeslot } from '../../../types/catalog'
import { EditLoader } from './EditLoader'
import { timeslotCodeMessages } from './timeslotCodes'
import { timeslotModalMessages } from './TimeslotModal.messages'

type Props = {
  timeslot?: AdminTimeslot
  onClose: () => void
  onSaved: () => void
}

function TimeslotForm({ timeslot, onClose, onSaved }: Props) {
  const { t } = useI18n(timeslotModalMessages)
  const { t: codes } = useI18n(timeslotCodeMessages)
  const [values, setValues] = useState(
    timeslot ? timeslotToForm(timeslot) : emptyTimeslotForm(),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit() {
    const next: Record<string, string> = {}
    if (!values.name.trim()) next.name = t.required
    if (!values.startTime) next.startTime = t.required
    if (!values.endTime) next.endTime = t.required
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    setSubmitError(null)
    try {
      const body = toTimeslotRequest(values)
      if (timeslot) await catalogApi.updatePreferredTime(timeslot.id, body)
      else await catalogApi.createPreferredTime(body)
      onSaved()
    } catch (err) {
      const { message, fields } = readApiError(err, t.genericError)
      setErrors(fields)
      setSubmitError(message)
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
      width={540}
      title={timeslot ? t.editTitle : t.createTitle}
      onCancel={onClose}
      footer={<AdminFormFooter formId="adm-timeslot-form" busy={busy} onClose={onClose} />}
    >
      <p className="mgr-modal-sub">{timeslot ? t.editSubtitle : t.createSubtitle}</p>
      <Form
        id="adm-timeslot-form"
        layout="vertical"
        onSubmitCapture={onFormSubmit(handleSubmit)}
        noValidate
      >
        <Form.Item label={t.code} required htmlFor="adm-ts-code" validateStatus={status('code')} help={errors.code}>
          <Select<PreferredTimeCode>
            id="adm-ts-code"
            value={values.code}
            onChange={(code) => setValues({ ...values, code })}
            getPopupContainer={mgrPopupContainer}
            options={PREFERRED_TIME_CODES.map((c) => ({ value: c, label: `${c} · ${codes[c]}` }))}
          />
        </Form.Item>
        <Form.Item label={t.name} required htmlFor="adm-ts-name" validateStatus={status('name')} help={errors.name}>
          <Input
            id="adm-ts-name"
            value={values.name}
            placeholder={t.namePlaceholder}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </Form.Item>
        <div className="adm-form-pair">
          <Form.Item label={t.startTime} required htmlFor="adm-ts-start" validateStatus={status('startTime')} help={errors.startTime}>
            <Input
              id="adm-ts-start"
              type="time"
              value={values.startTime}
              onChange={(e) => setValues({ ...values, startTime: e.target.value })}
            />
          </Form.Item>
          <Form.Item label={t.endTime} required htmlFor="adm-ts-end" validateStatus={status('endTime')} help={errors.endTime}>
            <Input
              id="adm-ts-end"
              type="time"
              value={values.endTime}
              onChange={(e) => setValues({ ...values, endTime: e.target.value })}
            />
          </Form.Item>
        </div>
        {submitError && <Alert type="error" showIcon role="alert" message={submitError} />}
      </Form>
    </Modal>
  )
}

export function TimeslotModal({ timeslot, onClose, onSaved }: Props) {
  const { t } = useI18n(timeslotModalMessages)
  return (
    <EditLoader
      title={t.editTitle}
      onClose={onClose}
      load={
        timeslot
          ? (signal) =>
              catalogApi.getPreferredTime(timeslot.id, signal).then(mapTimeslot)
          : undefined
      }
    >
      {(fresh) => (
        <TimeslotForm timeslot={fresh ?? timeslot} onClose={onClose} onSaved={onSaved} />
      )}
    </EditLoader>
  )
}
