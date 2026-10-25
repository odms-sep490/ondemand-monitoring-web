import type { ServiceChecklistPricingInput } from '../api/checklistsApi'
import { MAX_MEDIA_COUNT } from './checklistPricing'

/** Raw "this service only" form state; an empty field inherits the checklist's own value. */
export type OverrideForm = {
  basePrice: string
  images: string
  videos: string
  profile: string
  required: boolean
}

const PROFILE = /^[A-Za-z0-9_]*$/

/** Empty string inherits; anything else must be a whole number in range. */
function optionalWhole(value: string, max: number): number | null | 'invalid' {
  if (value.trim() === '') return null
  if (!/^\d+$/.test(value.trim())) return 'invalid'
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : 'invalid'
}

export function parseOverrides(
  form: OverrideForm,
): { ok: true; value: ServiceChecklistPricingInput } | { ok: false } {
  const base = optionalWhole(form.basePrice, 9_999_999_999_999)
  const images = optionalWhole(form.images, MAX_MEDIA_COUNT)
  const videos = optionalWhole(form.videos, MAX_MEDIA_COUNT)
  if (
    base === 'invalid' ||
    images === 'invalid' ||
    videos === 'invalid' ||
    form.profile.length > 60 ||
    !PROFILE.test(form.profile)
  )
    return { ok: false }
  return {
    ok: true,
    value: {
      basePriceOverride: base,
      includedImageCountOverride: images,
      includedVideoCountOverride: videos,
      pricingProfileOverride: form.profile.trim().toUpperCase() || null,
      required: form.required,
    },
  }
}

/** What the checklist itself provides, as it will be after this save. */
export type ChecklistBase = {
  basePrice: number
  includedImageCount: number
  includedVideoCount: number
}

/**
 * A value equal to what the checklist already provides is saved as "inherit", so a later change to the checklist still
 * flows through to this service instead of being frozen by an override that only repeats it.
 * The pricing-profile override is not edited on screen and is never touched here.
 */
export function inheritWhenUnchanged(
  value: ServiceChecklistPricingInput,
  base: ChecklistBase,
): ServiceChecklistPricingInput {
  return {
    ...value,
    basePriceOverride:
      value.basePriceOverride === base.basePrice
        ? null
        : value.basePriceOverride,
    includedImageCountOverride:
      value.includedImageCountOverride === base.includedImageCount
        ? null
        : value.includedImageCountOverride,
    includedVideoCountOverride:
      value.includedVideoCountOverride === base.includedVideoCount
        ? null
        : value.includedVideoCountOverride,
  }
}
