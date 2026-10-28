import { afterEach, describe, expect, it } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { ordersApi } from './ordersApi'

describe('ordersApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('getQueue resolves the 6 PENDING rows', async () => {
    setHttpTransport(mockFetch)
    const rows = await ordersApi.getQueue()
    expect(rows).toHaveLength(6)
    expect(rows[0].id).toBe('ord-2609-0157')
  })

  it('getOrder resolves full detail', async () => {
    setHttpTransport(mockFetch)
    const detail = await ordersApi.getOrder('ord-2609-0157')
    expect(detail.customer.fullName).toBe('Lê Quốc Bảo')
    expect(detail.radiusM).toBe(600)
  })

  it('maps the backend order DTO to the existing review UI', async () => {
    setHttpTransport(async () => new Response(JSON.stringify({ success: true, data: {
      id: 'order-real', customerId: 'customer-1', customerName: 'Khách hàng A',
      title: 'Chụp ảnh', serviceId: 'service-1', serviceName: 'Giám sát', description: 'Kiểm tra',
      address: 'Khu A', latitude: 10.6, longitude: 106.7, radiusM: 250,
      coverageArea: null, preferredDateFrom: '2026-09-24', preferredDateTo: '2026-09-24',
      preferredTimeId: 'morning', preferredTimeName: 'Buổi sáng',
      orderStatus: 'PENDING', rejectReason: null, reviewById: null, reviewByName: null, reviewAt: null,
      createdAt: '2026-09-24T08:00:00Z', updatedAt: '2026-09-24T08:00:00Z', deliverables: [],
    } }), { status: 200 }))
    const detail = await ordersApi.getOrder('order-real')
    expect(detail.customer.fullName).toBe('Khách hàng A')
    expect(detail.center).toEqual({ lat: 10.6, lon: 106.7 })
    expect(detail.radiusM).toBe(250)
    expect(detail.code).toBe('order-real')
  })

  it('formats backend deliverable requirements instead of exposing raw JSON', async () => {
    setHttpTransport(async () => new Response(JSON.stringify({ success: true, data: {
      id: 'order-real', customerId: 'customer-1', customerName: 'Khách hàng A',
      title: 'Chụp ảnh', serviceId: 'service-1', serviceName: 'Giám sát', description: 'Kiểm tra',
      address: 'Khu A', latitude: 10.6, longitude: 106.7,
      coverageArea: null, preferredDateFrom: '2026-09-24', preferredDateTo: '2026-09-24',
      preferredTimeId: 'morning', preferredTimeName: 'Buổi sáng',
      orderStatus: 'PENDING', rejectReason: null, reviewById: null, reviewByName: null, reviewAt: null,
      createdAt: '2026-09-24T08:00:00Z', updatedAt: '2026-09-24T08:00:00Z',
      deliverables: [{
        id: 'del-1',
        deliverableTypeId: 'thermal',
        deliverableTypeName: 'Báo cáo Phân tích Nhiệt',
        defaultFormat: 'PDF',
        requirement: {
          radiusM: 100,
          quantity: 10,
          mediaType: 'IMAGE',
          resolution: '4K',
          estimatedAreaHa: 3.1,
        },
      }],
    } }), { status: 200 }))
    const detail = await ordersApi.getOrder('order-real')
    expect(detail.mediaRequirements?.[0].label).toBe(
      'Báo cáo Phân tích Nhiệt · IMAGE · 10 mục · 4K · 100 m · 3.1 ha',
    )
    expect(detail.radiusM).toBe(100)
    expect(detail.mediaRequirements?.[0].label).not.toContain('{')
  })

  it('maps orderCode (not id) as the displayed order code', async () => {
    setHttpTransport(async () => new Response(JSON.stringify({ success: true, data: {
      id: 'order-uuid', orderCode: 'ORD-2610-0001', orderStatus: 'PENDING', customerName: 'A',
    } }), { status: 200 }))
    const detail = await ordersApi.getOrder('order-uuid')
    expect(detail.id).toBe('order-uuid')
    expect(detail.code).toBe('ORD-2610-0001')
  })

  it('approve resolves without throwing', async () => {
    setHttpTransport(mockFetch)
    await expect(ordersApi.approve('ord-2609-0157')).resolves.toMatchObject({
      id: 'ord-2609-0157',
      orderStatus: 'APPROVED',
    })
  })

  it('returns the approved order from the real approve endpoint', async () => {
    setHttpTransport(async () => new Response(JSON.stringify({ success: true, data: {
      id: 'order-real', orderStatus: 'APPROVED',
    } }), { status: 200 }))
    await expect(ordersApi.approve('order-real')).resolves.toMatchObject({
      id: 'order-real',
      orderStatus: 'APPROVED',
    })
  })

  it('submitApproval REJECTED resolves without throwing', async () => {
    setHttpTransport(mockFetch)
    await expect(
      ordersApi.submitApproval('ord-2609-0157', {
        decision: 'REJECTED',
        reason: 'Vùng cấm bay',
      }),
    ).resolves.toBeUndefined()
  })

  it('getOrderForMission builds the brief from an APPROVED order and its orderCode', async () => {
    setHttpTransport(async () => new Response(JSON.stringify({ success: true, data: {
      id: 'order-uuid',
      orderCode: 'ORD-2610-0007',
      orderStatus: 'APPROVED',
      customerName: 'Trần Thị Thu Hà',
      serviceName: 'Kiểm tra nhiệt',
      latitude: 10.6402,
      longitude: 106.74,
      radiusM: 300,
      address: 'KCN Hiệp Phước',
      preferredDateFrom: '2026-10-24',
      preferredTimeName: 'Sáng',
    } }), { status: 200 }))
    const brief = await ordersApi.getOrderForMission('order-uuid')
    expect(brief.code).toBe('ORD-2610-0007')
    expect(brief.customerFullName).toBe('Trần Thị Thu Hà')
    expect(brief.center).toEqual({ lat: 10.6402, lon: 106.74 })
  })

  it('getOrderForMission 409s for a PENDING order', async () => {
    setHttpTransport(mockFetch)
    await expect(
      ordersApi.getOrderForMission('ord-2609-0157'),
    ).rejects.toMatchObject({ status: 409 })
  })
})
