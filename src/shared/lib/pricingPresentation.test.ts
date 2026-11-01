import { afterEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../i18n'
import {
  pricingDescription,
  pricingPolicyName,
  pricingTextToLocalized,
  stripChecklistPrefix,
} from './pricingPresentation'

afterEach(() => setLanguage('vi'))

describe('pricing presentation of bilingual text', () => {
  const rule = '{"vi":"Phụ phí khoảng cách","en":"Distance surcharge"}'

  it('decodes admin-entered rule descriptions and policy names', () => {
    setLanguage('vi')
    expect(pricingDescription(rule)).toBe('Phụ phí khoảng cách')
    expect(
      pricingPolicyName('{"vi":"Chính sách hè","en":"Summer policy"}'),
    ).toBe('Chính sách hè')
    setLanguage('en')
    expect(pricingDescription(rule)).toBe('Distance surcharge')
    expect(
      pricingPolicyName('{"vi":"Chính sách hè","en":"Summer policy"}'),
    ).toBe('Summer policy')
  })

  it('keeps translating legacy engine text', () => {
    setLanguage('vi')
    expect(pricingDescription('Distance up to 5 km')).toBe(
      'Quãng đường đến 5 km',
    )
    expect(pricingPolicyName('Default pricing policy')).toBe(
      'Chính sách giá mặc định',
    )
  })

  it('gives the editor both readings of legacy text', () => {
    expect(pricingTextToLocalized('Default pricing policy')).toEqual({
      vi: 'Chính sách giá mặc định',
      en: 'Default pricing policy',
    })
    expect(pricingTextToLocalized(rule).en).toBe('Distance surcharge')
  })

  it('strips the checklist prefix, even when the backend truncated the name', () => {
    expect(stripChecklistPrefix('Roof · Base price', 'Roof')).toBe('Base price')
    expect(
      stripChecklistPrefix(
        '{"vi":"Mái nhà dài... · Base price',
        'Mái nhà dài hơn',
      ),
    ).toBe('Base price')
  })
})
