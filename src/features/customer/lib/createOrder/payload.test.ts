import { describe, expect, it } from 'vitest'

import { createDefaultForm } from './draftStorage'
import {
  buildCoverageArea,
  buildOrderPayload,
  calcArea,
} from './payload'
import { truncateText } from './format'

describe('buildCoverageArea', () => {
  it('builds a closed 24-point ring around the centre', () => {
    const area = buildCoverageArea(106.7, 10.6, 300)
    const ring = area.coordinates[0]
    expect(area.type).toBe('Polygon')
    expect(ring).toHaveLength(25)
    expect(ring[0]).toEqual(ring[24])
    expect(Math.max(...ring.map((p) => p[0]))).toBeGreaterThan(106.7)
  })
})

describe('calcArea', () => {
  it('returns hectares with one decimal', () => {
    expect(calcArea(100)).toBe('3.1')
  })
})

describe('truncateText', () => {
  it('truncates with an ellipsis', () => {
    expect(truncateText('abcdefghij', 6)).toBe('abc...')
    expect(truncateText('  abc ', 10)).toBe('abc')
  })
})

describe('buildOrderPayload', () => {
  const form = {
    ...createDefaultForm(),
    title: ' Giám sát ',
    address: ' KCN ',
    serviceId: 'svc-1',
    preferredTimeId: 'pt-1',
    deliverableTypeId: 'dt-1',
    attachments: [
      {
        id: 'att-1',
        fileName: 'site.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 123,
        dataUrl: 'data:image/jpeg;base64,abc',
      },
    ],
  }
  const score = { score: 90, level: 'good' as const, notes: [] }

  it('maps the form to the BE OrderCreateRequest shape', () => {
    const payload = buildOrderPayload({
      form,
      score,
    })
    expect(payload).toMatchObject({
      title: 'Giám sát',
      address: 'KCN',
      serviceId: 'svc-1',
      preferredTimeId: 'pt-1',
      description: undefined,
    })
    expect(payload.deliverables).toHaveLength(1)
    expect(payload.deliverables[0].deliverableTypeId).toBe('dt-1')
    expect(payload.deliverables[0].requirement).toMatchObject({
      readinessScore: 90,
      customerAttachments: [
        {
          id: 'att-1',
          fileName: 'site.jpg',
          contentType: 'image/jpeg',
          sizeBytes: 123,
          dataUrl: 'data:image/jpeg;base64,abc',
        },
      ],
    })
  })

  it('sends the flight purpose, defaulting to surveying and monitoring', () => {
    const base = { score }
    expect(createDefaultForm().flightPurpose).toBe('SURVEY_MONITORING')
    expect(buildOrderPayload({ ...base, form }).flightPurpose).toBe(
      'SURVEY_MONITORING',
    )
    expect(
      buildOrderPayload({
        ...base,
        form: { ...form, flightPurpose: 'AGRICULTURE' },
      }).flightPurpose,
    ).toBe('AGRICULTURE')
  })

  it('preserves the details entered for Other options', () => {
    const payload = buildOrderPayload({
      form: {
        ...form,
        flightPurpose: 'OTHER',
        otherFlightPurpose: 'Bay kiểm kê mái pin mặt trời',
        usagePurpose: 'OTHER',
        otherUsagePurpose: 'Đào tạo nội bộ',
        monitoringRelationship: 'OTHER',
        otherMonitoringRelationship: 'Đơn vị bảo trì hệ thống',
      },
      score,
    })

    expect(payload).toMatchObject({
      flightPurpose: 'OTHER',
      usagePurpose: 'OTHER',
      monitoringRelationship: 'OTHER',
    })
    expect(payload.deliverables[0].requirement).toMatchObject({
      otherFlightPurpose: 'Bay kiểm kê mái pin mặt trời',
      otherUsagePurpose: 'Đào tạo nội bộ',
      otherMonitoringRelationship: 'Đơn vị bảo trì hệ thống',
    })
  })

  it('sends schedule preferences and drops the count when not repeating', () => {
    const base = { score }
    const once = buildOrderPayload({
      ...base,
      form: {
        ...form,
        recurrenceType: 'NONE',
        recurrenceOccurrences: 9,
        weatherFallback: 'AUTO_RESCHEDULE',
        resultDeadline: '',
      },
    })
    expect(once).toMatchObject({
      recurrenceType: 'NONE',
      weatherFallback: 'AUTO_RESCHEDULE',
    })
    expect(once.recurrenceOccurrences).toBeUndefined()
    expect(once.resultDeadline).toBeUndefined()
    const weekly = buildOrderPayload({
      ...base,
      form: {
        ...form,
        recurrenceType: 'WEEKLY',
        recurrenceOccurrences: 4,
        resultDeadline: '2026-10-20',
      },
    })
    expect(weekly).toMatchObject({
      recurrenceType: 'WEEKLY',
      recurrenceOccurrences: 4,
      resultDeadline: '2026-10-20',
    })
  })

})
