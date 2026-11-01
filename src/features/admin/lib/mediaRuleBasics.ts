import type {
  MediaPricingComponent,
  PricingRounding,
  PricingRule,
} from '../types/pricing'

export const MEDIA_COMPONENTS: MediaPricingComponent[] = [
  'CHECKLIST_BASE',
  'INCLUDED_IMAGE',
  'INCLUDED_VIDEO',
  'EXTRA_IMAGE',
  'EXTRA_VIDEO',
  'INCLUDED_AREA',
  'EXTRA_AREA',
]
export const ROUNDING_MODES: PricingRounding[] = ['CEILING', 'FLOOR', 'HALF_UP']
export const CUSTOM_PROFILE = 'GENERIC_CUSTOMER_ADDED'
// Older policies keep their customer-added allowances under this profile; the backend still accepts it.
export const LEGACY_CUSTOM_PROFILE = 'CUSTOM'

export const isMediaRule = (rule: PricingRule) => rule.category === 'MEDIA'
export const isTier = (rule: PricingRule) =>
  rule.mediaComponent === 'EXTRA_IMAGE' || rule.mediaComponent === 'EXTRA_VIDEO'
