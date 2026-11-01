import { DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import type { MediaRuleIssue } from '../../../lib/mediaPricingRules'
import type { PricingRule } from '../../../types/pricing'
import { MoneyInput, UnitInput } from './PricingInputs'
import { sharedMediaTiersMessages } from './SharedMediaTiers.messages'
import { tierRange, tierRounding, type TierKind } from './mediaTierHelpers'

/** One price tier of the shared list: a summary line, or four fields while it is being edited. */
export function SharedTierItem({
  rule,
  kind,
  editing,
  issues,
  onPatch,
  onEdit,
  onDone,
  onRemove,
}: {
  rule: PricingRule
  kind: TierKind
  editing: boolean
  issues: MediaRuleIssue[]
  onPatch: (changes: Partial<PricingRule>) => void
  onEdit: () => void
  onDone: () => void
  onRemove: () => void
}) {
  const { t } = useI18n(sharedMediaTiersMessages)
  const range = tierRange(rule, kind, t)
  return (
    <Card
      size="small"
      className={`ppd-tier${editing ? ' is-editing' : ''}`}
      data-testid="shared-tier"
    >
      {editing ? (
        <div className="pricing-tier-editor">
          <div className="pricing-field-grid pricing-field-grid-four">
            <UnitInput
              label={t.from}
              ariaLabel={t.ariaFrom(kind.title)}
              suffix={kind.noun}
              min={0}
              value={rule.minValue ?? 0}
              onChange={(value) => onPatch({ minValue: value ?? 0 })}
              helper={t.fromHelper}
            />
            <UnitInput
              label={t.to}
              ariaLabel={t.ariaTo(kind.title)}
              suffix={kind.noun}
              min={1}
              value={rule.maxValue ?? null}
              onChange={(value) => onPatch({ maxValue: value })}
              helper={t.toHelper}
            />
            <UnitInput
              label={t.blockSize}
              ariaLabel={t.ariaBlockSize(kind.title)}
              suffix={kind.noun}
              min={1}
              value={rule.unitSize ?? null}
              onChange={(value) => onPatch({ unitSize: value })}
              helper={t.blockSizeHelper}
            />
            <MoneyInput
              label={t.pricePerBlock}
              ariaLabel={t.ariaPricePerBlock(kind.title)}
              value={rule.fixedAmount ?? null}
              onChange={(value) => onPatch({ fixedAmount: value })}
            />
          </div>
          <div className="pricing-card-actions">
            <Button htmlType="button" size="small" onClick={onDone}>
              {t.done}
            </Button>
          </div>
        </div>
      ) : (
        <div className="pricing-tier-row">
          <div className="pricing-tier-summary">
            <strong>{range}</strong>
            <span>
              {t.perBlock(
                formatVnd(rule.fixedAmount ?? 0),
                rule.unitSize ?? 1,
                kind.noun,
              )}
            </span>
            <Typography.Text type="secondary">
              {tierRounding(rule.roundingMode, t)}
            </Typography.Text>
          </div>
          <div className="pricing-card-actions">
            <Button htmlType="button" size="small" onClick={onEdit}>
              {t.edit}
            </Button>
            <Button
              size="small"
              danger
              type="text"
              htmlType="button"
              icon={
                <DeleteOutlined aria-hidden="true" aria-label={undefined} />
              }
              aria-label={t.removeAria(kind.noun, range)}
              title={t.removeTitle}
              onClick={onRemove}
            />
          </div>
        </div>
      )}
      {issues.length > 0 && (
        <ul role="alert" className="ppd-issues">
          {issues.map((issue) => (
            <li key={issue}>{t.issues[issue] ?? issue}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}
