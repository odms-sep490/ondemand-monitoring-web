import type { ChecklistPriceBreakdown } from '../../../../shared/api/checklistPricingApi'

const MEDIA = new Set([
  'INCLUDED_IMAGE',
  'INCLUDED_VIDEO',
  'EXTRA_IMAGE',
  'EXTRA_VIDEO',
])

/** Work and media are shown as two figures; every line of the breakdown belongs to exactly one of them. */
export function splitWorkAndMedia(row: ChecklistPriceBreakdown) {
  let work = 0
  let media = 0
  for (const line of row.lines) {
    if (MEDIA.has(line.component)) media += line.amount
    else work += line.amount
  }
  return { work, media }
}

/** True when media was requested but all of it fits the included allowance, so nothing extra is charged. */
export function isWithinAllowance(row: ChecklistPriceBreakdown) {
  const extra = row.extraImageCount > 0 || row.extraVideoCount > 0
  return (row.requestedImageCount > 0 || row.requestedVideoCount > 0) && !extra
}
