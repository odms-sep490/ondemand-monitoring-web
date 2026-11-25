import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { customerApi } from '../../../api/customerApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import {
  CREATE_ORDER_DRAFT_STORAGE_KEY,
  createDefaultForm,
} from '../../../lib/createOrder/draftStorage'
import { pricingAreaHa } from '../../../lib/createOrder/payload'
import { circleCoverageArea } from '../../../lib/createOrder/coverageGeometry'
import { useCreateOrderWizard } from './useCreateOrderWizard'
import { buildOrderPayload } from '../../../lib/createOrder/payload'
import type { OrderAgentSession } from '../../../lib/createOrder/orderAgent'

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

function circleArea(areaHa: number) {
  const radiusM = Math.sqrt((areaHa * 10_000) / Math.PI)
  const center: [number, number] = [106.6912, 10.6402]
  return {
    radiusM,
    coverageAreaShape: 'CIRCLE' as const,
    coverageAreaCenter: center,
    coverageArea: circleCoverageArea(center, radiusM),
  }
}

beforeEach(() => {
  localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
  vi.spyOn(customerApi, 'listServices').mockResolvedValue([
    { id: 'construction', name: 'Giám sát công trình', defaultPrice: 3_500_000 },
    { id: 'other-service', name: 'Other service', defaultPrice: 3_500_000 },
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

it('applies all validated data once and opens the existing Review without calling createOrder',async()=>{
  vi.mocked(customerApi.listPreferredTimes).mockResolvedValue([{id:'morning',name:'Morning'}])
  vi.mocked(customerApi.listServiceDeliverables).mockResolvedValue([{id:'link',serviceId:'construction',deliverableTypeId:'photo',deliverableTypeName:'Photo'}])
  const create=vi.spyOn(customerApi,'createOrder')
  const {result}=renderHook(useCreateOrderWizard)
  await waitFor(()=>expect(result.current.checklist.status).toBe('ready'))
  act(()=>result.current.f.setForm(current=>({...current,
    ...circleArea(1),latitude:'10.6402',longitude:'106.6912',locationStatus:'confirmed',locationConfirmedAt:'confirmed',
    address:'Test site',normalizedAddress:'Test site',flightPurpose:'CONSTRUCTION_MONITORING',description:'Theo dõi mái',
    siteContactName:'Customer',siteContactPhone:'0901234567',accessNotes:'Gate',monitoringRelationship:'OWNER',
    monitoringAuthorizationConfirmed:true,termsAccepted:true,preferredTimeId:'morning',deliverableTypeId:'photo',
  })))
  await waitFor(()=>expect(result.current.f.form.preferredTimeId).toBe('morning'))
  const before=result.current.f.form
  const canonicalDraft={...buildOrderPayload({form:before,score:result.current.score,mediaTotals:result.current.checklist.mediaTotals,
    deliverableOptions:result.current.meta.deliverables}),checklistItems:result.current.checklist.serialize()}
  const session:OrderAgentSession={id:'session',revision:9,expiresAt:'2099-01-01',state:{messages:[],confirmedFields:{},pendingChanges:{},readyForReview:true,canonicalDraft}}
  act(()=>result.current.applyValidatedAgentDraft(session,before))
  expect(result.current.f.step).toBe(6)
  expect(result.current.f.form.agentChecklistItems).toEqual(canonicalDraft.checklistItems)
  expect(result.current.f.form.coverageArea).toEqual(before.coverageArea)
  expect(JSON.parse(localStorage.getItem(CREATE_ORDER_DRAFT_STORAGE_KEY)!).step).toBe(6)
  expect(create).not.toHaveBeenCalled()
  const applied=result.current.f.form
  const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Full','QuotaExceededError')})
  expect(()=>result.current.applyValidatedAgentDraft(session,applied)).toThrow('Chưa lưu được bản nháp')
  expect(result.current.f.form).toBe(applied)
  expect(result.current.f.step).toBe(6)
  storage.mockRestore()
  act(()=>result.current.wizard.goTo(4))
  expect(result.current.f.step).toBe(4)
  expect(create).not.toHaveBeenCalled()
})

describe('area availability in the customer wizard', () => {
  it('reloads a removed service and returns to service selection while preserving the draft', async () => {
    localStorage.setItem(CREATE_ORDER_DRAFT_STORAGE_KEY, JSON.stringify({
      step: 3,
      form: {
        ...createDefaultForm(),
        serviceId: 'construction',
        title: 'Giám sát công trình đang nhập',
        address: 'Địa điểm đang nhập',
        ...circleArea(5),
      },
    }))
    vi.mocked(customerApi.listServices)
      .mockResolvedValueOnce([{ id: 'construction', name: 'Giám sát công trình', defaultPrice: 0 }])
      .mockResolvedValue([{ id: 'replacement-service', name: 'Giám sát công trình', defaultPrice: 0 }])
    vi.mocked(checklistPricingApi.customerQuote).mockRejectedValueOnce(
      new ApiError('Service not found', { code: 'SERVICE_NOT_FOUND', status: 404, method: 'POST', path: '/api/pricing/checklist-quote' }),
    )

    const { result } = renderHook(useCreateOrderWizard)

    await waitFor(() => expect(result.current.f.step).toBe(1))
    await waitFor(() => expect(result.current.f.form.serviceId).toBe('replacement-service'))
    expect(result.current.f.form.title).toBe('Giám sát công trình đang nhập')
    expect(result.current.f.form.address).toBe('Địa điểm đang nhập')
    expect(result.current.f.form.coverageArea).toEqual(circleArea(5).coverageArea)
    expect(customerApi.listServices).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(result.current.checklist.quote.error).toBeNull())
  })

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
        ...circleArea(30),
      }))
    })
    expect(result.current.checklist.quote.preview?.total).toBe(3_500_000)
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')

    act(() => result.current.f.setStep(3))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_700_000),
    )
    expect(requests.mock.lastCall?.[3]?.areaHa).toBeCloseTo(30, 0)

    act(() => result.current.f.setStep(2))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_500_000),
    )
    act(() =>
      result.current.f.setForm((current) => ({
        ...current,
        ...circleArea(50),
      })),
    )
    expect(requests.mock.lastCall?.[3]).not.toHaveProperty('areaHa')
    act(() => result.current.f.setStep(3))
    expect(result.current.checklist.quote.preview).toBeNull()
    await waitFor(() =>
      expect(result.current.checklist.quote.preview?.total).toBe(3_900_000),
    )
    expect(requests.mock.lastCall?.[3]?.areaHa).toBeCloseTo(50, 0)

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
