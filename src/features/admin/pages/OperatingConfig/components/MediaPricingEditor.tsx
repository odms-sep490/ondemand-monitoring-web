import { Button, Input, Select } from 'antd'
import { useEffect, useId, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { displayLocalized, useI18n } from '../../../../../shared/i18n'
import { checklistsApi } from '../../../api/checklistsApi'
import {
  MEDIA_COMPONENTS,
  isMediaRule,
  isTier,
  newMediaRule,
  validateMediaRules,
  type MediaRuleIssue,
} from '../../../lib/mediaPricingRules'
import type { MediaPricingComponent, PricingRule } from '../../../types/pricing'
import { CustomerAddedPricingForm } from './CustomerAddedPricingForm'
import { isCustomerAddedRule } from './customerAddedFields'
import { MediaChecklistSummary } from './MediaChecklistSummary'
import { MediaDraftPreview } from './MediaDraftPreview'
import { mediaPricingEditorMessages } from './MediaPricingEditor.messages'
import { MediaRuleRow } from './MediaRuleRow'
import { PricingField } from './PricingInputs'

const PROFILE_NAME = /^[A-Za-z0-9_]{1,60}$/

/** The per-profile and per-checklist media price lists (advanced), plus a draft price preview. */
export function MediaPricingEditor({
  rules,
  draftId,
  onChange,
  showCustomerForm = true,
}: {
  rules: PricingRule[]
  draftId: string
  onChange: (rules: PricingRule[]) => void
  showCustomerForm?: boolean
}) {
  const { t } = useI18n(mediaPricingEditorMessages)
  const uid = useId()
  const checklists = useApiQuery(
    (signal) => checklistsApi.list('', true, 0, signal, 200),
    [],
  )
  const [profile, setProfile] = useState('')
  const [checklistId, setChecklistId] = useState('')
  const [component, setComponent] =
    useState<MediaPricingComponent>('INCLUDED_IMAGE')
  const problems = validateMediaRules(rules)
  const selectedChecklist = checklists.data?.items.find(
    (item) => item.id === checklistId,
  )
  useEffect(() => {
    if (selectedChecklist)
      setProfile((selectedChecklist.pricingProfile ?? 'DEFAULT').toUpperCase())
  }, [selectedChecklist])
  const indexed = rules
    .map((rule, index) => ({ rule, index }))
    .filter(
      (entry) => isMediaRule(entry.rule) && !isCustomerAddedRule(entry.rule),
    )
  const patch = (index: number, changes: Partial<PricingRule>) =>
    onChange(
      rules.map((rule, i) => (i === index ? { ...rule, ...changes } : rule)),
    )
  const included = indexed.filter((e) => !isTier(e.rule))
  const extra = indexed.filter((e) => isTier(e.rule))
  const isExtra = component === 'EXTRA_IMAGE' || component === 'EXTRA_VIDEO'

  const row = ({ rule, index }: { rule: PricingRule; index: number }) => (
    <MediaRuleRow
      key={rule.ruleKey}
      rule={rule}
      issues={problems
        .filter((p) => p.index === index)
        .map((p): MediaRuleIssue => p.issue)}
      onPatch={(changes) => patch(index, changes)}
      onRemove={() => onChange(rules.filter((_, i) => i !== index))}
    />
  )

  return (
    <div className="pricing-rules" aria-label={t.title}>
      <h3>{t.title}</h3>
      <p>{t.intro}</p>
      {showCustomerForm && (
        <CustomerAddedPricingForm rules={rules} onChange={onChange} />
      )}
      <p>{t.customHint}</p>
      <PricingField id={`${uid}-target`} label={t.checklistTarget}>
        <Select
          id={`${uid}-target`}
          value={checklistId}
          onChange={setChecklistId}
          options={[
            { value: '', label: t.profileFallback },
            ...(checklists.data?.items ?? []).map((checklist) => ({
              value: checklist.id,
              label: displayLocalized(checklist.content),
            })),
          ]}
        />
      </PricingField>
      {selectedChecklist && (
        <MediaChecklistSummary checklist={selectedChecklist} rules={rules} />
      )}
      {indexed.length === 0 && <p>{t.empty}</p>}
      {included.length > 0 && <h4>{t.includedSection}</h4>}
      {included.map(row)}
      {extra.length > 0 && <h4>{t.extraSection}</h4>}
      {extra.map(row)}
      <div className="pricing-rule-row">
        <PricingField id={`${uid}-profile`} label={t.profile}>
          <Input
            id={`${uid}-profile`}
            value={profile}
            placeholder={t.newProfile}
            onChange={(e) => setProfile(e.target.value)}
          />
        </PricingField>
        <PricingField id={`${uid}-component`} label={t.component}>
          <Select
            id={`${uid}-component`}
            value={component}
            onChange={setComponent}
            options={MEDIA_COMPONENTS.map((c) => ({ value: c, label: t[c] }))}
          />
        </PricingField>
        <Button
          htmlType="button"
          disabled={!PROFILE_NAME.test(profile.trim())}
          onClick={() =>
            onChange([
              ...rules,
              newMediaRule(
                profile,
                component,
                rules,
                isExtra ? checklistId || null : null,
                isExtra ? (selectedChecklist ? displayLocalized(selectedChecklist.content) : null) : null,
              ),
            ])
          }
        >
          {t.add}
        </Button>
      </div>
      {problems.length > 0 && (
        <p role="alert" className="pricing-rule-issues">
          {t.problems}: {problems.length}
        </p>
      )}
      <MediaDraftPreview draftId={draftId} />
    </div>
  )
}
