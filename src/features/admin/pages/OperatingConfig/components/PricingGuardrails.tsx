import { InputNumber } from 'antd'
import { useId } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { PricingPolicy } from '../../../types/pricing'
import { pricingDraftEditorMessages } from './PricingDraftEditor.messages'
import { guardrailChanges } from './guardrailRules'

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="pricing-field">
      <label className="pricing-field-label" htmlFor={id}>
        {label}
      </label>
      <InputNumber<number>
        id={id}
        className="adm-input-full"
        value={value}
        onChange={(next) => onChange(next ?? 0)}
      />
    </div>
  )
}

/** The limits a Manager may move a system price within. */
export function PricingGuardrails({
  draft,
  setDraft,
  valid,
}: {
  draft: PricingPolicy
  setDraft: (policy: PricingPolicy) => void
  valid: boolean
}) {
  const { t } = useI18n(pricingDraftEditorMessages)
  return (
    <>
      <div className="pricing-policy-guardrails">
        <NumberField
          label={t.maxDiscount}
          value={draft.managerMaxDiscountPercent}
          onChange={(v) =>
            setDraft({ ...draft, ...guardrailChanges.maxDiscount(v) })
          }
        />
        <NumberField
          label={t.maxMarkup}
          value={draft.managerMaxMarkupPercent}
          onChange={(v) => setDraft({ ...draft, managerMaxMarkupPercent: v })}
        />
        <NumberField
          label={t.highRisk}
          value={draft.highRiskDiscountPercent}
          onChange={(v) => setDraft({ ...draft, highRiskDiscountPercent: v })}
        />
        <NumberField
          label={t.minPrice}
          value={draft.minimumPrice}
          onChange={(v) => setDraft({ ...draft, minimumPrice: v })}
        />
      </div>
      <p className="ppo-hint">
        {t.minRatioNote(Math.round(draft.minimumPriceRatio * 10000) / 100)}
      </p>
      {!valid && (
        <p role="alert" className="ppd-issues">
          {t.guardrailsInvalid}
        </p>
      )}
    </>
  )
}
