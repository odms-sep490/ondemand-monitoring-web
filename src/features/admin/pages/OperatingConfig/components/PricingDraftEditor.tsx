import { Alert, Button, Card, Tabs } from 'antd'
import { useId, useState } from 'react'

import { displayLocalized, useI18n } from '../../../../../shared/i18n'
import { pricingTextToLocalized } from '../../../../../shared/lib/pricingPresentation'
import { LocalizedTextInput } from '../../../components/common/LocalizedTextInput'
import {
  LOCALIZED_LIMITS,
  ruleTextValid,
  validateLocalized,
} from '../../../lib/localizedField'
import { isMediaRule, validateMediaRules } from '../../../lib/mediaPricingRules'
import type { PricingPolicy } from '../../../types/pricing'
import { CustomerAddedPricingForm } from './CustomerAddedPricingForm'
import { PricingAdvancedRules } from './PricingAdvancedRules'
import { pricingDraftEditorMessages } from './PricingDraftEditor.messages'
import { PricingGuardrails } from './PricingGuardrails'
import { SharedMediaTiers } from './SharedMediaTiers'
import { sharedMediaTiersMessages } from './SharedMediaTiers.messages'
import { guardrailsValid } from './guardrailRules'
import './pricingDraftEditor.css'

type Tab = 'common' | 'advanced'

/**
 * Edits a draft policy. What admins change most (limits, customer-added prices, the shared media price list) is on the
 * first page; the full rule list, grouped and folded, and per-profile media prices are on the second.
 */
export function PricingDraftEditor({
  draft,
  setDraft,
  busy,
  dirty,
  onSave,
  onPublish,
  onCancel,
}: {
  draft: PricingPolicy
  setDraft: (policy: PricingPolicy) => void
  busy: boolean
  /** Edits not yet saved on the server. */
  dirty: boolean
  onSave: () => void
  onPublish: () => void
  onCancel: () => void
}) {
  const { t } = useI18n(pricingDraftEditorMessages)
  const { t: tiers } = useI18n(sharedMediaTiersMessages)
  const nameId = useId()
  const [tab, setTab] = useState<Tab>('common')
  const problems = validateMediaRules(draft.rules)
  const mediaValid = problems.length === 0
  const guardrailsOk = guardrailsValid(draft)
  const ordinary = draft.rules.filter((rule) => !isMediaRule(rule))
  const nameValue = pricingTextToLocalized(draft.name)
  const nameValid =
    validateLocalized(nameValue, {
      required: true,
      maxEncoded: LOCALIZED_LIMITS.policyName,
    }) === null
  const rulesTextValid = ordinary.every((rule) => ruleTextValid(rule.description))
  const canSubmit = mediaValid && guardrailsOk && nameValid && rulesTextValid
  const setRules = (rules: PricingPolicy['rules']) =>
    setDraft({ ...draft, rules })

  const actions = (
    <div className="ppd-actions">
      <Button disabled={busy} onClick={onCancel}>
        {dirty ? t.discardChanges : t.close}
      </Button>
      <Button disabled={busy || !canSubmit} onClick={onSave}>
        {t.saveDraft}
      </Button>
      <Button type="primary" disabled={busy || !canSubmit} onClick={onPublish}>
        {t.publish}
      </Button>
    </div>
  )

  return (
    <div className="ppd">
      <div className="ppd-bar">
        <div>
          <span className="ppo-eyebrow is-draft">{t.draftEyebrow}</span>
          <h3>{t.policyTitle(draft.version)}</h3>
          <p>{t.policyIntro}</p>
          {dirty && <span className="pricing-dirty">{t.dirty}</span>}
        </div>
        {actions}
      </div>
      {!mediaValid && (
        <Alert
          type="warning"
          showIcon
          role="alert"
          message={t.mediaInvalid}
          description={
            <ul>
              {problems.map((problem) => {
                const rule = draft.rules[problem.index]
                return (
                  <li key={`${problem.index}-${problem.issue}`}>
                    <b>
                      {rule.pricingProfile ?? '?'} ·{' '}
                      {rule.mediaComponent ?? '?'}
                      {rule.checklistDefinitionName
                        ? ` · ${displayLocalized(rule.checklistDefinitionName)}`
                        : ''}{' '}
                      ({rule.minValue ?? 0}–{rule.maxValue ?? '∞'})
                    </b>
                    : {tiers.issues[problem.issue] ?? problem.issue}
                  </li>
                )
              })}
            </ul>
          }
          action={
            <Button
              htmlType="button"
              size="small"
              onClick={() => setTab('advanced')}
            >
              {t.openAdvanced}
            </Button>
          }
        />
      )}

      <Tabs
        className="adm-tabs"
        activeKey={tab}
        onChange={(key) => setTab(key as Tab)}
        items={[
          { key: 'common', label: t.tabBasic },
          { key: 'advanced', label: t.tabAdvanced(ordinary.length) },
        ]}
      />

      {tab === 'common' && (
        <div className="ppd-page" role="tabpanel">
          <div className="ppd-name">
            <label htmlFor={`${nameId}-vi`}>{t.policyName}</label>
            <LocalizedTextInput
              id={nameId}
              label={t.policyName}
              required
              value={nameValue}
              maxEncoded={LOCALIZED_LIMITS.policyName}
              onChange={(value) =>
                setDraft({ ...draft, name: JSON.stringify(value) })
              }
            />
          </div>

          <Card
            size="small"
            className="ppo-card"
            role="region"
            aria-label={t.guardrailsTitle}
            title={t.guardrailsTitle}
          >
            <p className="ppo-hint">{t.guardrailsHint}</p>
            <PricingGuardrails
              draft={draft}
              setDraft={setDraft}
              valid={guardrailsOk}
            />
          </Card>

          <CustomerAddedPricingForm rules={draft.rules} onChange={setRules} />

          <Card
            size="small"
            className="ppo-card"
            role="region"
            aria-label={t.mediaTitle}
            title={t.mediaTitle}
          >
            <p className="ppo-hint">{t.mediaHint}</p>
            <SharedMediaTiers rules={draft.rules} onChange={setRules} />
          </Card>
        </div>
      )}

      {tab === 'advanced' && (
        <PricingAdvancedRules draft={draft} setDraft={setDraft} />
      )}
      <div className="ppd-foot">{actions}</div>
    </div>
  )
}
