import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import type { ServicePricingEstimate } from '../../api/customerApi'

function contextualCharges(quote: ServicePricePreview) {
  const charges = new Map<string, number>()
  for (const checklist of quote.checklists) {
    for (const line of checklist.lines) {
      const key =
        line.category === 'AREA' ||
        line.category === 'DISTANCE' ||
        line.category === 'ALTITUDE'
          ? line.category
          : line.component === 'EXTRA_IMAGE' ||
              line.component === 'EXTRA_VIDEO' ||
              line.component === 'EXTRA_AREA'
            ? line.component
            : null
      if (key) charges.set(key, (charges.get(key) ?? 0) + line.amount)
    }
  }
  return [...charges].map(([key, amount]) => ({
    type: `CONTEXT_${key}`,
    description: key,
    additionalPrice: amount,
  }))
}

/** Separates contextual checklist charges so every deterministic amount in the customer total is visible. */
export function selectionEstimate(
  estimate: ServicePricingEstimate | null,
  quote: ServicePricePreview | null,
): ServicePricingEstimate | null {
  if (!quote) return estimate

  const context = contextualCharges(quote)
  const contextTotal = context.reduce(
    (total, charge) => total + charge.additionalPrice,
    0,
  )

  return {
    serviceId: estimate?.serviceId ?? quote.serviceId,
    servicePrice: quote.checklistSubtotal - contextTotal,
    additionalRequirements: [
      ...context,
      ...(quote.addOns ?? []).map((addOn) => ({
        type: addOn.key,
        description: addOn.description,
        additionalPrice: addOn.amount,
      })),
    ],
    totalPrice: quote.total,
    quotePending: quote.quotePending,
    occurrences: quote.occurrences,
  }
}
