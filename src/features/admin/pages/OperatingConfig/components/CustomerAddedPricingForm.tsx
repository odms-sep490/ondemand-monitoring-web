import { Card } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { PricingRule } from '../../../types/pricing'
import { customerAddedPricingMessages } from './CustomerAddedPricingForm.messages'
import { MoneyInput, UnitInput } from './PricingInputs'
import {
  CUSTOMER_ADDED_FIELDS as FIELDS,
  customerAddedValue,
  withCustomerAddedValue,
  type CustomerAddedField,
} from './customerAddedFields'

export { isCustomerAddedRule } from './customerAddedFields'

/**
 * The few numbers that price customer-added work, in plain words. They are ordinary rules of the customer-added profile
 * in the draft policy, so saving, publishing and versioning work exactly as for every other rule.
 */
export function CustomerAddedPricingForm({
  rules,
  onChange,
  disabled = false,
}: {
  rules: PricingRule[]
  onChange: (rules: PricingRule[]) => void
  disabled?: boolean
}) {
  const { t } = useI18n(customerAddedPricingMessages)

  function renderField(field: CustomerAddedField) {
    const common = {
      id: `customer-added-${field.key}`,
      label: t[field.label],
      ariaLabel: t[field.label],
      value: customerAddedValue(rules, field),
      disabled,
      onChange: (next: number | null) => {
        const updated = withCustomerAddedValue(rules, field, next)
        if (updated) onChange(updated)
      },
    }
    if (field.target === 'price')
      return <MoneyInput key={field.key} {...common} />
    const suffix =
      field.component === 'INCLUDED_IMAGE'
        ? t.unitImage
        : field.component === 'INCLUDED_VIDEO'
          ? t.unitVideo
          : t.unitHa
    return <UnitInput key={field.key} {...common} suffix={suffix} min={0} />
  }

  return (
    <Card
      size="small"
      className="pricing-customer-added pricing-section"
      role="region"
      aria-label={t.title}
    >
      <span className="pricing-section-kicker">{t.basicConfig}</span>
      <h3>{t.title}</h3>
      <p>{t.hint}</p>
      <div className="pricing-basic-layout">
        <Card size="small" title={t.basePriceHeading}>
          {renderField(FIELDS[0])}
        </Card>
        <Card size="small" title={t.allowanceHeading}>
          <p className="pricing-helper">{t.allowanceHint}</p>
          <div className="pricing-field-grid">
            {FIELDS.slice(1, 4).map(renderField)}
          </div>
        </Card>
        <Card size="small" title={t.overageHeading}>
          {renderField(FIELDS[4])}
        </Card>
      </div>
      <p className="pricing-customer-added-note">{t.formula}</p>
    </Card>
  )
}
