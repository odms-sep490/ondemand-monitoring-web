import { Button, Input, Select, Switch } from 'antd'
import { useId } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  pricingLabel,
  pricingTextToLocalized,
} from '../../../../../shared/lib/pricingPresentation'
import { LocalizedTextInput } from '../../../components/common/LocalizedTextInput'
import { LOCALIZED_LIMITS, ruleTextValid } from '../../../lib/localizedField'
import type { PricingRule } from '../../../types/pricing'
import { pricingDraftEditorMessages } from './PricingDraftEditor.messages'
import { MoneyInput, PricingField, UnitInput } from './PricingInputs'
import {
  CALCULATION_TYPES,
  RULE_CATEGORIES,
  calculationChanges,
  categoryChanges,
  dimensionUnit,
  isBlockType,
  isDimensionBlockRule,
} from './pricingRuleView'

type Props = {
  rule: PricingRule
  onChange: (changes: Partial<PricingRule>) => void
  onDone: () => void
  onCancel?: () => void
  create?: boolean
}

/** Full editor of one rule; only the fields the chosen calculation needs are shown. */
export function PricingRuleEditor({
  rule,
  onChange,
  onDone,
  onCancel,
  create = false,
}: Props) {
  const { t } = useI18n(pricingDraftEditorMessages)
  const uid = useId()
  const block = isBlockType(rule.calculationType)
  const fixed = ['FIXED', 'PER_UNIT', 'PER_BLOCK', 'TIERED_BLOCK'].includes(
    rule.calculationType,
  )
  const percentage = rule.calculationType === 'PERCENT_OF_BASE'
  const multiplier = ['MULTIPLIER', 'RESOURCE_BASED', 'ACTUAL_COST'].includes(
    rule.calculationType,
  )
  const unit = dimensionUnit(rule.category, t)
  return (
    <div className="pricing-rule-editor">
      <fieldset>
        <legend>{t.general}</legend>
        <div className="pricing-field-grid">
          <PricingField id={`${uid}-category`} label={t.category}>
            <Select
              id={`${uid}-category`}
              value={rule.category}
              onChange={(value) => onChange(categoryChanges(rule, value))}
              options={RULE_CATEGORIES.map((value) => ({
                value,
                label: pricingLabel(value),
              }))}
            />
          </PricingField>
          <PricingField id={`${uid}-calc`} label={t.calculation}>
            <Select
              id={`${uid}-calc`}
              value={rule.calculationType}
              onChange={(value) => onChange(calculationChanges(rule, value))}
              options={CALCULATION_TYPES.map((value) => ({
                value,
                label: pricingLabel(value),
              }))}
            />
          </PricingField>
          <PricingField id={`${uid}-key`} label={t.ruleKey}>
            <Input
              id={`${uid}-key`}
              value={rule.ruleKey}
              onChange={(event) => onChange({ ruleKey: event.target.value })}
            />
          </PricingField>
          <PricingField id={`${uid}-name`} label={t.ruleName} wide>
            <LocalizedTextInput
              id={`${uid}-name`}
              label={t.ruleName}
              required
              value={pricingTextToLocalized(rule.description)}
              maxEncoded={LOCALIZED_LIMITS.ruleDescription}
              onChange={(value) =>
                onChange({ description: JSON.stringify(value) })
              }
            />
          </PricingField>
        </div>
      </fieldset>

      {(block || rule.minValue != null || rule.maxValue != null) && (
        <fieldset>
          <legend>{t.appliedRange}</legend>
          <div className="pricing-field-grid">
            <UnitInput
              label={t.from}
              suffix={unit}
              value={rule.minValue}
              onChange={(value) => onChange({ minValue: value })}
            />
            <UnitInput
              label={t.to}
              suffix={unit}
              value={rule.maxValue}
              onChange={(value) => onChange({ maxValue: value })}
              helper={t.toHelper}
            />
          </div>
        </fieldset>
      )}

      {rule.calculationType !== 'MANUAL_QUOTE' && (
        <fieldset>
          <legend>{t.pricing}</legend>
          <div className="pricing-field-grid">
            {block && (
              <UnitInput
                label={t.blockSize}
                suffix={unit}
                min={1}
                value={rule.unitSize}
                onChange={(value) => onChange({ unitSize: value })}
                helper={t.blockSizeHelper}
              />
            )}
            {fixed && (
              <MoneyInput
                label={block ? t.pricePerBlock : t.fixedPrice}
                value={rule.fixedAmount}
                onChange={(value) => onChange({ fixedAmount: value })}
              />
            )}
            {percentage && (
              <UnitInput
                label={t.percentage}
                suffix="%"
                value={rule.percentage}
                onChange={(value) => onChange({ percentage: value })}
              />
            )}
            {multiplier && (
              <UnitInput
                label={t.multiplier}
                suffix={t.times}
                step={0.01}
                value={rule.multiplier}
                onChange={(value) => onChange({ multiplier: value })}
              />
            )}
            {block && isDimensionBlockRule(rule) && (
              <PricingField id={`${uid}-rounding`} label={t.rounding}>
                <Select
                  id={`${uid}-rounding`}
                  value={rule.roundingMode ?? 'CEILING'}
                  onChange={(value) => onChange({ roundingMode: value })}
                  options={[
                    { value: 'CEILING', label: t.roundUp },
                    { value: 'FLOOR', label: t.roundDown },
                    { value: 'HALF_UP', label: t.roundNearest },
                  ]}
                />
              </PricingField>
            )}
          </div>
        </fieldset>
      )}

      <div className="pricing-rule-editor-footer">
        <label className="pricing-switch">
          <Switch
            size="small"
            checked={rule.enabled}
            aria-label={t.ruleActive}
            onChange={(checked) => onChange({ enabled: checked })}
          />
          <span>{t.ruleActive}</span>
        </label>
        <div className="pricing-card-actions">
          {onCancel && (
            <Button htmlType="button" onClick={onCancel}>
              {t.cancel}
            </Button>
          )}
          <Button
            htmlType="button"
            type="primary"
            disabled={!ruleTextValid(rule.description)}
            onClick={onDone}
          >
            {create ? t.addRuleOk : t.done}
          </Button>
        </div>
      </div>
    </div>
  )
}
