import type {
  CreateOrderPayload,
  GeoJsonPolygon,
  ServiceDeliverableOption,
} from '../../api/customerApi'
import { toNumber, truncateText } from './format'
import type { ReadinessScore, FormState } from './types'

export const ORDER_TITLE_MAX_LENGTH = 255
export const DEFAULT_LATITUDE = 10.6402
export const DEFAULT_LONGITUDE = 106.6912

/** Estimated monitored area in hectares (string, 1 decimal). */
export function calcArea(radiusM: number) {
  return ((Math.PI * radiusM * radiusM) / 10000).toFixed(1)
}

/** A map's initial radius is only a drawing aid until the customer confirms the location. */
export function pricingAreaHa(form: FormState): number | undefined {
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  if (
    form.locationStatus !== 'confirmed' ||
    !form.locationConfirmedAt ||
    !form.normalizedAddress.trim() ||
    !form.latitude.trim() ||
    !form.longitude.trim() ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    !Number.isFinite(form.radiusM) ||
    form.radiusM <= 0
  )
    return undefined
  const areaHa = Number(calcArea(form.radiusM))
  return areaHa > 0 ? areaHa : undefined
}

export function buildCoverageArea(
  longitude: number,
  latitude: number,
  radiusM: number,
): GeoJsonPolygon {
  const points = 24
  const latDelta = radiusM / 111_320
  const lonDelta = radiusM / (111_320 * Math.cos((latitude * Math.PI) / 180))
  const ring: number[][] = []

  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points
    ring.push([
      Number((longitude + Math.cos(angle) * lonDelta).toFixed(7)),
      Number((latitude + Math.sin(angle) * latDelta).toFixed(7)),
    ])
  }
  ring.push(ring[0])

  return { type: 'Polygon', coordinates: [ring] }
}

/** `POST /api/orders` body (BE `OrderCreateRequest`). */
export function buildOrderPayload(input: {
  form: FormState
  score: ReadinessScore
  /** Media counted from the selected checklists; replaces the manual media type and quantity. */
  mediaTotals?: { images: number; videos: number }
  /** The service's deliverable types; used to give each requested media type its own deliverable. */
  deliverableOptions?: ServiceDeliverableOption[]
}): CreateOrderPayload {
  const { form } = input
  const totals = input.mediaTotals
  const mediaType: 'IMAGE' | 'VIDEO' = totals
    ? totals.videos > 0 && totals.images === 0
      ? 'VIDEO'
      : 'IMAGE'
    : form.mediaType
  const quantity = totals
    ? mediaType === 'VIDEO'
      ? totals.videos
      : totals.images
    : form.quantity
  const latitude = toNumber(form.latitude, DEFAULT_LATITUDE)
  const longitude = toNumber(form.longitude, DEFAULT_LONGITUDE)
  const lengthM = toNumber(form.estimatedLengthM, 0)
  const detail = {
    radiusM: form.radiusM,
    estimatedAreaHa: Number(calcArea(form.radiusM)),
    areaFiles: form.areaFiles.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      dataUrl: file.dataUrl,
    })),
    customerAttachments: form.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
      dataUrl: attachment.dataUrl,
    })),
    usagePurpose: form.usagePurpose || undefined,
    otherFlightPurpose:
      form.flightPurpose === 'OTHER'
        ? form.otherFlightPurpose.trim()
        : undefined,
    otherUsagePurpose:
      form.usagePurpose === 'OTHER' ? form.otherUsagePurpose.trim() : undefined,
    otherMonitoringRelationship:
      form.monitoringRelationship === 'OTHER'
        ? form.otherMonitoringRelationship.trim()
        : undefined,
    readinessScore: input.score.score,
  }
  const deliverableEntries = buildDeliverables({
    fallbackTypeId: form.deliverableTypeId,
    options: input.deliverableOptions ?? [],
    totals,
    mediaType,
    quantity,
    detail,
  })
  return {
    title: truncateText(form.title, ORDER_TITLE_MAX_LENGTH),
    description: form.description.trim() || undefined,
    serviceId: form.serviceId,
    usagePurpose: form.usagePurpose || undefined,
    flightPurpose: form.flightPurpose,
    address: form.address.trim(),
    longitude,
    latitude,
    altitudeM: form.altitudeM,
    estimatedLengthM: lengthM > 0 ? lengthM : undefined,
    siteContactName: form.siteContactName.trim() || undefined,
    siteContactPhone: form.siteContactPhone.trim() || undefined,
    accessNotes: buildAccessNotes(form),
    monitoringRelationship: form.monitoringRelationship || undefined,
    monitoringAuthorizationConfirmed: form.monitoringAuthorizationConfirmed,
    monitoringAuthorizationDocuments:
      form.monitoringAuthorizationDocuments.length > 0
        ? form.monitoringAuthorizationDocuments.map((document) => ({
            id: document.id,
            documentType: document.documentType,
            documentName: document.documentName.trim(),
            fileName: document.fileName,
            contentType: document.contentType,
            sizeBytes: document.sizeBytes,
            dataUrl: document.dataUrl,
            notes: document.notes.trim() || undefined,
          }))
        : undefined,
    coverageArea: buildCoverageArea(longitude, latitude, form.radiusM),
    preferredDateFrom: form.preferredDateFrom,
    preferredDateTo: form.preferredDateTo,
    preferredTimeId: form.preferredTimeId,
    recurrenceType: form.recurrenceType,
    recurrenceOccurrences:
      form.recurrenceType === 'NONE' ? undefined : form.recurrenceOccurrences,
    weatherFallback: form.weatherFallback,
    resultDeadline: form.resultDeadline || undefined,
    resultFormats: form.resultFormats,
    deliveryMethods: form.deliveryMethods,
    dataRetentionDays: form.dataRetentionDays,
    termsAccepted: form.termsAccepted,
    deliverables: deliverableEntries,
  }
}

const PHOTO_TYPE = /ảnh|photo|image/i
const VIDEO_TYPE = /video/i

/**
 * One deliverable per requested media type (photos and videos each get their own type and quantity), so an order that asks
 * for both is not described as photos only. The heavy site detail (area files, attachments, ...) travels once, on the first.
 */
function buildDeliverables(input: {
  fallbackTypeId: string
  options: ServiceDeliverableOption[]
  totals?: { images: number; videos: number }
  mediaType: 'IMAGE' | 'VIDEO'
  quantity: number
  detail: Record<string, unknown>
}) {
  const { totals, options, fallbackTypeId } = input
  const find = (pattern: RegExp) =>
    options.find((o) => pattern.test(o.deliverableTypeName ?? ''))
      ?.deliverableTypeId
  if (!totals || (totals.images === 0 && totals.videos === 0))
    return [
      {
        deliverableTypeId: fallbackTypeId,
        requirement: {
          mediaType: input.mediaType,
          quantity: input.quantity,
          ...input.detail,
        },
      },
    ]
  const entries: { type: string; requirement: Record<string, unknown> }[] = []
  const add = (type: string, requirement: Record<string, unknown>) => {
    const same = entries.find((e) => e.type === type)
    if (same) Object.assign(same.requirement, requirement)
    else entries.push({ type, requirement })
  }
  if (totals.images > 0)
    add(find(PHOTO_TYPE) ?? fallbackTypeId, {
      mediaType: 'IMAGE',
      quantity: totals.images,
      imageQuantity: totals.images,
      videoQuantity: 0,
    })
  if (totals.videos > 0)
    add(find(VIDEO_TYPE) ?? fallbackTypeId, {
      mediaType: 'VIDEO',
      quantity: totals.videos,
      videoQuantity: totals.videos,
      ...(entries.some((e) => e.type === (find(VIDEO_TYPE) ?? fallbackTypeId))
        ? {}
        : { imageQuantity: 0 }),
    })
  return entries.map((entry, index) => ({
    deliverableTypeId: entry.type,
    requirement: {
      ...entry.requirement,
      ...(index === 0 ? input.detail : {}),
    },
  }))
}

function buildAccessNotes(form: FormState): string | undefined {
  return form.accessNotes.trim() || undefined
}
