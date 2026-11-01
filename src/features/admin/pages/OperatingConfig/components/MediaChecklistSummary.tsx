import { Card } from 'antd'

import { displayLocalized, useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import type { ChecklistDefinition } from '../../../api/checklistsApi'
import type { PricingRule } from '../../../types/pricing'
import { mediaPricingEditorMessages } from './MediaPricingEditor.messages'

/** What a checklist currently costs and which of its media tiers are configured in the draft. */
export function MediaChecklistSummary({
  checklist,
  rules,
}: {
  checklist: ChecklistDefinition
  rules: PricingRule[]
}) {
  const { t } = useI18n(mediaPricingEditorMessages)
  const status = (component: 'EXTRA_IMAGE' | 'EXTRA_VIDEO') =>
    rules.some(
      (rule) =>
        rule.checklistDefinitionId === checklist.id &&
        rule.mediaComponent === component,
    )
      ? t.configured
      : t.inherited
  return (
    <Card
      size="small"
      className="pricing-checklist-summary"
      role="region"
      aria-label={t.checklistSection}
      title={t.checklistSection}
    >
      <strong>{displayLocalized(checklist.content)}</strong>
      <p>
        {t.basePrice}: {formatVnd(checklist.basePrice ?? 0)}
      </p>
      <p>
        {t.includedScope}: {checklist.includedImageCount ?? 0} {t.imageUnit} ·{' '}
        {checklist.includedVideoCount ?? 0} {t.videoUnit}
      </p>
      <p>
        {t.extraImageStatus}: {status('EXTRA_IMAGE')}
      </p>
      <p>
        {t.extraVideoStatus}: {status('EXTRA_VIDEO')}
      </p>
    </Card>
  )
}
