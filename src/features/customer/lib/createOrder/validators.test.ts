import { describe, expect, it } from 'vitest'

import { createDefaultForm } from './draftStorage'
import { todayPlus } from './format'
import { validateStep, type ValidationMessages } from './validators'

const msg: ValidationMessages = {
  address: 'address',
  latitude: 'latitude',
  longitude: 'longitude',
  locationUnconfirmed: 'locationUnconfirmed',
  outsideZone: 'outside',
  blockedZone: (n) => `blocked:${n}`,
  serviceId: 'service',
  title: 'title',
  otherFlightPurpose: 'otherFlightPurpose',
  otherUsagePurpose: 'otherUsagePurpose',
  preferredDateFrom: 'from',
  preferredDateTooSoon: 'tooSoon',
  preferredDateTo: 'to',
  preferredDateOrder: 'order',
  preferredTimeId: 'time',
  resultDeadline: 'deadline',
  recurrenceOccurrences: 'occurrences',
  deliverableTypeId: 'deliverable',
  resultFormats: 'formats',
  deliveryMethods: 'methods',
  termsAccepted: 'terms',
  altitudeM: 'altitude',
  estimatedLengthM: 'length',
  siteContactPhone: 'phone',
  siteContactName: 'contactName',
  siteContactPhoneRequired: 'phoneRequired',
  accessNotes: 'accessNotes',
  permitStatus: (n) => `permit:${n}`,
  permitNumber: 'permitNumber',
  permitDocuments: 'permitDocuments',
  permitExpiresOn: 'permitExpiresOn',
  permitExpired: 'permitExpired',
  monitoringRelationship: 'monitoringRelationship',
  otherMonitoringRelationship: 'otherMonitoringRelationship',
  monitoringAuthorizationConfirmed: 'monitoringAuthorizationConfirmed',
  monitoringAuthorizationDocuments: 'monitoringAuthorizationDocuments',
}
const okLocation = { monitoringValid: true, blockedZoneNames: [] }
const withService = {
  ...createDefaultForm(),
  siteContactName: 'An',
  siteContactPhone: '0901234567',
  accessNotes: 'Cổng chính',
  serviceId: 's',
  title: 't',
  monitoringRelationship: 'OWNER' as const,
  monitoringAuthorizationConfirmed: true,
  locationStatus: 'confirmed' as const,
  normalizedAddress: 'A',
  locationSource: 'search' as const,
  locationConfirmedAt: '2026-10-21T00:00:00.000Z',
}

describe('validateStep', () => {
  it('step 1 requires a service and a title', () => {
    expect(validateStep(1, createDefaultForm(), okLocation, msg)).toEqual({
      serviceId: 'service',
      title: 'title',
    })
    expect(validateStep(1, withService, okLocation, msg)).toEqual({})
  })

  it('requires details for each selected Other option', () => {
    expect(
      validateStep(
        1,
        {
          ...withService,
          flightPurpose: 'OTHER',
          usagePurpose: 'OTHER',
        },
        okLocation,
        msg,
      ),
    ).toMatchObject({
      otherFlightPurpose: 'otherFlightPurpose',
      otherUsagePurpose: 'otherUsagePurpose',
    })

    expect(
      validateStep(
        4,
        {
          ...withService,
          address: 'A',
          monitoringRelationship: 'OTHER',
        },
        okLocation,
        msg,
      ).otherMonitoringRelationship,
    ).toBe('otherMonitoringRelationship')
  })

  it('step 2 requires an address', () => {
    expect(validateStep(2, withService, okLocation, msg)).toEqual({
      address: 'address',
    })
    expect(validateStep(2, createDefaultForm(), okLocation, msg)).toEqual({
      serviceId: 'service',
      title: 'title',
      address: 'address',
    })
  })

  it('step 3 remains cumulative after the monitoring-content step', () => {
    expect(validateStep(3, withService, okLocation, msg)).toEqual({
      address: 'address',
    })
  })

  it('step 2 rejects an address or GPS edit that has not been reconfirmed', () => {
    const form = {
      ...withService,
      address: 'A',
      locationStatus: 'stale' as const,
    }
    expect(validateStep(2, form, okLocation, msg).address).toBe(
      'locationUnconfirmed',
    )
  })

  it('step 2 reports an unconfirmed location, with a known blocked zone taking precedence', () => {
    const form = { ...withService, address: 'A' }
    expect(
      validateStep(
        2,
        form,
        { monitoringValid: false, blockedZoneNames: [] },
        msg,
      ).address,
    ).toBe('locationUnconfirmed')
    expect(
      validateStep(
        2,
        form,
        { monitoringValid: false, blockedZoneNames: ['X', 'Y'] },
        msg,
      ).address,
    ).toBe('blocked:X, Y')
  })

  it('step 2 rejects non-numeric coordinates', () => {
    const form = {
      ...withService,
      address: 'A',
      latitude: 'abc',
      longitude: 'x',
    }
    const errors = validateStep(2, form, okLocation, msg)
    expect(errors.latitude).toBe('latitude')
    expect(errors.longitude).toBe('longitude')
  })

  it('step 5 checks the date order and time window', () => {
    const form = {
      ...withService,
      address: 'A',
      preferredDateFrom: todayPlus(8),
      preferredDateTo: todayPlus(7),
    }
    expect(validateStep(5, form, okLocation, msg)).toEqual({
      preferredDateTo: 'order',
      preferredTimeId: 'time',
    })
  })

  it('step 5 requires at least 7 days of advance notice', () => {
    const form = {
      ...withService,
      address: 'A',
      preferredDateFrom: todayPlus(6),
      preferredDateTo: todayPlus(7),
      preferredTimeId: 'pt',
    }
    expect(validateStep(5, form, okLocation, msg).preferredDateFrom).toBe(
      'tooSoon',
    )
  })

  it('step 6 also requires a deliverable and passes for a complete form', () => {
    const base = { ...withService, address: 'A', preferredTimeId: 'pt' }
    expect(validateStep(6, base, okLocation, msg)).toEqual({
      deliverableTypeId: 'deliverable',
      termsAccepted: 'terms',
    })
    expect(
      validateStep(
        6,
        { ...base, deliverableTypeId: 'dt', termsAccepted: true },
        okLocation,
        msg,
      ),
    ).toEqual({})
  })

  it('requires monitoring authorization before leaving the location step', () => {
    const form = {
      ...withService,
      address: 'A',
      preferredTimeId: 'pt',
      deliverableTypeId: 'dt',
      monitoringRelationship: '' as const,
      monitoringAuthorizationConfirmed: false,
    }
    expect(validateStep(4, form, okLocation, msg)).toMatchObject({
      monitoringRelationship: 'monitoringRelationship',
      monitoringAuthorizationConfirmed: 'monitoringAuthorizationConfirmed',
    })
  })

  it('step 6 requires a result format, a delivery method and accepted terms', () => {
    const base = {
      ...withService,
      address: 'A',
      preferredTimeId: 'pt',
      deliverableTypeId: 'dt',
    }
    expect(validateStep(6, base, okLocation, msg)).toEqual({
      termsAccepted: 'terms',
    })
    expect(
      validateStep(
        6,
        {
          ...base,
          termsAccepted: true,
          resultFormats: [],
          deliveryMethods: [],
        },
        okLocation,
        msg,
      ),
    ).toEqual({ resultFormats: 'formats', deliveryMethods: 'methods' })
  })

  it('step 4 validates altitude, length and contact phone', () => {
    const form = {
      ...withService,
      address: 'A',
      altitudeM: 200,
      estimatedLengthM: '-5',
      siteContactPhone: 'abc',
    }
    expect(validateStep(4, form, okLocation, msg)).toEqual({
      altitudeM: 'altitude',
      estimatedLengthM: 'length',
      siteContactPhone: 'phone',
    })
  })

  it('step 4 validates a permit only when the customer declares one', () => {
    const near = {
      ...withService,
      address: 'A',
      latitude: '10.8150',
      longitude: '106.6600',
    }
    expect(validateStep(4, near, okLocation, msg)).toEqual({})
    expect(
      validateStep(
        4,
        { ...near, permitStatus: 'NEED_SUPPORT' },
        okLocation,
        msg,
      ),
    ).toEqual({})
    expect(
      validateStep(4, { ...near, permitStatus: 'HAVE_PERMIT' }, okLocation, msg)
        .permitNumber,
    ).toBe('permitNumber')
    // A number alone is not enough: the file and a validity date are required too.
    expect(
      validateStep(
        4,
        { ...near, permitStatus: 'HAVE_PERMIT', permitNumber: 'GP-1' },
        okLocation,
        msg,
      ),
    ).toEqual({
      permitDocuments: 'permitDocuments',
      permitExpiresOn: 'permitExpiresOn',
    })
    const file = {
      id: 'f',
      fileName: 'p.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
      dataUrl: 'data:',
    }
    const complete = {
      ...near,
      permitStatus: 'HAVE_PERMIT' as const,
      permitNumber: 'GP-1',
      permitDocuments: [file],
      preferredDateTo: '2026-10-12',
    }
    expect(
      validateStep(
        4,
        { ...complete, permitExpiresOn: '2026-12-31' },
        okLocation,
        msg,
      ),
    ).toEqual({})
  })

  it('rejects a permit that expires before the flight date', () => {
    const file = {
      id: 'f',
      fileName: 'p.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
      dataUrl: 'data:',
    }
    const form = {
      ...withService,
      address: 'A',
      latitude: '10.8150',
      longitude: '106.6600',
      permitStatus: 'HAVE_PERMIT' as const,
      permitNumber: 'GP-1',
      permitDocuments: [file],
      preferredDateTo: '2026-10-12',
      permitExpiresOn: '2026-10-11',
    }
    expect(validateStep(4, form, okLocation, msg).permitExpiresOn).toBe(
      'permitExpired',
    )
  })

  it('step 5 checks the result deadline and recurrence count', () => {
    const base = {
      ...withService,
      address: 'A',
      preferredDateFrom: todayPlus(7),
      preferredDateTo: todayPlus(9),
      preferredTimeId: 't',
    }
    expect(validateStep(5, base, okLocation, msg)).toEqual({})
    expect(
      validateStep(
        5,
        { ...base, resultDeadline: todayPlus(8) },
        okLocation,
        msg,
      ).resultDeadline,
    ).toBe('deadline')
    expect(
      validateStep(
        5,
        { ...base, resultDeadline: todayPlus(9) },
        okLocation,
        msg,
      ).resultDeadline,
    ).toBeUndefined()
    const weekly = { ...base, recurrenceType: 'WEEKLY' as const }
    expect(
      validateStep(5, { ...weekly, recurrenceOccurrences: 1 }, okLocation, msg)
        .recurrenceOccurrences,
    ).toBe('occurrences')
    expect(
      validateStep(5, { ...weekly, recurrenceOccurrences: 53 }, okLocation, msg)
        .recurrenceOccurrences,
    ).toBe('occurrences')
    expect(
      validateStep(5, { ...weekly, recurrenceOccurrences: 4 }, okLocation, msg)
        .recurrenceOccurrences,
    ).toBeUndefined()
    // A stale count is ignored while the request does not repeat.
    expect(
      validateStep(5, { ...base, recurrenceOccurrences: 1 }, okLocation, msg)
        .recurrenceOccurrences,
    ).toBeUndefined()
  })
})
