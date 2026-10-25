import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import {
  validateStep,
  type LocationCheck,
  type ValidationMessages,
} from '../../../lib/createOrder/validators'
import type {
  FormErrors,
  FormState,
  Step,
} from '../../../lib/createOrder/types'

type Options = {
  step: Step
  setStep: Dispatch<SetStateAction<Step>>
  form: FormState
  setErrors: (errors: FormErrors) => void
  location: LocationCheck
  messages: ValidationMessages
  /** Extra gate on leaving a step (e.g. the monitoring-content list must be valid). */
  canAdvance?: (step: Step) => boolean
}

const errorFieldIds: Partial<Record<keyof FormErrors, string>> = {
  serviceId: 'co-service',
  title: 'co-title',
  address: 'co-address',
  preferredDateFrom: 'co-from',
  preferredDateTo: 'co-to',
  preferredTimeId: 'co-time',
  resultDeadline: 'co-deadline',
  deliverableTypeId: 'co-deliv',
}

/** After a failed validation, bring the exact invalid field into view and focus it. */
function revealFirstError(errors: FormErrors) {
  const targetId = (Object.keys(errors) as Array<keyof FormErrors>)
    .map((key) => errorFieldIds[key])
    .find(Boolean)
  window.setTimeout(() => {
    const target = targetId ? document.getElementById(targetId) : null
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      target.focus({ preventScroll: true })
      return
    }
    const error = document.querySelector('.ui-field-error')
    if (!error) return
    error.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const field = error
      .closest('.ui-form-field, fieldset, section, .ui-card')
      ?.querySelector<HTMLElement>('input, select, textarea')
    field?.focus({ preventScroll: true })
  }, 50)
}

const stepTwoErrors: Array<keyof FormErrors> = [
  'address',
  'latitude',
  'longitude',
]

const stepFourErrors: Array<keyof FormErrors> = [
  'altitudeM',
  'estimatedLengthM',
  'siteContactName',
  'siteContactPhone',
  'accessNotes',
  'permitStatus',
  'permitNumber',
  'permitDocuments',
  'permitExpiresOn',
  'monitoringRelationship',
  'monitoringAuthorizationConfirmed',
  'monitoringAuthorizationDocuments',
]

function firstInvalidStep(errors: FormErrors): Step {
  if (errors.serviceId || errors.title) return 1
  if (stepTwoErrors.some((key) => Boolean(errors[key]))) return 2
  if (stepFourErrors.some((key) => Boolean(errors[key]))) return 4
  if (
    errors.preferredDateFrom ||
    errors.preferredDateTo ||
    errors.preferredTimeId ||
    errors.resultDeadline ||
    errors.recurrenceOccurrences
  )
    return 5
  return 6
}

/** Step navigation: validate the current step before moving forward. */
export function useWizard(o: Options) {
  // The furthest step the customer has reached: tabs up to it stay clickable after going back.
  const [reached, setReached] = useState<Step>(o.step)
  useEffect(() => {
    setReached((current) => (o.step > current ? o.step : current))
  }, [o.step])

  function showErrors(errors: FormErrors) {
    o.setErrors(errors)
    const invalidStep = firstInvalidStep(errors)
    if (invalidStep !== o.step) o.setStep(invalidStep)
    revealFirstError(errors)
  }

  function validate(target: Step) {
    const errors = validateStep(target, o.form, o.location, o.messages)
    o.setErrors(errors)
    const valid = Object.keys(errors).length === 0
    if (!valid) showErrors(errors)
    return valid
  }

  return {
    validate,
    showErrors,
    next: () => {
      if (validate(o.step) && (o.canAdvance?.(o.step) ?? true))
        o.setStep((c) => Math.min(6, c + 1) as Step)
    },
    back: () => o.setStep((c) => Math.max(1, c - 1) as Step),
    reached,
    /** Back is always allowed; forward only to a reached step, and only if every step in between is still valid. */
    goTo: (target: Step) => {
      if (target === o.step) return
      if (target < o.step) return o.setStep(target)
      if (target > reached) return
      for (let current = o.step; current < target; current++) {
        if (!validate(current as Step)) return
        if (!(o.canAdvance?.(current as Step) ?? true)) return
      }
      o.setStep(target)
    },
  }
}
