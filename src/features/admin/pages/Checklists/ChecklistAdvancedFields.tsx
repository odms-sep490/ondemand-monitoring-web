import { Checkbox, Collapse, Input, Select } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { AdminField } from '../../components/common/AdminField'
import type {
  ChecklistPricingErrors,
  ChecklistPricingForm,
} from '../../lib/checklistPricing'
import type { ContentForm } from './checklistForm'
import { checklistMessages } from './checklists.messages'

/** Difficulty, standard video length and the per-dimension (area / length / altitude) pricing options. */
export function ChecklistAdvancedFields({
  content,
  onContent,
  pricing,
  pricingErrors,
  onPricing,
}: {
  content: ContentForm
  onContent: (content: ContentForm) => void
  pricing: ChecklistPricingForm
  pricingErrors: ChecklistPricingErrors
  onPricing: (pricing: ChecklistPricingForm) => void
}) {
  const { t } = useI18n(checklistMessages)
  const toggles = [
    ['areaPricingEnabled', t.areaPricing],
    ['lengthPricingEnabled', t.lengthPricing],
    ['altitudePricingEnabled', t.altitudePricing],
  ] as const
  const included = [
    ['includedAreaHa', t.includedArea, 0.001],
    ['includedLengthKm', t.includedLength, 0.001],
    ['includedAltitudeM', t.includedAltitude, 0.01],
  ] as const
  return (
    <Collapse
      className="checklist-section checklist-advanced"
      items={[
        {
          key: 'advanced',
          label: t.sectionAdvanced,
          forceRender: true,
          children: (
            <>
              <AdminField
                id="checklist-difficulty"
                label={t.difficulty}
                required
              >
                <Select
                  id="checklist-difficulty"
                  value={content.difficulty}
                  onChange={(difficulty) =>
                    onContent({ ...content, difficulty })
                  }
                  options={[
                    { value: 'BASIC', label: t.difficultyBasic },
                    { value: 'MEDIUM', label: t.difficultyMedium },
                    { value: 'HARD', label: t.difficultyHard },
                    { value: 'VERY_HARD', label: t.difficultyVeryHard },
                  ]}
                />
              </AdminField>
              <AdminField
                id="checklist-video-duration"
                label={t.videoDuration}
                error={
                  pricingErrors.standardVideoDurationSeconds
                    ? t.invalidPricing
                    : undefined
                }
              >
                <Input
                  id="checklist-video-duration"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={pricing.standardVideoDurationSeconds}
                  onChange={(event) =>
                    onPricing({
                      ...pricing,
                      standardVideoDurationSeconds: event.target.value,
                    })
                  }
                />
              </AdminField>
              <div className="checklist-field-meta">{t.measureHint}</div>
              <div className="checklist-toggles">
                {toggles.map(([field, label]) => (
                  <Checkbox
                    key={field}
                    checked={pricing[field] ?? false}
                    onChange={(event) =>
                      onPricing({ ...pricing, [field]: event.target.checked })
                    }
                  >
                    {label}
                  </Checkbox>
                ))}
              </div>
              {included.map(([field, label, step]) => (
                <AdminField
                  key={field}
                  id={`checklist-${field}`}
                  label={label}
                  error={pricingErrors[field] ? t.invalidPricing : undefined}
                >
                  <Input
                    id={`checklist-${field}`}
                    type="number"
                    min={0}
                    step={step}
                    inputMode="numeric"
                    value={pricing[field] ?? '0'}
                    onChange={(event) =>
                      onPricing({ ...pricing, [field]: event.target.value })
                    }
                  />
                </AdminField>
              ))}
            </>
          ),
        },
      ]}
    />
  )
}
