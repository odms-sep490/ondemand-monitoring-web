import { Checkbox, Input } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import type {
  ChecklistPricingErrors,
  ChecklistPricingForm,
} from '../../lib/checklistPricing'
import type { OverrideForm } from '../../lib/serviceOverrides'
import { checklistMessages } from './checklists.messages'

type Line = {
  key: 'basePrice' | 'images' | 'videos'
  field: 'basePrice' | 'includedImageCount' | 'includedVideoCount'
  label: string
  step: number
}

/** One row of the price grid: the checklist's own value and, from a service, the value for this service only. */
function PriceLine({
  line,
  base,
  invalid,
  onBase,
  service,
  override,
  onOverride,
}: {
  line: Line
  base: string
  invalid: boolean
  onBase: (value: string) => void
  service: boolean
  override: string
  onOverride: (value: string) => void
}) {
  const { t } = useI18n(checklistMessages)
  const id = `checklist-${line.key}`
  return (
    <>
      <label className="checklist-price-label" htmlFor={id}>
        {line.label}
      </label>
      <Input
        id={id}
        type="number"
        min={0}
        step={line.step}
        inputMode="numeric"
        value={base}
        status={invalid ? 'error' : undefined}
        aria-invalid={invalid}
        onChange={(event) => onBase(event.target.value)}
      />
      {service && (
        <Input
          type="number"
          min={0}
          step={line.step}
          inputMode="numeric"
          aria-label={`${t.columnService}: ${line.label}`}
          placeholder={`${t.inheritPlaceholder}: ${base || 0}`}
          value={override}
          onChange={(event) => onOverride(event.target.value)}
        />
      )}
    </>
  )
}

/** Base price and media allowance: a column per scope keeps "for everyone" and "for this service" side by side. */
export function ChecklistPriceGrid({
  pricing,
  pricingErrors,
  onPricing,
  overrides,
  onOverrides,
  service,
  sharedBy,
}: {
  pricing: ChecklistPricingForm
  pricingErrors: ChecklistPricingErrors
  onPricing: (pricing: ChecklistPricingForm) => void
  overrides: OverrideForm
  onOverrides: (overrides: OverrideForm) => void
  service: boolean
  sharedBy: number
}) {
  const { t } = useI18n(checklistMessages)
  const lines: Line[] = [
    { key: 'basePrice', field: 'basePrice', label: t.basePrice, step: 1000 },
    {
      key: 'images',
      field: 'includedImageCount',
      label: t.includedImages,
      step: 1,
    },
    {
      key: 'videos',
      field: 'includedVideoCount',
      label: t.includedVideos,
      step: 1,
    },
  ]
  return (
    <>
      <div
        className={'checklist-price-grid' + (service ? ' has-service' : '')}
        role="group"
        aria-label={t.sectionPricing}
      >
        <span aria-hidden="true" />
        <strong className="checklist-price-head">
          {t.columnBase}
          {sharedBy > 1 ? ` · ${t.sharedBadge(sharedBy)}` : ''}
        </strong>
        {service && (
          <strong className="checklist-price-head">{t.columnService}</strong>
        )}
        {lines.map((line) => (
          <PriceLine
            key={line.key}
            line={line}
            base={pricing[line.field]}
            invalid={pricingErrors[line.field] !== undefined}
            onBase={(value) => onPricing({ ...pricing, [line.field]: value })}
            service={service}
            override={overrides[line.key]}
            onOverride={(value) =>
              onOverrides({ ...overrides, [line.key]: value })
            }
          />
        ))}
      </div>
      {service && (
        <Checkbox
          checked={overrides.required}
          onChange={(event) =>
            onOverrides({ ...overrides, required: event.target.checked })
          }
        >
          {t.requiredLabel}
        </Checkbox>
      )}
    </>
  )
}
