import type { ChecklistInput } from '../checklist/types'
import { describe, expect, it } from 'vitest'

import { createDefaultForm } from './draftStorage'
import {
  AI_IMAGE_ANALYSIS_DESCRIPTION,
  buildCoverageArea,
  buildOrderPayload,
  calcArea,
  syncAiAddonDescription,
  withAdditionalRequirementChecklist,
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

describe('syncAiAddonDescription', () => {
  it('appends and removes the add-on sentence idempotently', () => {
    const added = syncAiAddonDescription('Mô tả', true)
    expect(added).toBe(`Mô tả\n${AI_IMAGE_ANALYSIS_DESCRIPTION}`)
    expect(syncAiAddonDescription(added, true)).toBe(added)
    expect(syncAiAddonDescription(added, false)).toBe('Mô tả')
  })
})

describe('withAdditionalRequirementChecklist', () => {
  it('adds the AI add-on as a customer requirement for manager pricing review', () => {
    expect(
      withAdditionalRequirementChecklist(
        [
          {
            sourceChecklistId: 'default',
            expectedChecklistVersion: 1,
            minimumEvidenceCount: 1,
            requiredEvidenceType: 'IMAGE',
          },
        ],
        true,
      ),
    ).toEqual([
      {
        sourceChecklistId: 'default',
        expectedChecklistVersion: 1,
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE',
      },
      {
        contentOverride:
          'AI phân tích hình ảnh để hỗ trợ phát hiện và đánh dấu các dấu hiệu bất thường.',
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE',
      },
    ])
  })

  it('does not add the requirement when unselected or already present', () => {
    const item: ChecklistInput = {
      contentOverride:
        'AI phân tích hình ảnh để hỗ trợ phát hiện và đánh dấu các dấu hiệu bất thường.',
      minimumEvidenceCount: 1,
      requiredEvidenceType: 'IMAGE',
    }
    expect(withAdditionalRequirementChecklist([item], false)).toEqual([item])
    expect(withAdditionalRequirementChecklist([item], true)).toEqual([item])
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
      aiAnalysisRequested: false,
      pricingEstimate: null,
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
      additionalRequirements: [],
    })
  })

  it('sends the flight purpose, defaulting to surveying and monitoring', () => {
    const base = { score, aiAnalysisRequested: false, pricingEstimate: null }
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
      aiAnalysisRequested: false,
      pricingEstimate: null,
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
    const base = { score, aiAnalysisRequested: false, pricingEstimate: null }
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

  it('includes the AI add-on price when requested', () => {
    const payload = buildOrderPayload({
      form,
      score,
      aiAnalysisRequested: true,
      pricingEstimate: {
        serviceId: 'svc-1',
        servicePrice: 100,
        totalPrice: 150,
        additionalRequirements: [
          { type: 'AI_IMAGE_ANALYSIS', description: 'x', additionalPrice: 50 },
        ],
      },
    })
    const requirement = payload.deliverables[0].requirement as {
      additionalRequirements: Array<{ additionalPrice: number }>
    }
    expect(requirement.additionalRequirements[0].additionalPrice).toBe(50)
  })
})
