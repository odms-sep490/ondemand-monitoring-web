import { useCallback, useEffect, useMemo } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { readStoredDraft } from '../../../lib/createOrder/draftStorage'
import {
  buildOrderPayload,
  pricingAreaHa,
} from '../../../lib/createOrder/payload'
import { scoreRequest } from '../../../lib/createOrder/scoring'
import { createOrderPageMessages } from '../CreateOrderPage.messages'
import { useCreateOrderForm } from './useCreateOrderForm'
import { useCreateOrderMeta } from './useCreateOrderMeta'
import { useDraftPersistence } from './useDraftPersistence'
import { useSubmitOrder } from './useSubmitOrder'
import { useWizard } from './useWizard'
import { useOrderChecklist } from '../../../lib/checklist/useOrderChecklist'
import { ApiError } from '../../../../../shared/api/httpClient'
import type { FormErrors, FormState } from '../../../lib/createOrder/types'
import { canonicalDraftToFormState, type OrderAgentSession } from '../../../lib/createOrder/orderAgent'
import { validateStep } from '../../../lib/createOrder/validators'
import { CREATE_ORDER_DRAFT_STORAGE_KEY } from '../../../lib/createOrder/draftStorage'

const formFields = new Set<keyof FormState>([
  'serviceId',
  'title',
  'address',
  'latitude',
  'longitude',
  'altitudeM',
  'estimatedLengthM',
  'siteContactPhone',
  'permitStatus',
  'permitNumber',
  'permitDocuments',
  'permitExpiresOn',
  'monitoringRelationship',
  'monitoringAuthorizationConfirmed',
  'monitoringAuthorizationDocuments',
  'preferredDateFrom',
  'preferredDateTo',
  'preferredTimeId',
  'resultDeadline',
  'recurrenceOccurrences',
  'deliverableTypeId',
  'resultFormats',
  'deliveryMethods',
  'termsAccepted',
])

/** Wires every wizard hook together; the page only renders the result. */
export function useCreateOrderWizard(assistantStep?: number) {
  const { t } = useI18n(createOrderPageMessages)
  const stored = useMemo(readStoredDraft, [])
  const f = useCreateOrderForm(stored)
  const { form, step } = f
  const checklistPricingReady = step >= 3 || (assistantStep !== undefined && assistantStep >= 3)
  const checklist = useOrderChecklist(form.serviceId, {
    areaHa: checklistPricingReady ? pricingAreaHa(form) : undefined,
    lengthKm: Number(form.estimatedLengthM || 0) / 1000,
    altitudeM: Number.isFinite(form.altitudeM) ? form.altitudeM : 0,
    occurrences: 1,
    permitStatus: form.permitStatus,
  }, form.agentChecklistItems)
  const meta = useCreateOrderMeta(form.serviceId, f.setForm)
  const service = meta.services.find((s) => s.id === form.serviceId)
  const quoteErrorCode = checklist.quote.error?.code
  const { setForm, setStep, setSubmitError } = f
  const reloadCatalog = meta.reload

  const refreshServiceCatalog = useCallback(() => {
    // A running page may retain service IDs from before a catalog/database refresh.
    setForm(current => ({ ...current, serviceId: '', deliverableTypeId: '' }))
    setStep(1)
    setSubmitError(t.serviceChanged)
    reloadCatalog()
  }, [reloadCatalog, setForm, setStep, setSubmitError, t.serviceChanged])

  useEffect(() => {
    if (quoteErrorCode === 'SERVICE_NOT_FOUND' || quoteErrorCode === 'SERVICE_INACTIVE') refreshServiceCatalog()
  }, [quoteErrorCode, refreshServiceCatalog])

  const wizard = useWizard({
    step,
    setStep: f.setStep,
    form,
    setErrors: f.setErrors,
    location: {
      monitoringValid: form.locationStatus === 'confirmed',
      blockedZoneNames: [],
    },
    messages: t.validation,
    canAdvance: (current) => current !== 3 || checklist.valid,
  })

  const score = useMemo(
    () => scoreRequest(form, t.scoreNotes),
    [form, t.scoreNotes],
  )

  const submit = useSubmitOrder({
    validate: () => wizard.validate(6) && checklist.valid,
    onTemplateChanged: checklist.markStale,
    onError: f.setSubmitError,
    onValidationError: (error) => {
      if (!(error instanceof ApiError) || error.status !== 400) return false

      const fieldErrors: FormErrors = {}
      for (const [field, message] of Object.entries(error.errors ?? {})) {
        if (formFields.has(field as keyof FormState) && message) {
          fieldErrors[field as keyof FormState] = String(message)
        }
      }

      // Service validation currently returns this rule as a plain ApiException
      // message rather than in the `errors` map.
      if (/preferredDateFrom must be at least 7 days/i.test(error.message)) {
        fieldErrors.preferredDateFrom = t.validation.preferredDateTooSoon
      } else if (
        /preferredDateFrom must be before or equal to preferredDateTo/i.test(
          error.message,
        )
      ) {
        fieldErrors.preferredDateTo = t.validation.preferredDateOrder
      }

      if (Object.keys(fieldErrors).length === 0) return false
      f.setSubmitError(null)
      wizard.showErrors(fieldErrors)
      return true
    },
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

  useDraftPersistence(
    {
      step,
      form,
      mapPoint: f.mapPoint,
    },
    !submit.createdId,
  )

  return {
    applyValidatedAgentDraft: (session:OrderAgentSession, expectedForm:FormState) => {
      if(JSON.stringify(form)!==JSON.stringify(expectedForm)) throw new Error('Biểu mẫu đã thay đổi. Hãy kiểm tra lại bản nháp mới nhất.')
      const next=canonicalDraftToFormState(form,session)
      if(checklist.status!=='ready' || next.agentChecklistItems?.some(item=>item.sourceChecklistId &&
        checklist.rows.find(row=>row.sourceChecklistId===item.sourceChecklistId)?.version!==item.expectedChecklistVersion))
        throw new Error('Nội dung giám sát đã thay đổi. Hãy tải lại và kiểm tra bản nháp trước khi xem lại.')
      const errors=validateStep(6,next,{monitoringValid:next.locationStatus==='confirmed',blockedZoneNames:[]},t.validation)
      if(Object.keys(errors).length) {
        f.setErrors(errors)
        throw new Error('Vui lòng bổ sung các trường còn thiếu trên biểu mẫu trước khi xem lại.')
      }
      // Persist before replacing the live form: quota errors leave the current form intact.
      try {window.localStorage.setItem(CREATE_ORDER_DRAFT_STORAGE_KEY,JSON.stringify({form:next,step:6,mapPoint:f.mapPoint}))}
      catch {throw new Error('Chưa lưu được bản nháp trên máy này. Biểu mẫu được giữ nguyên; hãy kiểm tra dung lượng lưu trữ rồi thử lại.')}
      f.setForm(next)
      f.setErrors({})
      f.setStep(6)
    },
    checklist,
    refreshServiceCatalog,
    f,
    meta,
    wizard,
    submit,
    score,
    service,
    time: meta.preferredTimes.find((x) => x.id === form.preferredTimeId),
    deliverable: meta.deliverables.find(
      (d) => d.deliverableTypeId === form.deliverableTypeId,
    ),
  }
}

