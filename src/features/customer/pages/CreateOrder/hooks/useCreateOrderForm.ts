import { useCallback, useState } from 'react'

import {
  createDefaultForm,
  isStep,
} from '../../../lib/createOrder/draftStorage'
import type {
  FormErrors,
  FormState,
  MapPoint,
  Step,
  StoredCreateOrderDraft,
} from '../../../lib/createOrder/types'

/** Wizard form state (fields, errors, step, map point) seeded from a stored draft. */
export function useCreateOrderForm(stored: StoredCreateOrderDraft | null) {
  const [step, setStep] = useState<Step>(isStep(stored?.step) ? stored.step : 1)
  const [form, setForm] = useState<FormState>(() => ({
    ...createDefaultForm(),
    ...(stored?.form ?? {}),
  }))
  const [errors, setErrors] = useState<FormErrors>({})
  const [mapPoint, setMapPoint] = useState<MapPoint>(
    stored?.mapPoint ?? { x: 50, y: 50 },
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }))
      setErrors((current) => ({ ...current, [key]: undefined }))
      setSubmitError(null)
    },
    [],
  )

  return {
    step,
    setStep,
    form,
    setForm,
    errors,
    setErrors,
    mapPoint,
    setMapPoint,
    submitError,
    setSubmitError,
    update,
  }
}
