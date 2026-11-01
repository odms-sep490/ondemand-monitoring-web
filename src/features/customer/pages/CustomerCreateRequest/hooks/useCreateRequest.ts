import { useCallback, useMemo, useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { buildOrderPayload, pricingAreaHa } from '../../../lib/createOrder/payload'
import { scoreRequest } from '../../../lib/createOrder/scoring'
import type { FormErrors, FormState } from '../../../lib/createOrder/types'
import { validateStep } from '../../../lib/createOrder/validators'
import { createOrderPageMessages } from '../../CreateOrder/CreateOrderPage.messages'
import { useCreateOrderMeta } from '../../CreateOrder/hooks/useCreateOrderMeta'
import { useRequestSubmit } from './useRequestSubmit'
import { useOrderChecklist } from '../../../lib/checklist/useOrderChecklist'

/** Single-page create-request form; reuses the wizard's map, meta and validators. */
export function useCreateRequest() {
  const { t } = useI18n(createOrderPageMessages)
  const [form, setForm] = useState<FormState>(createDefaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const checklist = useOrderChecklist(form.serviceId, {
    areaHa: pricingAreaHa(form),
    lengthKm: Number(form.estimatedLengthM || 0) / 1000,
    altitudeM: Number.isFinite(form.altitudeM) ? form.altitudeM : 0,
    resultFormats: form.resultFormats,
    permitStatus: form.permitStatus,
  })

  const meta = useCreateOrderMeta(form.serviceId, setForm)
  const service = meta.services.find((s) => s.id === form.serviceId)
  const time = meta.preferredTimes.find((x) => x.id === form.preferredTimeId)
  const deliverable = meta.deliverables.find(
    (d) => d.deliverableTypeId === form.deliverableTypeId,
  )

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }))
      setErrors((current) => ({ ...current, [key]: undefined }))
      setSubmitError(null)
    },
    [],
  )

  const validate = () => {
    const found = validateStep(
      5,
      form,
      {
        monitoringValid: true,
        blockedZoneNames: [],
      },
      t.validation,
    )
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const score = useMemo(
    () => scoreRequest(form, t.scoreNotes),
    [form, t.scoreNotes],
  )
  const submit = useRequestSubmit({
    validate: () => validate() && checklist.valid,
    onTemplateChanged: checklist.markStale,
    onError: setSubmitError,
    buildPayload: () => ({
      ...buildOrderPayload({
        mediaTotals: checklist.mediaTotals,
        deliverableOptions: meta.deliverables,
        form,
        score,
      }),
      checklistItems: checklist.serialize(),
    }),
  })

  return {
    checklist,
    clearSubmitError: () => setSubmitError(null),
    form,
    errors,
    update,
    submitError,
    meta,
    service,
    time,
    deliverable,
    submit,
  }
}
