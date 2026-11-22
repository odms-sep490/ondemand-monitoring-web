import { apiRequest } from './httpClient'

/** Mirrors `ChecklistPriceBreakdown` (backend). Every line is a component billed exactly once. */
export type ChecklistPriceLine = {
  /** BASE, CUSTOM_BASE, DIFFICULTY, INCLUDED_IMAGE, INCLUDED_VIDEO, EXTRA_IMAGE, EXTRA_VIDEO */
  component: string
  category: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  tierFrom: number | null
  tierTo: number | null
  blockSize: number | null
  rounding: string | null
}

export type ChecklistPriceBreakdown = {
  checklistId: string | null
  content: string
  pricingProfile?: string | null
  custom: boolean
  includedImageCount: number
  includedVideoCount: number
  requestedImageCount: number
  requestedVideoCount: number
  extraImageCount: number
  extraVideoCount: number
  standardVideoDurationSeconds: number | null
  /** Present for catalog Base Checklists priced by area; all values are returned by the backend. */
  basePrice?: number | null
  standardAreaM2?: number | null
  actualAreaM2?: number | null
  calculationDisplay?: string | null
  lines: ChecklistPriceLine[]
  subtotal: number
  quotePending: boolean
}

/** `total = checklistSubtotal + sum(addOns)`; deterministic order-level factors are included here. */
export type PriceAddOn = { key: string; description: string; amount: number }

export type ServicePricePreview = {
  serviceId: string
  serviceName: string
  currency: string
  policyId: string | null
  policyVersion: number
  draftPolicy: boolean
  /** CHECKLISTS: the price is the sum of the checklists. UNPRICED: no default checklist carries a price yet. */
  priceSource: 'CHECKLISTS' | 'UNPRICED'
  packageFee: number
  checklists: ChecklistPriceBreakdown[]
  checklistSubtotal: number
  total: number
  complete: boolean
  warnings: string[]
  quotePending: boolean
  /** Order-level extras priced by the policy. */
  addOns?: PriceAddOn[]
  /** How many times the work is carried out; every figure already includes it. Absent or 1 for a single visit. */
  occurrences?: number
}

/** Customer input is choices and quantities only; the backend owns every price. */
export type CustomerQuoteItem = {
  existingItemId?: string
  sourceChecklistId?: string
  content?: string
  requestedImageCount?: number
  requestedVideoCount?: number
}
export type ChecklistQuoteContext = {
  orderId?: string
  areaHa?: number
  lengthKm?: number
  altitudeM?: number
  /** Number of visits of a repeating order; the quote is multiplied by it. */
  occurrences?: number
  /** Order-level deliverables selected in the current form. */
  resultFormats?: string[]
  permitStatus?: 'NONE' | 'HAVE_PERMIT' | 'NEED_SUPPORT'
}

export type CustomerQuoteSelection = ChecklistQuoteContext & {
  serviceId: string
  items: CustomerQuoteItem[]
}

export const checklistPricingApi = {
  defaultPrice: (serviceId: string, signal?: AbortSignal) =>
    apiRequest<ServicePricePreview>(
      `/api/admin/pricing/services/${encodeURIComponent(serviceId)}/default-price`,
      { signal },
    ),
  customerQuote: (
    serviceId: string,
    items: CustomerQuoteItem[],
    signal?: AbortSignal,
    context?: ChecklistQuoteContext,
  ) =>
    apiRequest<ServicePricePreview>('/api/pricing/checklist-quote', {
      method: 'POST',
      body: { serviceId, items, ...context },
      signal,
    }),
}
