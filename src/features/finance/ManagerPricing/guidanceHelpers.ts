import type { PricingChecklistItem } from '../types'
export const guidanceSections = [
  'executionSteps',
  'inputRequirements',
  'expectedOutputs',
] as const
export const normalizeGuidanceList = (values: string[]) => [
  ...new Set(values.map((value) => value.trim()).filter(Boolean)),
]
export function needsGuidance(item: PricingChecklistItem) {
  return (
    item.sourceType === 'CUSTOMER_CUSTOM' &&
    !['REJECTED', 'DUPLICATE'].includes(item.reviewStatus) &&
    item.guidanceReady !== true
  )
}
