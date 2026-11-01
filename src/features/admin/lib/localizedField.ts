import { encodeLocalizedText, type LocalizedText } from '../../../shared/i18n'
import { pricingTextToLocalized } from '../../../shared/lib/pricingPresentation'

export const emptyLocalized = (): LocalizedText => ({ vi: '', en: '' })

/**
 * Length limits of the backend text columns, applied to the ENCODED
 * `{"vi":..,"en":..}` string. Checklist limits are the ones the form already
 * enforced; the 255 limits are the default JPA column length, assumed because
 * the API documents no limit for these fields.
 */
export const LOCALIZED_LIMITS = {
  checklistContent: 500,
  checklistDescription: 4000,
  checklistLine: 500,
  serviceName: 255,
  timeslotName: 255,
  policyName: 255,
  ruleDescription: 255,
} as const

export type LocalizedIssue = 'required' | 'tooLong'

/** Both languages are required where the field is required; optional fields only check the length. */
export function validateLocalized(
  value: LocalizedText,
  opts: { required?: boolean; maxEncoded?: number },
): LocalizedIssue | null {
  const vi = value.vi.trim()
  const en = value.en.trim()
  if (opts.required && (!vi || !en)) return 'required'
  if (!vi && !en) return null
  if (opts.maxEncoded && encodeLocalizedText(value).length > opts.maxEncoded)
    return 'tooLong'
  return null
}

/** Optional field with only one language filled: a hint, never blocking. */
export function missingLanguage(value: LocalizedText): 'vi' | 'en' | null {
  const vi = value.vi.trim()
  const en = value.en.trim()
  if (vi && !en) return 'en'
  if (en && !vi) return 'vi'
  return null
}

/** A pricing rule/policy text is valid when it holds both languages within the column length. */
export function ruleTextValid(
  raw: string | null | undefined,
  maxEncoded: number = LOCALIZED_LIMITS.ruleDescription,
): boolean {
  const value = pricingTextToLocalized(raw)
  if (validateLocalized(value, { required: true }) !== null) return false
  // Engine-written legacy text keeps its own length; only bilingual text is limited here.
  return raw?.startsWith('{')
    ? encodeLocalizedText(value).length <= maxEncoded
    : true
}
