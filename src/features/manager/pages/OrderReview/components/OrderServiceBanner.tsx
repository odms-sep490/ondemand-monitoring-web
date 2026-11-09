import type { ReactNode } from 'react'
import type { OrderDetail } from '../../../types/orders'
import {
  OrderIcon,
  type OrderIconName,
} from '../../../components/common/OrderIcon'
import { orderServiceBannerMessages } from './OrderServiceBanner.messages'
import './OrderServiceBanner.css'

export type OrderServiceBannerProps = {
  serviceName: string
  serviceDescription?: string | null
  serviceIcon?: OrderIconName | null
  /** Step info lives in the stepper; kept optional for callers. */
  currentStep?: number
  totalSteps?: number
  /** Real deliverable / result-format labels of the order. */
  deliverables?: string[] | null
  /** Label for the small "SERVICE" eyebrow, e.g. "DỊCH VỤ". */
  eyebrow: string
  /** Formats the step indicator, e.g. (1, 7) => "Bước 1/7". */
  stepLabel?: (current: number, total: number) => string
  /** Prefix for the deliverables chip, e.g. "Định dạng". */
  deliverablesLabel?: string
  /** Right-hand summary, e.g. order code and status. */
  meta?: ReactNode
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Backend deliverable names can be raw enum-like tokens (e.g. "PHOTO"). */
function localizeLabel(label: string, locale: 'vi-VN' | 'en-US') {
  const terms = orderServiceBannerMessages[locale === 'vi-VN' ? 'vi' : 'en'].terms
  return label.replace(
    /[A-Za-z0-9]+/g,
    (word) => terms[word.toUpperCase()] ?? word,
  )
}

/** Photo / video / report collapse to one kind each; anything else is its own kind. */
function resultKind(label: string) {
  const text = label.toLowerCase()
  if (/video/.test(text)) return 'video'
  if (/ảnh nhiệt|thermal/.test(text)) return 'thermal'
  if (/ảnh|photo|image/.test(text)) return 'photo'
  if (/báo cáo|report|pdf/.test(text)) return 'report'
  return text
}

/** Unique, non-empty labels of what the order actually delivers. */
export function orderDeliverableLabels(
  order: OrderDetail,
  locale: 'vi-VN' | 'en-US' = 'vi-VN',
): string[] {
  const raw = [
    ...(order.deliverables ?? []).map((d) => d.deliverableTypeName),
    ...(order.resultFormats ?? []),
  ]
  const seen = new Set<string>()
  const labels: string[] = []
  for (const item of raw) {
    const raw = clean(item)
    const label = raw ? localizeLabel(raw, locale) : null
    // "Ảnh chụp" (deliverable type) and "Ảnh" (PHOTO format) are the same result: keep one.
    const key = label ? resultKind(label) : undefined
    if (!label || !key || seen.has(key)) continue
    seen.add(key)
    labels.push(label)
  }
  return labels
}

function BannerBackground() {
  return <span className="odm-osb-bg" aria-hidden="true" />
}

function ServiceIdentity({
  name,
  description,
  icon,
  eyebrow,
}: {
  name: string
  description: string | null
  icon: OrderIconName
  eyebrow: string
}) {
  return (
    <div className="odm-osb-identity">
      <span className="odm-osb-icon" aria-hidden="true">
        <OrderIcon name={icon} size={30} />
      </span>
      <div className="odm-osb-text">
        <span className="odm-osb-eyebrow">{eyebrow}</span>
        <h2 className="odm-osb-title">{name}</h2>
        {description ? <p className="odm-osb-desc">{description}</p> : null}
      </div>
    </div>
  )
}

function ServiceDeliverableTags({
  labels,
  prefix,
}: {
  labels: string[]
  prefix?: string
}) {
  const unique = [...new Set(labels.map((l) => l.trim()).filter(Boolean))]
  if (unique.length === 0) return null
  const text = unique.join(', ')
  return (
    <ul className="odm-osb-tags">
      <li className="odm-osb-tag">{prefix ? `${prefix}: ${text}` : text}</li>
    </ul>
  )
}

export function OrderServiceBanner({
  serviceName,
  serviceDescription,
  serviceIcon,
  deliverables,
  eyebrow,
  deliverablesLabel,
  meta,
}: OrderServiceBannerProps) {
  const name = clean(serviceName)
  const labels = deliverables ?? []
  return (
    <section className="odm-osb" aria-label={name ?? eyebrow}>
      <BannerBackground />
      <div className="odm-osb-main">
        {name ? (
          <ServiceIdentity
            name={name}
            description={clean(serviceDescription)}
            icon={serviceIcon ?? 'service'}
            eyebrow={eyebrow}
          />
        ) : null}
        <ServiceDeliverableTags labels={labels} prefix={deliverablesLabel} />
      </div>
      {meta ? <div className="odm-osb-status">{meta}</div> : null}
    </section>
  )
}
