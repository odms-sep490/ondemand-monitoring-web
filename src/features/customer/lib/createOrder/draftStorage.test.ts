import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CREATE_ORDER_DRAFT_STORAGE_KEY,
  createDefaultForm,
  readStoredDraft,
} from './draftStorage'

describe('create-order location draft', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with an explicitly unconfirmed location', () => {
    const form = createDefaultForm()
    expect(form.locationStatus).toBe('unconfirmed')
    expect(form.locationConfirmedAt).toBe('')
    expect(form.normalizedAddress).toBe('')
    expect(form.deliveryMethods).toEqual(['DOWNLOAD'])
    expect(form.dataRetentionDays).toBe(30)
  })

  it('does not trust a legacy draft that has coordinates but no confirmation evidence', () => {
    const form = { ...createDefaultForm(), address: 'Quận 1' }
    const legacy = { ...form } as Record<string, unknown>
    delete legacy.locationStatus
    delete legacy.locationConfirmedAt
    delete legacy.normalizedAddress
    window.localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify({ step: 3, form: legacy }),
    )
    expect(readStoredDraft()?.form?.locationStatus).toBe('unconfirmed')
  })

  it('restores confirmed only when confirmation evidence is present', () => {
    const form = {
      ...createDefaultForm(),
      address: 'Chợ Bến Thành, Quận 1, TP.HCM',
      normalizedAddress: 'Chợ Bến Thành, Quận 1, TP.HCM',
      locationStatus: 'confirmed' as const,
      locationSource: 'search' as const,
      locationConfirmedAt: '2026-10-21T00:00:00.000Z',
    }
    window.localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify({ step: 3, form }),
    )
    expect(readStoredDraft()?.form).toMatchObject({
      locationStatus: 'confirmed',
      locationSource: 'search',
      normalizedAddress: form.normalizedAddress,
    })
  })

  it('restores a confirmed coordinate-only location without inventing an address', () => {
    const form = {
      ...createDefaultForm(),
      address: '',
      normalizedAddress: '',
      locationStatus: 'confirmed' as const,
      locationSource: 'map' as const,
      locationConfirmedAt: '2026-10-21T00:00:00.000Z',
    }
    window.localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify({ step: 2, form }),
    )

    expect(readStoredDraft()?.form).toMatchObject({
      address: '',
      normalizedAddress: '',
      locationStatus: 'confirmed',
      locationSource: 'map',
    })
  })

  it('replaces old delivery preferences with the current defaults', () => {
    const form = {
      ...createDefaultForm(),
      deliveryMethods: ['EMAIL'] as const,
      dataRetentionDays: 90 as const,
    }
    window.localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify({ step: 6, form }),
    )

    expect(readStoredDraft()?.form).toMatchObject({
      deliveryMethods: ['DOWNLOAD'],
      dataRetentionDays: 30,
    })
  })
})
