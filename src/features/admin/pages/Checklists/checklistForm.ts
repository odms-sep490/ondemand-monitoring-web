import type {
  ChecklistDefinition,
  ChecklistGuidanceInput,
  ChecklistPricingInput,
  ServiceChecklist,
  ServiceChecklistPricingInput,
} from '../../api/checklistsApi'
import {
  encodeLocalizedText,
  parseLocalizedText,
  type LocalizedText,
} from '../../../../shared/i18n'
import {
  LOCALIZED_LIMITS,
  emptyLocalized,
  validateLocalized,
} from '../../lib/localizedField'
import {
  validatePricingForm,
  type ChecklistPricingErrors,
  type ChecklistPricingForm,
} from '../../lib/checklistPricing'
import {
  inheritWhenUnchanged,
  parseOverrides,
  type OverrideForm,
} from '../../lib/serviceOverrides'

/** The service whose template the checklist is being configured in. */
export type ConfigServiceContext = {
  id: string
  name: string
  rows: ServiceChecklist[]
  row: ServiceChecklist
}

export type ChecklistPage = 'content' | 'pricing'

/**
 * Every text is bilingual. The list fields hold one line per item in each
 * language; line N in Vietnamese pairs with line N in English.
 */
export type ContentForm = {
  content: LocalizedText
  description: LocalizedText
  steps: LocalizedText
  inputs: LocalizedText
  outputs: LocalizedText
  difficulty: NonNullable<ChecklistDefinition['difficulty']>
}

/** One entry per non-empty line, trimmed; the order is the order of the lines. */
export const toLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

/** Stored list items (bilingual JSON or legacy plain text) to one line per item and language. */
export function listToLocalized(items?: string[] | null): LocalizedText {
  const parsed = (items ?? []).map((item) => parseLocalizedText(item))
  return {
    vi: parsed.map((p) => p.vi).join('\n'),
    en: parsed.map((p) => p.en).join('\n'),
  }
}

/** Pairs line N of both languages into one encoded item; a missing line stays empty. */
export function localizedToList(value: LocalizedText): string[] {
  const vi = toLines(value.vi)
  const en = toLines(value.en)
  return Array.from({ length: Math.max(vi.length, en.length) }, (_, i) =>
    encodeLocalizedText({ vi: vi[i] ?? '', en: en[i] ?? '' }),
  )
}

/** True when both languages have lines but not the same number of them. */
export const linesMismatch = (value: LocalizedText) => {
  const vi = toLines(value.vi).length
  const en = toLines(value.en).length
  return vi > 0 && en > 0 && vi !== en
}

export const initialContent = (row?: ChecklistDefinition): ContentForm => ({
  content: row ? parseLocalizedText(row.content) : emptyLocalized(),
  description: row ? parseLocalizedText(row.description) : emptyLocalized(),
  steps: listToLocalized(row?.executionSteps),
  inputs: listToLocalized(row?.inputRequirements),
  outputs: listToLocalized(row?.expectedOutputs),
  difficulty: row?.difficulty ?? 'BASIC',
})

export const initialOverrides = (link?: ServiceChecklist): OverrideForm => ({
  basePrice: link?.basePriceOverride?.toString() ?? '',
  images: link?.includedImageCountOverride?.toString() ?? '',
  videos: link?.includedVideoCountOverride?.toString() ?? '',
  profile: link?.pricingProfileOverride ?? '',
  required: link?.required === true,
})

export type ChecklistFormError =
  'required' | 'invalidPricing' | 'guidanceInvalid'

export type CollectedChecklist = {
  text: string
  definition: ChecklistPricingInput & ChecklistGuidanceInput
  override: ServiceChecklistPricingInput | null
}

export type CollectResult =
  | {
      ok: false
      page: ChecklistPage
      error: ChecklistFormError
      pricingErrors?: ChecklistPricingErrors
    }
  | ({ ok: true } & CollectedChecklist)

/** Validates the whole form and returns what to send, or the page and kind of the first problem. */
export function collectChecklistForm(input: {
  content: ContentForm
  pricing: ChecklistPricingForm
  overrides: OverrideForm
  fromService: boolean
}): CollectResult {
  const { content, pricing, overrides, fromService } = input
  if (
    validateLocalized(content.content, {
      required: true,
      maxEncoded: LOCALIZED_LIMITS.checklistContent,
    })
  )
    return { ok: false, page: 'content', error: 'required' }
  const text = encodeLocalizedText(content.content)
  // The profile is not editable here, so it must not be able to block a save.
  const checked = validatePricingForm({ ...pricing, pricingProfile: '' })
  if (!checked.ok)
    return {
      ok: false,
      page: 'pricing',
      error: 'invalidPricing',
      pricingErrors: checked.errors,
    }
  const hasDescription =
    content.description.vi.trim() || content.description.en.trim()
  const guidance = {
    description: hasDescription ? encodeLocalizedText(content.description) : '',
    executionSteps: localizedToList(content.steps),
    inputRequirements: localizedToList(content.inputs),
    expectedOutputs: localizedToList(content.outputs),
  }
  if (
    guidance.description.length > LOCALIZED_LIMITS.checklistDescription ||
    [
      guidance.executionSteps,
      guidance.inputRequirements,
      guidance.expectedOutputs,
    ].some(
      (list) =>
        list.length > 30 ||
        list.some((line) => line.length > LOCALIZED_LIMITS.checklistLine),
    )
  )
    return { ok: false, page: 'content', error: 'guidanceInvalid' }
  let override: ServiceChecklistPricingInput | null = null
  if (fromService) {
    const parsed = parseOverrides(overrides)
    if (!parsed.ok)
      return { ok: false, page: 'pricing', error: 'invalidPricing' }
    override = inheritWhenUnchanged(parsed.value, {
      basePrice: checked.value.basePrice ?? 0,
      includedImageCount: checked.value.includedImageCount ?? 0,
      includedVideoCount: checked.value.includedVideoCount ?? 0,
    })
  }
  // The pricing profile is not edited on this screen. It is left out of the request so the backend keeps the stored
  // value (sending an empty one would clear it).
  const { pricingProfile: _keptByBackend, ...rest } = checked.value
  void _keptByBackend
  return { ok: true, text, definition: { ...rest, ...guidance }, override }
}
