import { Alert, Form, Input, Select } from 'antd'
import { useState, type FormEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  PREFERRED_TIME_CODES,
  catalogApi,
  type PreferredTimeCode,
} from '../../../api/catalogApi'
import { AdminField } from '../../../components/common/AdminField'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { AdminModal } from '../../../components/common/AdminModal'
import { LocalizedTextInput } from '../../../components/common/LocalizedTextInput'
import {
  emptyTimeslotForm,
  mapTimeslot,
  readApiError,
  timeslotToForm,
  toTimeslotRequest,
} from '../../../lib/catalogMappers'
import { LOCALIZED_LIMITS, validateLocalized } from '../../../lib/localizedField'
import type { AdminTimeslot } from '../../../types/catalog'
import { EditLoader } from './EditLoader'
import { timeslotCodeMessages } from './timeslotCodes.messages'
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    const nameIssue = validateLocalized(values.name, {
      required: true,
      maxEncoded: LOCALIZED_LIMITS.timeslotName,
    })
    if (nameIssue)
      next.name = nameIssue === 'required' ? t.nameRequired : t.nameTooLong
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

  return (
    <AdminModal
      width={540}
      title={timeslot ? t.editTitle : t.createTitle}
      subtitle={timeslot ? t.editSubtitle : t.createSubtitle}
      onClose={onClose}
      footer={
        <AdminFormFooter
          formId="adm-timeslot-form"
          busy={busy}
          onClose={onClose}
        />
      }
    >
      <Form
        id="adm-timeslot-form"
        layout="vertical"
        onSubmitCapture={handleSubmit}
        noValidate
      >
        <AdminField
          id="adm-ts-code"
          label={t.code}
          required
          error={errors.code}
        >
          <Select<PreferredTimeCode>
            id="adm-ts-code"
            value={values.code}
            onChange={(code) => setValues({ ...values, code })}
            options={PREFERRED_TIME_CODES.map((c) => ({
              value: c,
              label: `${c} · ${codes[c]}`,
            }))}
          />
        </AdminField>
        <AdminField
          id="adm-ts-name"
          label={t.name}
          required
          error={errors.name}
        >
          <LocalizedTextInput
            id="adm-ts-name"
            label={t.name}
            value={values.name}
            required
            placeholder={t.namePlaceholder}
            maxEncoded={LOCALIZED_LIMITS.timeslotName}
            onChange={(name) => setValues({ ...values, name })}
          />
        </AdminField>
        <div className="adm-form-pair">
          <AdminField
            id="adm-ts-start"
            label={t.startTime}
            required
            error={errors.startTime}
          >
            <Input
              id="adm-ts-start"
              type="time"
              value={values.startTime}
              onChange={(e) =>
                setValues({ ...values, startTime: e.target.value })
              }
            />
          </AdminField>
          <AdminField
            id="adm-ts-end"
            label={t.endTime}
            required
            error={errors.endTime}
          >
            <Input
              id="adm-ts-end"
              type="time"
              value={values.endTime}
              onChange={(e) =>
                setValues({ ...values, endTime: e.target.value })
              }
            />
          </AdminField>
        </div>
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
        <TimeslotForm
          timeslot={fresh ?? timeslot}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </EditLoader>
  )
}
