import { Button, Tag } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { useAdminConfirm } from '../../../components/common/useAdminConfirm'
import {
  newMediaRule,
  validateMediaRules,
} from '../../../lib/mediaPricingRules'
import type { PricingRule } from '../../../types/pricing'
import { SharedTierItem } from './SharedTierItem'
import { sharedMediaTiersMessages } from './SharedMediaTiers.messages'
import {
  SHARED_PROFILE,
  TIER_COMPONENTS,
  sharedTiersOf,
  tierRange,
  type TierKind,
} from './mediaTierHelpers'

/**
 * The price list for images and videos above the allowance, shared by every checklist and by customer-added work.
 * Only this one list is shown here; per-profile and per-checklist lists live in the advanced tab.
 */
export function SharedMediaTiers({
  rules,
  onChange,
}: {
  rules: PricingRule[]
  onChange: (rules: PricingRule[]) => void
}) {
  const { t } = useI18n(sharedMediaTiersMessages)
  const confirm = useAdminConfirm()
  const kinds: TierKind[] = TIER_COMPONENTS.map((component) =>
    component === 'EXTRA_IMAGE'
      ? { component, title: t.imageTitle, noun: t.imageNoun }
      : { component, title: t.videoTitle, noun: t.videoNoun },
  )
  const [editing, setEditing] = useState<number | null>(null)
  const problems = validateMediaRules(rules)
  const patch = (index: number, changes: Partial<PricingRule>) =>
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...changes } : rule)),
    )
  async function remove(index: number, kind: TierKind) {
    const ok = await confirm({
      title: t.removeConfirm(tierRange(rules[index], kind, t)),
      danger: true,
    })
    if (ok) onChange(rules.filter((_, i) => i !== index))
  }

  return (
    <div className="ppd-media">
      {kinds.map((kind) => {
        const rows = sharedTiersOf(rules, kind.component)
        return (
          <section
            key={kind.component}
            className="ppd-tier-group"
            aria-label={kind.title}
          >
            <header className="pricing-tier-head">
              <div>
                <h4>{kind.title}</h4>
                <p>{t.appliesWhen(kind.noun)}</p>
              </div>
              <Tag bordered={false}>{t.tierCount(rows.length)}</Tag>
            </header>
            {rows.length === 0 && <p className="ppo-empty">{t.empty}</p>}
            {rows.map(({ rule, index }) => (
              <SharedTierItem
                key={rule.ruleKey}
                rule={rule}
                kind={kind}
                editing={editing === index}
                issues={problems
                  .filter((p) => p.index === index)
                  .map((p) => p.issue)}
                onPatch={(changes) => patch(index, changes)}
                onEdit={() => setEditing(index)}
                onDone={() => setEditing(null)}
                onRemove={() => void remove(index, kind)}
              />
            ))}
            <Button
              htmlType="button"
              size="small"
              onClick={() => {
                const next = [
                  ...rules,
                  newMediaRule(SHARED_PROFILE, kind.component, rules),
                ]
                onChange(next)
                setEditing(next.length - 1)
              }}
            >
              {t.add}
            </Button>
          </section>
        )
      })}
    </div>
  )
}
