import { describe, expect, it } from 'vitest'

import type { OrderCreateResponse } from '../../api/orderApi'
import {
  buildTimeline,
  normalizeStatus,
  shortOrderCode,
  toDeliverableView,
  toOrderDetail,
  toOrderRow,
} from './mapOrder'

const be: OrderCreateResponse = {
  id: '3f2b9c1e-aaaa-bbbb-cccc-1234567890ab',
  customerId: 'c-1',
  title: 'Kiểm tra mái',
  serviceName: 'Giám sát công trình',
  address: 'KCN Long Hậu',
  latitude: 10.5,
  longitude: 106.6,
  radiusM: 300,
  preferredDateFrom: '2026-10-01',
  preferredDateTo: '2026-10-05',
  preferredTimeName: 'Chiều',
  orderStatus: 'PENDING',
  createdAt: '2026-09-28T02:00:00Z',
  updatedAt: '2026-09-28T02:00:00Z',
  deliverables: [
    {
      id: 'd-1',
      deliverableTypeId: 'dt-photo',
      deliverableTypeName: 'Ảnh chụp',
      defaultFormat: 'JPG',
      requirement: {
        mediaType: 'IMAGE',
        quantity: 10,
        aiAnalysisRequested: true,
        additionalRequirements: [{ type: 'AI_IMAGE_ANALYSIS' }],
      },
    },
  ],
}

describe('normalizeStatus', () => {
  it('keeps every supported status and falls back to PENDING', () => {
    for (const status of ['PENDING', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
      expect(normalizeStatus(status)).toBe(status)
    }
    expect(normalizeStatus(undefined)).toBe('PENDING')
    expect(normalizeStatus('WHATEVER')).toBe('PENDING')
  })
})

describe('shortOrderCode', () => {
  it('shortens uuids and keeps short ids', () => {
    expect(shortOrderCode(be.id)).toBe('3F2B9C1E')
    expect(shortOrderCode('ord-1')).toBe('ord-1')
  })
})

describe('toOrderRow', () => {
  it('flattens the BE order and nulls missing values', () => {
    expect(toOrderRow(be)).toMatchObject({
      id: be.id,
      code: 'ORD-3F2B9C1E',
      title: 'Kiểm tra mái',
      address: 'KCN Long Hậu',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-05',
      timeName: 'Chiều',
      serviceName: 'Giám sát công trình',
      status: 'PENDING',
      radiusM: 300,
    })
    const bare = toOrderRow({ id: 'x', customerId: 'c' })
    expect(bare).toMatchObject({ title: 'ORD-X', address: null, dateFrom: null, serviceName: null })
  })
})

describe('toDeliverableView', () => {
  it('hides internal requirement keys and detects the AI add-on', () => {
    const view = toDeliverableView(be.deliverables![0])
    expect(view.name).toBe('Ảnh chụp')
    expect(view.format).toBe('JPG')
    expect(view.requirements).toEqual([
      { key: 'mediaType', value: 'IMAGE' },
      { key: 'quantity', value: '10' },
      { key: 'additionalRequirements', value: 'AI_IMAGE_ANALYSIS' },
    ])
    expect(view.aiAnalysisRequested).toBe(true)
  })
})

describe('buildTimeline', () => {
  it('only has the created event for a pending order', () => {
    expect(buildTimeline(be).map((e) => e.kind)).toEqual(['created'])
  })

  it('adds the review with its actor when rejected', () => {
    const events = buildTimeline({
      ...be,
      orderStatus: 'REJECTED',
      reviewAt: '2026-09-29T01:00:00Z',
      reviewByName: 'Staff',
      rejectReason: 'Vùng cấm',
    })
    expect(events[1]).toMatchObject({ kind: 'rejected', actor: 'Staff', at: '2026-09-29T01:00:00Z' })
  })

  it('adds the current status for in-progress orders', () => {
    const events = buildTimeline({ ...be, orderStatus: 'IN_PROGRESS' })
    expect(events[events.length - 1]).toMatchObject({ kind: 'status', status: 'IN_PROGRESS' })
  })
})

describe('toOrderDetail', () => {
  it('maps fields from the backend without inventing action flags', () => {
    expect(toOrderDetail(be)).toMatchObject({
      status: 'PENDING',
      altitudeM: null,
      resultFormats: [],
      deliveryMethods: [],
    })
  })
})
