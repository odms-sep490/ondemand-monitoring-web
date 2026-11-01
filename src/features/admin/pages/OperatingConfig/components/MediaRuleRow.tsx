import { Button, Checkbox, Select } from 'antd'
import { useId } from 'react'

import { displayLocalized, useI18n } from '../../../../../shared/i18n'
import {
  CUSTOM_PROFILE,
  ROUNDING_MODES,
  isTier,
  type MediaRuleIssue,
} from '../../../lib/mediaPricingRules'
import type { PricingRule } from '../../../types/pricing'
import { mediaPricingEditorMessages } from './MediaPricingEditor.messages'
import { MoneyInput, PricingField, UnitInput } from './PricingInputs'

/** One media rule in the advanced list: tier fields (from/to/block/rounding), price, allowance, enabled, remove. */
export function MediaRuleRow({
  rule,
  issues,
  onPatch,
  onRemove,
}: {
  rule: PricingRule
  issues: MediaRuleIssue[]
  onPatch: (changes: Partial<PricingRule>) => void
  onRemove: () => void
}) {
  const { t } = useI18n(mediaPricingEditorMessages)
  const uid = useId()
  const tier = isTier(rule)
  const allowance =
    (rule.mediaComponent === 'INCLUDED_IMAGE' ||
      rule.mediaComponent === 'INCLUDED_VIDEO') &&
    rule.pricingProfile === CUSTOM_PROFILE
  return (
    <div className="pricing-rule-row" data-testid="media-rule">
      <b>
        {rule.checklistDefinitionName ? displayLocalized(rule.checklistDefinitionName) : rule.pricingProfile} ·{' '}
        {t[rule.mediaComponent ?? 'INCLUDED_IMAGE']}
      </b>
      {tier && (
        <>
          <UnitInput
            label={t.from}
            suffix=""
            value={rule.minValue ?? 0}
            onChange={(value) => onPatch({ minValue: value ?? 0 })}
          />
          <UnitInput
            label={t.to}
            suffix=""
            min={1}
            value={rule.maxValue}
            onChange={(value) => onPatch({ maxValue: value })}
          />
          <UnitInput
            label={t.block}
            suffix=""
            min={1}
            value={rule.unitSize}
            onChange={(value) => onPatch({ unitSize: value })}
          />
          <PricingField id={`${uid}-rounding`} label={t.rounding}>
            <Select
              id={`${uid}-rounding`}
              value={rule.roundingMode ?? 'CEILING'}
              onChange={(value) => onPatch({ roundingMode: value })}
              options={ROUNDING_MODES.map((mode) => ({
                value: mode,
                label: t[mode],
              }))}
            />
          </PricingField>
        </>
      )}
      <MoneyInput
        label={tier ? t.pricePerBlock : t.price}
        value={rule.fixedAmount}
        onChange={(value) => onPatch({ fixedAmount: value })}
      />
      {allowance && (
        <UnitInput
          label={t.allowance}
          suffix=""
          max={500}
          value={rule.includedQuantity ?? null}
          onChange={(value) => onPatch({ includedQuantity: value })}
        />
      )}
      <Checkbox
        checked={rule.enabled}
        onChange={(event) => onPatch({ enabled: event.target.checked })}
      >
        {t.enabled}
      </Checkbox>
      <Button htmlType="button" size="small" onClick={onRemove}>
        {t.remove}
      </Button>
      {issues.length > 0 && (
        <ul role="alert" className="pricing-rule-issues">
          {issues.map((issue) => (
            <li key={issue}>{t[issue]}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
