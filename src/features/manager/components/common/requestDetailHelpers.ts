import type { DetailItem } from './requestDetailTypes'
import type { OrderDetail } from '../../types/orders'
import { getLanguage } from '../../../../shared/i18n'
import { formatVn } from './format'
import { requestDetailHelpersMessages } from './requestDetailHelpers.messages'

const localeNow = () => (getLanguage() === 'en' ? 'en-US' : 'vi-VN')
const msgs = () => requestDetailHelpersMessages[getLanguage()]

export const enumLabels: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get: (_target, key) =>
      typeof key === 'string' ? msgs().enumLabels[key] : undefined,
    has: (_target, key) => typeof key === 'string' && key in msgs().enumLabels,
    ownKeys: () => Reflect.ownKeys(msgs().enumLabels),
    getOwnPropertyDescriptor: (_target, key) => ({
      enumerable: true,
      configurable: true,
      value: typeof key === 'string' ? msgs().enumLabels[key] : undefined,
    }),
  },
)

export function text(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? (enumLabels[trimmed] ?? trimmed) : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? msgs().yes : msgs().no
  return null
}

export function list(values: string[] | null | undefined): string | null {
  if (!values || values.length === 0) return null
  return values.map((value) => text(value) ?? value).join(', ')
}

export function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatVn(value, localeNow()).split(' ')[0]
}

export function dateTime(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatVn(value, localeNow())
}

export function visibleItems(items: DetailItem[]) {
  return items.filter((item) => item.value != null && item.value !== '')
}

export function requirementValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const values = value.map(requirementValue).filter(Boolean)
    return values.length ? values.join(', ') : null
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const parts = [
      text(record.type),
      text(record.description),
      record.additionalPrice != null
        ? `${text(record.additionalPrice)} ${msgs().currencySuffix}`
        : null,
      text(record.fileName ?? record.name),
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
  }
  return text(value)
}

export function mediaTypeFromTitle(title: string | null | undefined) {
  const normalized = title?.trim().toLowerCase() ?? ''
  if (normalized.includes('video')) return msgs().mediaVideo
  if (
    normalized.includes('ảnh') ||
    normalized.includes('hình') ||
    normalized.includes('photo') ||
    normalized.includes('image')
  ) {
    return msgs().mediaPhoto
  }
  if (normalized.includes('báo cáo') || normalized.includes('report')) {
    return msgs().mediaReport
  }
  return null
}

export function formatMoney(value: unknown) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : null
  return amount != null && Number.isFinite(amount)
    ? amount.toLocaleString(localeNow()) + ` ${msgs().currencySuffix}`
    : text(value)
}

export function numberText(value: unknown): string | null {
  const valueText = text(value)
  return valueText && valueText !== '0' ? valueText : null
}

export function deliverableSummary(
  requirement: Record<string, unknown> | null,
  deliverableName?: string | null,
) {
  if (!requirement) return []
  // The deliverable heading already communicates its media type (for example,
  // "Video"). Only fall back to the requirement media type for generic names.
  const type = mediaTypeFromTitle(deliverableName)
    ? null
    : text(requirement.mediaType)
  return [
    type,
    numberText(requirement.quantity)
      ? msgs().itemsCount(numberText(requirement.quantity) as string)
      : null,
    text(requirement.resolution),
  ].filter((item): item is string => Boolean(item))
}

export function resultFormatsFromDeliverables(
  order: OrderDetail,
): string | null {
  const formats =
    order.deliverables
      ?.map((deliverable) => {
        const fromName = mediaTypeFromTitle(deliverable.deliverableTypeName)
        if (fromName) return fromName
        return text(deliverable.requirement?.mediaType)
      })
      .filter((item): item is string => Boolean(item)) ?? []

  const uniqueFormats = [...new Set(formats)]
  return uniqueFormats.length > 0 ? uniqueFormats.join(', ') : null
}

export function addOnItems(
  requirement: Record<string, unknown> | null,
): string[] {
  const value = requirement?.additionalRequirements
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => {
      if (!item || typeof item !== 'object') return true
      // Keep historical order payloads from showing the retired AI add-on.
      return (item as Record<string, unknown>).type !== 'AI_IMAGE_ANALYSIS'
    })
    .map((item) => {
      if (!item || typeof item !== 'object') return requirementValue(item)
      const record = item as Record<string, unknown>
      const title = text(record.type) ?? msgs().extraRequirement
      const description = text(record.description)
      const price = formatMoney(record.additionalPrice)
      return [title, description, price].filter(Boolean).join(' · ')
    })
    .filter((item): item is string => Boolean(item))
}
