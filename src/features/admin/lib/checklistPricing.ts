import type { ChecklistPricingInput } from '../api/checklistsApi'

export const MAX_MEDIA_COUNT = 500
export const MAX_VIDEO_SECONDS = 7200
const PROFILE = /^[A-Za-z0-9_]*$/

/** Raw form state: every field stays a string so a half-typed value is never silently coerced. */
export type ChecklistPricingForm = {
  basePrice: string
  includedImageCount: string
  includedVideoCount: string
  standardVideoDurationSeconds: string
  pricingProfile: string
  areaPricingEnabled?: boolean
  lengthPricingEnabled?: boolean
  altitudePricingEnabled?: boolean
  includedAreaHa?: string
  includedLengthKm?: string
  includedAltitudeM?: string
}

export type ChecklistPricingErrors = Partial<
  Record<keyof ChecklistPricingForm, 'invalid'>
>

export const emptyPricingForm = (): ChecklistPricingForm => ({
  basePrice: '0',
  includedImageCount: '0',
  includedVideoCount: '0',
  standardVideoDurationSeconds: '',
  pricingProfile: '',
  areaPricingEnabled: false,
  lengthPricingEnabled: false,
  altitudePricingEnabled: false,
  includedAreaHa: '0',
  includedLengthKm: '0',
  includedAltitudeM: '0',
})

export function pricingToForm(row: {
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  standardVideoDurationSeconds?: number | null
  pricingProfile?: string | null
  areaPricingEnabled?: boolean
  lengthPricingEnabled?: boolean
  altitudePricingEnabled?: boolean
  includedAreaHa?: number
  includedLengthKm?: number
  includedAltitudeM?: number
}): ChecklistPricingForm {
  return {
    basePrice: String(row.basePrice ?? 0),
    includedImageCount: String(row.includedImageCount ?? 0),
    includedVideoCount: String(row.includedVideoCount ?? 0),
    standardVideoDurationSeconds:
      row.standardVideoDurationSeconds == null
        ? ''
        : String(row.standardVideoDurationSeconds),
    pricingProfile: row.pricingProfile ?? '',
    areaPricingEnabled: row.areaPricingEnabled ?? false,
    lengthPricingEnabled: row.lengthPricingEnabled ?? false,
    altitudePricingEnabled: row.altitudePricingEnabled ?? false,
    includedAreaHa: String(row.includedAreaHa ?? 0),
    includedLengthKm: String(row.includedLengthKm ?? 0),
    includedAltitudeM: String(row.includedAltitudeM ?? 0),
  }
}

const wholeNumber = (value: string, min: number, max: number) => {
  if (!/^\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null
}
const nonNegativeDecimal = (value: string) => {
  if (!/^\d+(\.\d+)?$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/** Mirrors the backend limits so the Admin sees the problem before the request is sent. */
export function validatePricingForm(
  form: ChecklistPricingForm,
):
  | { ok: true; value: ChecklistPricingInput }
  | { ok: false; errors: ChecklistPricingErrors } {
  const errors: ChecklistPricingErrors = {}
  const basePrice = wholeNumber(form.basePrice, 0, 9_999_999_999_999)
  const images = wholeNumber(form.includedImageCount, 0, MAX_MEDIA_COUNT)
  const videos = wholeNumber(form.includedVideoCount, 0, MAX_MEDIA_COUNT)
  const duration = form.standardVideoDurationSeconds.trim()
    ? wholeNumber(form.standardVideoDurationSeconds, 1, MAX_VIDEO_SECONDS)
    : undefined
  const includedAreaHa = nonNegativeDecimal(form.includedAreaHa ?? '0')
  const includedLengthKm = nonNegativeDecimal(form.includedLengthKm ?? '0')
  const includedAltitudeM = nonNegativeDecimal(form.includedAltitudeM ?? '0')
  if (basePrice === null) errors.basePrice = 'invalid'
  if (images === null) errors.includedImageCount = 'invalid'
  if (videos === null) errors.includedVideoCount = 'invalid'
  if (duration === null) errors.standardVideoDurationSeconds = 'invalid'
  if (includedAreaHa === null) errors.includedAreaHa = 'invalid'
  if (includedLengthKm === null) errors.includedLengthKm = 'invalid'
  if (includedAltitudeM === null) errors.includedAltitudeM = 'invalid'
  if (form.pricingProfile.length > 60 || !PROFILE.test(form.pricingProfile))
    errors.pricingProfile = 'invalid'
  if (Object.keys(errors).length) return { ok: false, errors }
  return {
    ok: true,
    value: {
      basePrice: basePrice!,
      includedImageCount: images!,
      includedVideoCount: videos!,
      // Omitted duration keeps the stored value; an empty profile clears it (the DEFAULT profile applies).
      ...(duration === undefined
        ? {}
        : { standardVideoDurationSeconds: duration }),
      pricingProfile: form.pricingProfile.trim().toUpperCase(),
      areaPricingEnabled: form.areaPricingEnabled ?? false,
      lengthPricingEnabled: form.lengthPricingEnabled ?? false,
      altitudePricingEnabled: form.altitudePricingEnabled ?? false,
      includedAreaHa: includedAreaHa!,
      includedLengthKm: includedLengthKm!,
      includedAltitudeM: includedAltitudeM!,
    },
  }
}
