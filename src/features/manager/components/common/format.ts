import { localizeMediaType } from '../../lib/viLabels'
import type { OrderReviewMessages } from '../../pages/OrderReview/OrderReviewPage.messages'

export function formatVn(iso: string, locale: 'vi-VN' | 'en-US'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  if (locale === 'en-US') {
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`
  }
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function localizeTokens(text: string): string {
  return text
    .split(' · ')
    .map((token) => localizeMediaType(token))
    .join(' · ')
}

export function humanizeMediaRequirement(
  label: string,
  t: OrderReviewMessages,
) {
  return localizeTokens(humanizeRaw(label, t))
}

function humanizeRaw(label: string, t: OrderReviewMessages) {
  const jsonStart = label.indexOf('{')
  if (jsonStart === -1) return label

  const title = label.slice(0, jsonStart).replace(/[·\s]+$/, '')
  try {
    const data = JSON.parse(label.slice(jsonStart)) as Record<string, unknown>
    const parts = [
      typeof data.mediaType === 'string' ? data.mediaType : null,
      typeof data.quantity === 'number' ? t.unit.items(data.quantity) : null,
      typeof data.resolution === 'string' ? data.resolution : null,
      typeof data.radiusM === 'number' ? `${data.radiusM} m` : null,
      typeof data.estimatedAreaHa === 'number'
        ? `${data.estimatedAreaHa} ha`
        : null,
    ].filter(Boolean)
    return parts.length > 0 ? `${title} · ${parts.join(' · ')}` : title
  } catch {
    return title || label
  }
}

/** Area (hectares) of the circular monitoring zone, derived from its radius. */
export function estimatedAreaHa(radiusM: number | null): number | null {
  if (radiusM == null || !Number.isFinite(radiusM) || radiusM <= 0) return null
  return Math.round(((Math.PI * radiusM * radiusM) / 10000) * 10) / 10
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `#06249447` for UUID ids, `#ORD-…` for human codes. */
export function formatOrderCode(code: string): string {
  return UUID_RE.test(code) ? `#${code.slice(0, 8)}` : `#${code}`
}
