import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'
import type { sharedMediaTiersMessages } from './SharedMediaTiers.messages'

export type TierKind = {
  component: Extract<MediaPricingComponent, 'EXTRA_IMAGE' | 'EXTRA_VIDEO'>
  title: string
  noun: string
}

export type TierCopy = (typeof sharedMediaTiersMessages)['vi']

export const SHARED_PROFILE = 'DEFAULT'
export const TIER_COMPONENTS: TierKind['component'][] = [
  'EXTRA_IMAGE',
  'EXTRA_VIDEO',
]

/** A tier of the one list shared by every checklist: the DEFAULT profile, not tied to a checklist. */
export const isShared = (rule: PricingRule, component: MediaPricingComponent) =>
  rule.category === 'MEDIA' &&
  (rule.pricingProfile ?? '').toUpperCase() === SHARED_PROFILE &&
  !rule.checklistDefinitionId &&
  rule.mediaComponent === component

/** The shared tiers of one component with their index in the full rule list, lowest range first. */
export function sharedTiersOf(
  rules: PricingRule[],
  component: MediaPricingComponent,
) {
  return rules
    .map((rule, index) => ({ rule, index }))
    .filter((entry) => isShared(entry.rule, component))
    .sort((a, b) => (a.rule.minValue ?? 0) - (b.rule.minValue ?? 0))
}

export function tierRange(rule: PricingRule, kind: TierKind, t: TierCopy) {
  const from = (rule.minValue ?? 0) + 1
  const to = rule.maxValue
  const label = kind.component === 'EXTRA_VIDEO' ? t.videoLabel : t.imageLabel
  if (kind.component === 'EXTRA_VIDEO' && from === 1 && to === 1)
    return t.firstVideo
  if (to == null) return t.rangeFrom(label, from)
  return t.rangeBetween(label, from, to)
}

export function tierRounding(
  rounding: PricingRule['roundingMode'],
  t: TierCopy,
) {
  if (rounding === 'FLOOR') return t.roundDown
  if (rounding === 'HALF_UP') return t.roundNearest
  return t.roundUp
}
