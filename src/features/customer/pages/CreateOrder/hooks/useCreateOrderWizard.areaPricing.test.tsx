import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { customerApi } from '../../../api/customerApi'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import {
  CREATE_ORDER_DRAFT_STORAGE_KEY,
  createDefaultForm,
} from '../../../lib/createOrder/draftStorage'
import { pricingAreaHa } from '../../../lib/createOrder/payload'
import { useCreateOrderWizard } from './useCreateOrderWizard'

function quote(areaHa?: number): ServicePricePreview {
  const total =
    3_500_000 + (areaHa ? Math.ceil((areaHa - 10) / 10) * 100_000 : 0)
  return {
    serviceId: 'construction',
    serviceName: 'Giám sát công trình',
    currency: 'VND',
    policyId: 'policy',
    policyVersion: 1,
    draftPolicy: false,
    priceSource: 'CHECKLISTS',
    packageFee: 0,
    checklists: [],
    checklistSubtotal: total,
    total,
    complete: true,
    warnings: [],
    quotePending: false,
    addOns: [],
  }
}

beforeEach(() => {
  localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
  vi.spyOn(customerApi, 'listServices').mockResolvedValue([
    { id: 'construction', name: 'Giám sát công trình', basePrice: 3_500_000 },
    { id: 'other-service', name: 'Other service', basePrice: 3_500_000 },
  ])
  vi.spyOn(customerApi, 'listPreferredTimes').mockResolvedValue([])
  vi.spyOn(customerApi, 'listServiceDeliverables').mockResolvedValue([])
  vi.spyOn(customerApi, 'getChecklistCatalog').mockResolvedValue([])
  vi.spyOn(customerApi, 'getServiceChecklist').mockImplementation(
    async (serviceId) => [
      {
        id: 'link',
        serviceId,
        checklistId: 'checklist',
        checklistVersion: 1,
        content: 'Monitoring',
        displayOrder: 1,
        serviceActive: true,
        checklistActive: true,
        includedImageCount: 10,
        includedVideoCount: 1,
      },
    ],
  )
  vi.spyOn(checklistPricingApi, 'customerQuote').mockImplementation(
    async (_serviceId, _items, _signal, context) => quote(context?.areaHa),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
})

describe('area availability in the customer wizard', () => {
  it('omits the default area, applies confirmed area only at content, and invalidates changed or cleared quotes', async () => {
    const requests = vi.mocked(checklistPricingApi.customerQuote)
    const { result } = renderHook(useCreateOrderWizard)
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_500_000),
    )
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')

    act(() => {
      result.current.f.setStep(2)
      result.current.f.setForm((current) => ({
        ...current,
        locationStatus: 'confirmed',
        locationConfirmedAt: '2026-10-24T00:00:00Z',
        normalizedAddress: 'Confirmed site',
        radiusM: Math.sqrt((30 * 10000) / Math.PI),
      }))
    })
    expect(result.current.checklist.quote.preview?.total).toBe(3_500_000)
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')

    act(() => result.current.f.setStep(3))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_700_000),
    )
    expect(requests.mock.lastCall?.[3]?.areaHa).toBe(30)

    act(() => result.current.f.setStep(2))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_500_000),
    )
    act(() =>
      result.current.f.update('radiusM', Math.sqrt((50 * 10000) / Math.PI)),
    )
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')
    act(() => result.current.f.setStep(3))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_900_000),
    )
    expect(requests.mock.lastCall?.[3]?.areaHa).toBe(50)

    act(() => result.current.f.update('locationStatus', 'unconfirmed'))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_500_000),
    )
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')

    act(() => {
      result.current.f.setStep(1)
      result.current.f.update('serviceId', 'other-service')
    })
    await waitFor(() =>
      expect(requests.mock.lastCall?.[0]).toBe('other-service'),
    )
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')
  })

  it('does not send a previously confirmed draft area from the Service step', async () => {
    localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify({
        step: 1,
        form: {
          ...createDefaultForm(),
          serviceId: 'construction',
          locationStatus: 'confirmed',
          normalizedAddress: 'Previous site',
          locationConfirmedAt: '2026-10-24T00:00:00Z',
          radiusM: Math.sqrt((30 * 10000) / Math.PI),
        },
      }),
    )
    const { result } = renderHook(useCreateOrderWizard)
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_500_000),
    )
    expect(
      vi.mocked(checklistPricingApi.customerQuote).mock.lastCall?.[3],
    ).not.toHaveProperty('areaHa')
  })

  it.each(['unconfirmed', 'resolving', 'stale', 'error'] as const)(
    'treats a %s area as unavailable even when a radius exists',
    (locationStatus) => {
      expect(
        pricingAreaHa({
          ...createDefaultForm(),
          locationStatus,
          normalizedAddress: 'Old site',
          locationConfirmedAt: '2026-10-24T00:00:00Z',
        }),
      ).toBeUndefined()
    },
  )
})
