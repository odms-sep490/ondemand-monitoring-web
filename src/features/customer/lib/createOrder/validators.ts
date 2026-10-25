import type { FormErrors, FormState, Step } from './types'
import { isInsideHcmcServiceArea } from '../../../../shared/lib/serviceArea'
import { todayPlus } from './format'

export const ALTITUDE_MIN = 10
export const ALTITUDE_MAX = 120
const LENGTH_MAX = 100_000
const PHONE_PATTERN = /^[+0-9 ().-]{8,20}$/

export type ValidationMessages = {
  address: string
  latitude: string
  longitude: string
  locationUnconfirmed: string
  outsideZone: string
  blockedZone: (zoneNames: string) => string
  serviceId: string
  title: string
  preferredDateFrom: string
  preferredDateTooSoon: string
  preferredDateTo: string
  preferredDateOrder: string
  preferredTimeId: string
  resultDeadline: string
  recurrenceOccurrences: string
  deliverableTypeId: string
  resultFormats: string
  deliveryMethods: string
  termsAccepted: string
  altitudeM: string
  estimatedLengthM: string
  siteContactPhone: string
  siteContactName: string
  siteContactPhoneRequired: string
  accessNotes: string
  permitStatus: (zoneName: string) => string
  permitNumber: string
  permitDocuments: string
  permitExpiresOn: string
  permitExpired: string
  monitoringRelationship: string
  otherFlightPurpose: string
  otherUsagePurpose: string
  otherMonitoringRelationship: string
  monitoringAuthorizationConfirmed: string
  monitoringAuthorizationDocuments: string
}

export type LocationCheck = {
  monitoringValid: boolean
  blockedZoneNames: string[]
}

/**
 * Cumulative validation: step N also checks every earlier step.
 * Steps: 1 service + title, 2 location, 3 monitoring content (validated by the
 * checklist hook), 4 site details and authorization, 5 schedule, 6 deliverables.
 */
export function validateStep(
  targetStep: Step,
  form: FormState,
  location: LocationCheck,
  msg: ValidationMessages,
): FormErrors {
  const errors: FormErrors = {}
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  const validLatitude =
    Boolean(form.latitude.trim()) &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90
  const validLongitude =
    Boolean(form.longitude.trim()) &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180

  if (targetStep >= 1) {
    if (!form.serviceId) errors.serviceId = msg.serviceId
    if (!form.title.trim()) errors.title = msg.title
    if (form.flightPurpose === 'OTHER' && !form.otherFlightPurpose.trim()) {
      errors.otherFlightPurpose = msg.otherFlightPurpose
    }
    if (form.usagePurpose === 'OTHER' && !form.otherUsagePurpose.trim()) {
      errors.otherUsagePurpose = msg.otherUsagePurpose
    }
  }
  if (targetStep >= 2) {
    if (!form.address.trim()) errors.address = msg.address
    else if (form.locationStatus !== 'confirmed')
      errors.address = msg.locationUnconfirmed
    if (!validLatitude) errors.latitude = msg.latitude
    if (!validLongitude) {
      errors.longitude = msg.longitude
    }
    if (
      validLatitude &&
      validLongitude &&
      !isInsideHcmcServiceArea({ latitude, longitude })
    ) {
      errors.address = msg.outsideZone
    }
    if (!location.monitoringValid) errors.address = msg.locationUnconfirmed
    if (location.blockedZoneNames.length > 0) {
      errors.address = msg.blockedZone(location.blockedZoneNames.join(', '))
    }
  }
  if (targetStep >= 4) {
    if (
      !Number.isFinite(form.altitudeM) ||
      form.altitudeM < ALTITUDE_MIN ||
      form.altitudeM > ALTITUDE_MAX
    ) {
      errors.altitudeM = msg.altitudeM
    }
    const length = form.estimatedLengthM.trim()
    if (length && !(Number(length) > 0 && Number(length) <= LENGTH_MAX)) {
      errors.estimatedLengthM = msg.estimatedLengthM
    }
    const phone = form.siteContactPhone.trim()
    if (!form.siteContactName.trim())
      errors.siteContactName = msg.siteContactName
    if (!phone) errors.siteContactPhone = msg.siteContactPhoneRequired
    else if (!PHONE_PATTERN.test(phone))
      errors.siteContactPhone = msg.siteContactPhone
    if (!form.accessNotes.trim()) errors.accessNotes = msg.accessNotes
    if (!form.monitoringRelationship) {
      errors.monitoringRelationship = msg.monitoringRelationship
    }
    if (
      form.monitoringRelationship === 'OTHER' &&
      !form.otherMonitoringRelationship.trim()
    ) {
      errors.otherMonitoringRelationship = msg.otherMonitoringRelationship
    }
    if (!form.monitoringAuthorizationConfirmed) {
      errors.monitoringAuthorizationConfirmed =
        msg.monitoringAuthorizationConfirmed
    }
    if (
      form.monitoringAuthorizationDocuments.some(
        (document) =>
          !document.documentName.trim() ||
          !document.fileName ||
          !document.dataUrl,
      )
    ) {
      errors.monitoringAuthorizationDocuments =
        msg.monitoringAuthorizationDocuments
    }
    if (
      validLatitude &&
      validLongitude &&
      form.permitStatus === 'HAVE_PERMIT'
    ) {
      if (!form.permitNumber.trim()) errors.permitNumber = msg.permitNumber
      if (form.permitDocuments.length === 0)
        errors.permitDocuments = msg.permitDocuments
      if (!form.permitExpiresOn) errors.permitExpiresOn = msg.permitExpiresOn
      else if (
        form.preferredDateTo &&
        form.permitExpiresOn < form.preferredDateTo
      ) {
        errors.permitExpiresOn = msg.permitExpired
      }
    }
  }
  if (targetStep >= 5) {
    if (!form.preferredDateFrom)
      errors.preferredDateFrom = msg.preferredDateFrom
    else if (form.preferredDateFrom < todayPlus(7)) {
      errors.preferredDateFrom = msg.preferredDateTooSoon
    }
    if (!form.preferredDateTo) errors.preferredDateTo = msg.preferredDateTo
    if (
      form.preferredDateFrom &&
      form.preferredDateTo &&
      form.preferredDateFrom > form.preferredDateTo
    ) {
      errors.preferredDateTo = msg.preferredDateOrder
    }
    if (!form.preferredTimeId) errors.preferredTimeId = msg.preferredTimeId
    if (
      form.resultDeadline &&
      form.preferredDateTo &&
      form.resultDeadline < form.preferredDateTo
    ) {
      errors.resultDeadline = msg.resultDeadline
    }
    if (
      form.recurrenceType !== 'NONE' &&
      !(
        Number.isInteger(form.recurrenceOccurrences) &&
        form.recurrenceOccurrences >= 2 &&
        form.recurrenceOccurrences <= 52
      )
    ) {
      errors.recurrenceOccurrences = msg.recurrenceOccurrences
    }
  }
  if (targetStep >= 6) {
    if (!form.deliverableTypeId) {
      errors.deliverableTypeId = msg.deliverableTypeId
    }
    if (form.resultFormats.length === 0)
      errors.resultFormats = msg.resultFormats
    if (form.deliveryMethods.length === 0)
      errors.deliveryMethods = msg.deliveryMethods
    if (!form.termsAccepted) errors.termsAccepted = msg.termsAccepted
  }
  return errors
}
