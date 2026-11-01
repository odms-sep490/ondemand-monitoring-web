import { Button, Card, Collapse, Empty } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  pricingDescription,
  pricingLabel,
} from '../../../../../shared/lib/pricingPresentation'
import { useAdminConfirm } from '../../../components/common/useAdminConfirm'
import { isMediaRule } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'
import { MediaPricingEditor } from './MediaPricingEditor'
import { pricingDraftEditorMessages } from './PricingDraftEditor.messages'
import { PricingRuleCard } from './PricingRuleCard'
import { PricingRuleEditor } from './PricingRuleEditor'
import {
  RULE_CATEGORIES,
  blankRule,
  categorySummary,
  withoutRule,
} from './pricingRuleView'

const ADVANCED_MEDIA_KEY = '__media'

/** The full rule list, grouped and folded, plus the per-profile media prices. */
export function PricingAdvancedRules({
  draft,
  setDraft,
}: {
  draft: PricingPolicy
  setDraft: (policy: PricingPolicy) => void
}) {
  const { t } = useI18n(pricingDraftEditorMessages)
  const confirm = useAdminConfirm()
  const [opened, setOpened] = useState<string[]>([])
  const [editingRule, setEditingRule] = useState<number | null>(null)
  const [newRule, setNewRule] = useState<PricingRule | null>(null)

  function updateRule(index: number, changes: Partial<PricingRule>) {
    setDraft({
      ...draft,
      rules: draft.rules.map((rule, i) =>
        i === index ? { ...rule, ...changes } : rule,
      ),
    })
  }
  function addRule() {
    setOpened((current) =>
      current.includes('AREA') ? current : [...current, 'AREA'],
    )
    setNewRule(
      blankRule(
        draft.rules.length,
        JSON.stringify({
          vi: pricingDraftEditorMessages.vi.newRuleName,
          en: pricingDraftEditorMessages.en.newRuleName,
        }),
      ),
    )
  }
  async function removeRule(index: number) {
    const name = pricingDescription(draft.rules[index].description)
    const ok = await confirm({
      title: t.removeConfirm(name),
      danger: true,
    })
    if (ok) setDraft({ ...draft, rules: withoutRule(draft.rules, index) })
  }

  const groups = RULE_CATEGORIES.map((category) => ({
    category,
    items: draft.rules
      .map((rule, index) => ({ rule, index }))
      .filter(
        (entry) => !isMediaRule(entry.rule) && entry.rule.category === category,
      ),
  })).filter((group) => group.items.length > 0)

  const items = [
    ...groups.map((group) => ({
      key: group.category,
      label: (
        <span className="pricing-group-heading">
          <strong>{pricingLabel(group.category)}</strong>
          <span className="ppd-count">{t.ruleCount(group.items.length)}</span>
          <span className="pricing-group-preview">
            {categorySummary(
              group.items.map((entry) => entry.rule),
              t,
            )}
          </span>
        </span>
      ),
      children: (
        <div className="ppd-group-body pricing-rule-cards">
          {group.items.map(({ rule, index }) => (
            <PricingRuleCard
              key={`${rule.category}-${rule.ruleKey}`}
              rule={rule}
              editing={editingRule === index}
              onEdit={() => setEditingRule(index)}
              onDone={() => setEditingRule(null)}
              onChange={(changes) => updateRule(index, changes)}
              onRemove={() => void removeRule(index)}
            />
          ))}
        </div>
      ),
    })),
    {
      key: ADVANCED_MEDIA_KEY,
      label: t.advancedMedia,
      children: (
        <MediaPricingEditor
          rules={draft.rules}
          draftId={draft.id}
          onChange={(next) => setDraft({ ...draft, rules: next })}
          showCustomerForm={false}
        />
      ),
    },
  ]

  return (
    <div className="ppd-page" role="tabpanel">
      <p className="ppo-hint">{t.advancedHint}</p>
      <div className="adm-toolbar">
        <h3>{t.rulesHeading}</h3>
        <Button htmlType="button" onClick={addRule}>
          {t.addRule}
        </Button>
      </div>
      {newRule && (
        <Card
          size="small"
          className="pricing-new-rule"
          role="region"
          aria-label={t.newRuleAria}
          title={
            <>
              <span className="pricing-section-kicker">{t.newRuleKicker}</span>
              <h3>{t.newRuleTitle}</h3>
            </>
          }
        >
          <PricingRuleEditor
            rule={newRule}
            onChange={(changes) =>
              setNewRule((current) =>
                current ? { ...current, ...changes } : current,
              )
            }
            onDone={() => {
              setDraft({ ...draft, rules: [...draft.rules, newRule] })
              setNewRule(null)
            }}
            onCancel={() => setNewRule(null)}
            create
          />
        </Card>
      )}
      {groups.length === 0 && <Empty description={t.noRules} />}
      <Collapse
        className="ppd-groups"
        activeKey={opened}
        onChange={(keys) => setOpened(Array.isArray(keys) ? keys : [keys])}
        items={items}
      />
    </div>
  )
}
