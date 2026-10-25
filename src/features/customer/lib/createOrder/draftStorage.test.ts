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
})
