import { DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Tag } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import {
  pricingDescription,
  pricingLabel,
} from '../../../../../shared/lib/pricingPresentation'
import type { PricingRule } from '../../../types/pricing'
import { pricingDraftEditorMessages } from './PricingDraftEditor.messages'
import { PricingRuleEditor } from './PricingRuleEditor'
import {
  isDimensionBlockRule,
  roundingLabel,
  ruleRange,
  rulePrice,
} from './pricingRuleView'

/** One rule of the policy: a read-only summary with Edit / Delete, or the editor while it is being changed. */
export function PricingRuleCard({
  rule,
  editing,
  onEdit,
  onDone,
  onChange,
  onRemove,
}: {
  rule: PricingRule
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onChange: (changes: Partial<PricingRule>) => void
  onRemove: () => void
}) {
  const { t } = useI18n(pricingDraftEditorMessages)
  const name = pricingDescription(rule.description)
  const range = ruleRange(rule, t)
  if (editing) {
    return (
      <Card size="small" className="pricing-rule-card is-editing">
        <PricingRuleEditor rule={rule} onChange={onChange} onDone={onDone} />
      </Card>
    )
  }
  return (
    <Card
      size="small"
      className="pricing-rule-card"
      title={
        <div className="pricing-rule-card-title">
          <span className="pricing-rule-kind">
            {pricingLabel(rule.calculationType)}
          </span>
          <h4>{name}</h4>
          <code>{rule.ruleKey}</code>
        </div>
      }
      extra={
        <Tag bordered={false} color={rule.enabled ? 'success' : 'default'}>
          {rule.enabled ? t.ruleActive : t.ruleOff}
        </Tag>
      }
      actions={[
        <Button key="edit" size="small" htmlType="button" onClick={onEdit}>
          {t.edit}
        </Button>,
        <Button
          key="remove"
          size="small"
          danger
          type="text"
          htmlType="button"
          icon={<DeleteOutlined aria-hidden="true" aria-label={undefined} />}
          aria-label={t.removeRuleAria(name)}
          title={t.removeRuleTitle}
          onClick={onRemove}
        />,
      ]}
    >
      <Descriptions size="small" column={1}>
        {range && (
          <Descriptions.Item label={t.appliedRange}>{range}</Descriptions.Item>
        )}
        <Descriptions.Item label={t.calculation}>
          {rulePrice(rule, t)}
        </Descriptions.Item>
        {isDimensionBlockRule(rule) && (
          <Descriptions.Item label={t.rounding}>
            {roundingLabel(rule.roundingMode, t)}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  )
}
