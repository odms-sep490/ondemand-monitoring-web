import { useRef, useState } from 'react'

import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { customerApi, type CreateOrderPayload } from '../../../api/customerApi'
import { clearStoredDraft } from '../../../lib/createOrder/draftStorage'
import { checklistError, isStaleChecklist } from '../../../lib/checklist/errors'

type Options = {
  /** Validates the whole form (step 4); returns false to abort. */
  validate: () => boolean
  buildPayload: () => CreateOrderPayload
  onError: (message: string | null) => void
  onTemplateChanged?: () => void
  /** Handles field-level API validation errors and routes the wizard to them. */
  onValidationError?: (error: unknown) => boolean
}

/** Confirm dialog state + `POST /api/orders`. */
export function useSubmitOrder({
  validate,
  buildPayload,
  onError,
  onTemplateChanged,
  onValidationError,
}: Options) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const inFlight = useRef(false)

  async function submit() {
    if (inFlight.current || createdId) return
    if (!validate()) {
      setConfirmOpen(false)
      return
    }
    setSubmitting(true)
    inFlight.current = true
    onError(null)
    try {
      const result = await customerApi.createOrder(buildPayload())
      clearStoredDraft()
      setConfirmOpen(false)
      setCreatedId(result.id)
      setCreatedCode(displayOrderCode(result.orderCode, result.id))
    } catch (error: unknown) {
      if (onValidationError?.(error)) {
        setConfirmOpen(false)
        return
      }
      if (isStaleChecklist(error)) {
        onTemplateChanged?.()
        setConfirmOpen(false)
      }
      onError(checklistError(error))
    } finally {
      setSubmitting(false)
      inFlight.current = false
    }
  }

  return {
    confirmOpen,
    openConfirm: () => validate() && setConfirmOpen(true),
    closeConfirm: () => !submitting && setConfirmOpen(false),
    submitting,
    createdId,
    createdCode,
    submit,
  }
}
