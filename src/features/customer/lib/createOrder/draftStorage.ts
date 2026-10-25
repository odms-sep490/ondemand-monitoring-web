import { todayPlus } from './format'
import {
  DELIVERY_METHODS,
  RESULT_FORMATS,
  type DeliveryMethod,
  type FormState,
  type ResultFormat,
  type Step,
  type StoredCreateOrderDraft,
} from './types'

export const CREATE_ORDER_DRAFT_STORAGE_KEY = 'odm.customer.createOrderDraft.v2'

export function createDefaultForm(): FormState {
  return {
    title: '',
    usagePurpose: '',
    flightPurpose: 'SURVEY_MONITORING',
    otherFlightPurpose: '',
    otherUsagePurpose: '',
    description: '',
    address: '',
    normalizedAddress: '',
    latitude: '10.6402',
    longitude: '106.6912',
    locationStatus: 'unconfirmed',
    locationSource: '',
    locationConfirmedAt: '',
    radiusM: 300,
    monitoringRelationship: '',
    otherMonitoringRelationship: '',
    monitoringAuthorizationConfirmed: false,
    monitoringAuthorizationDocuments: [],
    altitudeM: 60,
    estimatedLengthM: '',
    siteContactName: '',
    siteContactPhone: '',
    accessNotes: '',
    permitStatus: 'NONE',
    permitNumber: '',
    permitExpiresOn: '',
    permitDocuments: [],
    areaFiles: [],
    serviceId: '',
    preferredDateFrom: todayPlus(7),
    preferredDateTo: todayPlus(7),
    preferredTimeId: '',
    recurrenceType: 'NONE',
    recurrenceOccurrences: 4,
    weatherFallback: 'CONTACT_CUSTOMER',
    resultDeadline: '',
    deliverableTypeId: '',
    mediaType: 'IMAGE',
    quantity: 10,
    resolution: '4K',
    resultFormats: ['PHOTO'],
    deliveryMethods: ['DOWNLOAD'],
    dataRetentionDays: 90,
    termsAccepted: false,
    attachments: [],
  }
}

export function isStep(value: unknown): value is Step {
  return (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6
  )
}

export function readStoredDraft(): StoredCreateOrderDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as StoredCreateOrderDraft
    if (!draft.form) return draft
    return {
      ...draft,
      form: {
        ...draft.form,
        // Drafts saved before permit evidence existed have neither field.
        flightPurpose:
          draft.form.flightPurpose === 'AGRICULTURE'
            ? 'SURVEY_MONITORING'
            : (draft.form.flightPurpose ?? 'SURVEY_MONITORING'),
        otherFlightPurpose: draft.form.otherFlightPurpose ?? '',
        otherUsagePurpose: draft.form.otherUsagePurpose ?? '',
        permitExpiresOn: draft.form.permitExpiresOn ?? '',
        permitDocuments: draft.form.permitDocuments ?? [],
        monitoringRelationship: draft.form.monitoringRelationship ?? '',
        otherMonitoringRelationship:
          draft.form.otherMonitoringRelationship ?? '',
        monitoringAuthorizationConfirmed:
          draft.form.monitoringAuthorizationConfirmed ?? false,
        monitoringAuthorizationDocuments:
          draft.form.monitoringAuthorizationDocuments ?? [],
        normalizedAddress: draft.form.normalizedAddress ?? '',
        locationStatus:
          draft.form.locationStatus === 'confirmed' &&
          Boolean(draft.form.locationConfirmedAt) &&
          Boolean(draft.form.normalizedAddress)
            ? 'confirmed'
            : 'unconfirmed',
        locationSource:
          draft.form.locationStatus === 'confirmed'
            ? (draft.form.locationSource ?? 'restored')
            : '',
        locationConfirmedAt: draft.form.locationConfirmedAt ?? '',
        resultFormats: draft.form.resultFormats.filter((value) =>
          RESULT_FORMATS.includes(value as ResultFormat),
        ) as ResultFormat[],
        deliveryMethods: draft.form.deliveryMethods.filter((value) =>
          DELIVERY_METHODS.includes(value as DeliveryMethod),
        ) as DeliveryMethod[],
      },
    }
  } catch {
    return null
  }
}

export function writeStoredDraft(draft: StoredCreateOrderDraft) {
  try {
    window.localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify(draft),
    )
  } catch {
    // Storage may be full or blocked; the draft is a convenience only.
  }
}

export function clearStoredDraft() {
  try {
    window.localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
