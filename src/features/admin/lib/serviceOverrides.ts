import type { ServiceChecklistRequirementsInput } from '../api/checklistsApi'
import { MAX_MEDIA_COUNT } from './checklistPricing'

/** Raw "this service only" form state; an empty field inherits the checklist's own value. */
export type OverrideForm = {
  images: string
  videos: string
  required: boolean
}

/** Empty string inherits; anything else must be a whole number in range. */
function optionalWhole(value: string, max: number): number | null | 'invalid' {
  if (value.trim() === '') return null
  if (!/^\d+$/.test(value.trim())) return 'invalid'
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed <= max ? parsed : 'invalid'
}

export function parseOverrides(
  form: OverrideForm,
): { ok: true; value: ServiceChecklistRequirementsInput } | { ok: false } {
  const images = optionalWhole(form.images, MAX_MEDIA_COUNT)
  const videos = optionalWhole(form.videos, MAX_MEDIA_COUNT)
  if (images === 'invalid' || videos === 'invalid') return { ok: false }
  return {
    ok: true,
    value: {
      includedImageCountOverride: images,
      includedVideoCountOverride: videos,
      required: form.required,
    },
  }
}

/** What the checklist itself provides, as it will be after this save. */
export type ChecklistBase = {
  includedImageCount: number
  includedVideoCount: number
}

/**
 * Media allowances equal to the checklist value are saved as "inherit". Checklist prices are global and cannot be
 * overridden at the service assignment.
 */
export function inheritWhenUnchanged(
  value: ServiceChecklistRequirementsInput,
  base: ChecklistBase,
): ServiceChecklistRequirementsInput {
  return {
    includedImageCountOverride:
      value.includedImageCountOverride === base.includedImageCount
        ? null
        : value.includedImageCountOverride,
    includedVideoCountOverride:
      value.includedVideoCountOverride === base.includedVideoCount
        ? null
        : value.includedVideoCountOverride,
    required: value.required,
    ...(value.expectedVersion == null ? {} : { expectedVersion: value.expectedVersion }),
  }
}
