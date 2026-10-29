import { Alert, Button, Checkbox, Form, Input, Select, Tabs } from 'antd'
import { useState, type FormEvent, type ReactNode } from 'react'
import { mgrPopupContainer } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { PriceBreakdownView } from '../../../../shared/components/odm/PriceBreakdownView'
import {
  checklistPricingApi,
  type AdminPreviewItem,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import {
  checklistsApi,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import {
  pricingToForm,
  validatePricingForm,
  type ChecklistPricingErrors,
  type ChecklistPricingForm,
} from '../../lib/checklistPricing'
import {
  inheritWhenUnchanged,
  parseOverrides,
  type OverrideForm,
} from '../../lib/serviceOverrides'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'

/** The service whose template the checklist is being configured in. */
export type ConfigServiceContext = {
  id: string
  name: string
  rows: ServiceChecklist[]
  row: ServiceChecklist
}

/** One entry per non-empty line, trimmed; the order is the order of the lines. */
const toLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

type Content = {
  content: string
  description: string
  steps: string
  inputs: string
  outputs: string
  difficulty: NonNullable<ChecklistDefinition['difficulty']>
}

type PriceRow = {
  key: 'basePrice' | 'images' | 'videos'
  field: 'basePrice' | 'includedImageCount' | 'includedVideoCount'
  label: string
  step: number
}

/**
 * The single form for a checklist. Everything that can be configured is on this one screen:
 * what the work is, what it costs (the checklist's own value and, when opened from a service, this service's own),
 * and whether the customer may drop it. A column per scope keeps "for everyone" and "for this service" side by side.
 */
export function ChecklistConfigForm({
  row,
  service,
  close,
  saved,
  extra,
}: {
  /** The library checklist; omitted when creating a new one. */
  row?: ChecklistDefinition
  /** Present when opened from a service template. */
  service?: ConfigServiceContext
  close: () => void
  saved: () => void
  /** Rendered above the fields, e.g. the "private copy" offer when the checklist is shared. */
  extra?: ReactNode
}) {
  const { t } = useI18n(checklistMessages)
  const link = service?.row
  const [content, setContent] = useState<Content>({
    content: row?.content ?? '',
    description: row?.description ?? '',
    steps: (row?.executionSteps ?? []).join('\n'),
    inputs: (row?.inputRequirements ?? []).join('\n'),
    outputs: (row?.expectedOutputs ?? []).join('\n'),
    difficulty: row?.difficulty ?? 'BASIC',
  })
  const [pricing, setPricing] = useState<ChecklistPricingForm>(
    pricingToForm(row ?? {}),
  )
  const [overrides, setOverrides] = useState<OverrideForm>({
    basePrice: link?.basePriceOverride?.toString() ?? '',
    images: link?.includedImageCountOverride?.toString() ?? '',
    videos: link?.includedVideoCountOverride?.toString() ?? '',
    profile: link?.pricingProfileOverride ?? '',
    required: link?.required === true,
  })
  // What the form looked like when it opened, to tell a shared change from a change for this service only.
  const [initialShared] = useState(() => JSON.stringify([content, pricing]))
  const [initialOverrides] = useState(() => JSON.stringify(overrides))
  const [pricingErrors, setPricingErrors] = useState<ChecklistPricingErrors>({})
  const [acknowledged, setAcknowledged] = useState(false)
  const [page, setPage] = useState<'content' | 'pricing'>('content')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ServicePricePreview | null>(null)

  const sharedBy = row?.usedByServiceCount ?? 0
  const shared = sharedBy > 1
  const sharedDirty = JSON.stringify([content, pricing]) !== initialShared
  const overridesDirty = JSON.stringify(overrides) !== initialOverrides
  const needsAck = shared && sharedDirty && !acknowledged

  /** Validates everything and returns what to send, or null after showing the problem. */
  function collect() {
    const text = content.content.trim()
    if (!text || text.length > 500) {
      setPage('content')
      setError(t.required)
      return null
    }
    const checked =
      // The profile is not editable here, so it must not be able to block a save.
      validatePricingForm({ ...pricing, pricingProfile: '' })
    if (!checked.ok) {
      setPricingErrors(checked.errors)
      setPage('pricing')
      setError(t.invalidPricing)
      return null
    }
    setPricingErrors({})
    const guidance = {
      description: content.description.trim(),
      executionSteps: toLines(content.steps),
      inputRequirements: toLines(content.inputs),
      expectedOutputs: toLines(content.outputs),
    }
    if (
      guidance.description.length > 4000 ||
      [
        guidance.executionSteps,
        guidance.inputRequirements,
        guidance.expectedOutputs,
      ].some(
        (list) => list.length > 30 || list.some((line) => line.length > 500),
      )
    ) {
      setPage('content')
      setError(t.guidanceInvalid)
      return null
    }
    let override = null
    if (service) {
      const parsed = parseOverrides(overrides)
      if (!parsed.ok) {
        setPage('pricing')
        setError(t.invalidPricing)
        return null
      }
      override = inheritWhenUnchanged(parsed.value, {
        basePrice: checked.value.basePrice ?? 0,
        includedImageCount: checked.value.includedImageCount ?? 0,
        includedVideoCount: checked.value.includedVideoCount ?? 0,
      })
    }
    setError(null)
    // The pricing profile is not edited on this screen. It is left out of the request so the backend keeps the stored
    // value (sending an empty one would clear it).
    const { pricingProfile: _keptByBackend, ...rest } = checked.value
    void _keptByBackend
    const definition = { ...rest, ...guidance }
    return { text, definition, override }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const data = collect()
    if (!data) return
    if (needsAck) {
      setError(t.sharedAck(sharedBy))
      return
    }
    setBusy(true)
    try {
      if (!row) {
        await checklistsApi.create(
          data.text,
          content.difficulty,
          data.definition,
        )
      } else if (!service || sharedDirty) {
        await checklistsApi.update(
          row.id,
          data.text,
          content.difficulty,
          data.definition,
        )
      }
      if (service && link && data.override && overridesDirty) {
        await checklistsApi.updatePricing(service.id, link.checklistId, {
          ...data.override,
          expectedVersion: link.version,
        })
      }
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  /** The price of the whole service as it would be with the unsaved values, without saving anything. */
  async function check() {
    if (busy || !service || !link) return
    const data = collect()
    if (!data) return
    setBusy(true)
    try {
      const items: AdminPreviewItem[] = service.rows.map((other) =>
        other.checklistId === link.checklistId
          ? {
              checklistId: other.checklistId,
              basePrice:
                data.override?.basePriceOverride ?? data.definition.basePrice,
              includedImageCount:
                data.override?.includedImageCountOverride ??
                data.definition.includedImageCount,
              includedVideoCount:
                data.override?.includedVideoCountOverride ??
                data.definition.includedVideoCount,
              pricingProfile:
                data.override?.pricingProfileOverride ??
                (pricing.pricingProfile.trim().toUpperCase() || undefined),
            }
          : { checklistId: other.checklistId },
      )
      setPreview(
        await checklistPricingApi.adminPreview({
          serviceId: service.id,
          items,
        }),
      )
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  const priceRows: PriceRow[] = [
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

  const contentPanel = (
    <fieldset className="checklist-section checklist-content-grid">
      <legend>{t.sectionContent}</legend>
      <Form.Item label={t.content} required htmlFor="checklist-content" validateStatus={error !== null ? 'error' : undefined}>
        <Input.TextArea
          id="checklist-content"
          required
          rows={2}
          maxLength={500}
          value={content.content}
          onChange={(event) => setContent({ ...content, content: event.target.value })}
          aria-describedby="checklist-content-hint"
          aria-invalid={error !== null}
        />
      </Form.Item>
      <div id="checklist-content-hint" className="checklist-field-meta">
        <span>{t.contentHint}</span>
        <span>{content.content.length}/500</span>
      </div>
      <Form.Item label={t.descriptionLabel} htmlFor="checklist-description">
        <Input.TextArea
          id="checklist-description"
          rows={3}
          maxLength={4000}
          value={content.description}
          onChange={(event) => setContent({ ...content, description: event.target.value })}
          aria-describedby="checklist-description-hint"
        />
      </Form.Item>
      <div id="checklist-description-hint" className="checklist-field-meta">
        <span>{t.descriptionHint}</span>
        <span>{content.description.length}/4000</span>
      </div>
      {(
        [
          ['steps', t.stepsLabel, t.stepsHint],
          ['inputs', t.inputsLabel, t.inputsHint],
          ['outputs', t.outputsLabel, t.outputsHint],
        ] as const
      ).map(([key, label, hint]) => (
        <div key={key} className={key === 'steps' ? undefined : 'is-half'}>
          <Form.Item label={label} htmlFor={`checklist-${key}`}>
            <Input.TextArea
              id={`checklist-${key}`}
              rows={key === 'steps' ? 4 : 3}
              value={content[key]}
              onChange={(event) => setContent({ ...content, [key]: event.target.value })}
              aria-describedby={`checklist-${key}-hint`}
            />
          </Form.Item>
          <div id={`checklist-${key}-hint`} className="checklist-field-meta">
            <span>{hint}</span>
          </div>
        </div>
      ))}
    </fieldset>
  )

  const pricingPanel = (
    <>
      <fieldset className="checklist-section">
        <legend>{t.sectionPricing}</legend>
        <p className="checklist-field-meta is-block">
          {service ? t.pricingScopeHint : t.pricingHint}{' '}
          <a href={adminHref({ screen: 'operatingConfig' })}>{t.openPricingPolicy}</a>
        </p>
        <div
          className={'checklist-price-grid' + (service ? ' has-service' : '')}
          role="group"
          aria-label={t.sectionPricing}
        >
          <span aria-hidden="true" />
          <strong className="checklist-price-head">
            {t.columnBase}
            {shared ? ` · ${t.sharedBadge(sharedBy)}` : ''}
          </strong>
          {service && <strong className="checklist-price-head">{t.columnService}</strong>}
          {priceRows.map((item) => (
            <PriceLine
              key={item.key}
              id={`checklist-${item.key}`}
              label={item.label}
              step={item.step}
              base={pricing[item.field]}
              invalid={pricingErrors[item.field] !== undefined}
              onBase={(value) => setPricing({ ...pricing, [item.field]: value })}
              service={service !== undefined}
              override={overrides[item.key]}
              onOverride={(value) => setOverrides({ ...overrides, [item.key]: value })}
            />
          ))}
        </div>
        {service && (
          <Checkbox
            checked={overrides.required}
            onChange={(event) => setOverrides({ ...overrides, required: event.target.checked })}
          >
            {t.requiredLabel}
          </Checkbox>
        )}
      </fieldset>

      <details className="checklist-section checklist-advanced">
        <summary>{t.sectionAdvanced}</summary>
        <Form.Item label={t.difficultyLabel} required htmlFor="checklist-difficulty">
          <Select<Content['difficulty']>
            id="checklist-difficulty"
            value={content.difficulty}
            onChange={(difficulty) => setContent({ ...content, difficulty })}
            getPopupContainer={mgrPopupContainer}
            options={[
              { value: 'BASIC', label: t.difficultyBasic },
              { value: 'MEDIUM', label: t.difficultyMedium },
              { value: 'HARD', label: t.difficultyHard },
              { value: 'VERY_HARD', label: t.difficultyVeryHard },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={t.videoDuration}
          htmlFor="checklist-video-duration"
          validateStatus={pricingErrors.standardVideoDurationSeconds ? 'error' : undefined}
          help={pricingErrors.standardVideoDurationSeconds ? t.invalidPricing : undefined}
        >
          <Input
            id="checklist-video-duration"
            type="number"
            min={0}
            inputMode="numeric"
            value={pricing.standardVideoDurationSeconds}
            onChange={(event) =>
              setPricing({ ...pricing, standardVideoDurationSeconds: event.target.value })
            }
          />
        </Form.Item>
        <div className="checklist-field-meta">{t.dimensionsHint}</div>
        {(
          [
            ['areaPricingEnabled', t.areaPricing],
            ['lengthPricingEnabled', t.lengthPricing],
            ['altitudePricingEnabled', t.altitudePricing],
          ] as const
        ).map(([field, label]) => (
          <div key={field}>
            <Checkbox
              checked={pricing[field] ?? false}
              onChange={(event) => setPricing({ ...pricing, [field]: event.target.checked })}
            >
              {label}
            </Checkbox>
          </div>
        ))}
        {(
          [
            ['includedAreaHa', t.includedArea, 0.001],
            ['includedLengthKm', t.includedLength, 0.001],
            ['includedAltitudeM', t.includedAltitude, 0.01],
          ] as const
        ).map(([field, label, step]) => (
          <Form.Item
            key={field}
            label={label}
            htmlFor={`checklist-${field}`}
            validateStatus={pricingErrors[field] ? 'error' : undefined}
            help={pricingErrors[field] ? t.invalidPricing : undefined}
          >
            <Input
              id={`checklist-${field}`}
              type="number"
              min={0}
              step={step}
              inputMode="numeric"
              value={pricing[field] ?? '0'}
              onChange={(event) => setPricing({ ...pricing, [field]: event.target.value })}
            />
          </Form.Item>
        ))}
      </details>
    </>
  )

  return (
    <Form
      id="checklist-config"
      layout="vertical"
      className="checklist-dialog"
      noValidate
      onSubmitCapture={(event) => void submit(event as unknown as FormEvent)}
    >
      {!shared && extra}
      {shared && (
        <Alert
          type="warning"
          showIcon
          role="note"
          message={t.sharedWarning(sharedBy)}
          description={
            <>
              {extra}
              {sharedDirty && (
                <Checkbox
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                >
                  {t.sharedAck(sharedBy)}
                </Checkbox>
              )}
            </>
          }
        />
      )}

      <Tabs
        className="checklist-tabs"
        aria-label={t.configTitle}
        activeKey={page}
        onChange={(key) => setPage(key as 'content' | 'pricing')}
        items={[
          { key: 'content', label: t.sectionContent, children: contentPanel, forceRender: true },
          { key: 'pricing', label: t.sectionPricing, children: pricingPanel, forceRender: true },
        ]}
      />

      {preview && <PriceBreakdownView preview={preview} />}
      {error && <Alert type="error" showIcon role="alert" message={error} />}
      <div className="checklist-form-actions">
        <Button disabled={busy} onClick={close}>
          {t.cancel}
        </Button>
        {service && (
          <Button disabled={busy} onClick={() => void check()}>
            {t.whatIf}
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={busy} disabled={needsAck}>
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </Form>
  )
}

/** One row of the price grid: the checklist's own value and, from a service, the value for this service only. */
function PriceLine({
  id,
  label,
  step,
  base,
  invalid,
  onBase,
  service,
  override,
  onOverride,
}: {
  id: string
  label: string
  step: number
  base: string
  invalid: boolean
  onBase: (value: string) => void
  service: boolean
  override: string
  onOverride: (value: string) => void
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <>
      <label className="checklist-price-label" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        type="number"
        min={0}
        step={step}
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
          step={step}
          inputMode="numeric"
          aria-label={`${t.columnService}: ${label}`}
          placeholder={`${t.inheritPlaceholder}: ${base || 0}`}
          value={override}
          onChange={(event) => onOverride(event.target.value)}
        />
      )}
    </>
  )
}
