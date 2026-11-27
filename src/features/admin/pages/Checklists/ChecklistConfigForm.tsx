import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { Button, FormField } from '../../../../shared/components/ui'
import { Icon } from '../../../../shared/components/Icon'
import {
  checklistsApi,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import {
  evidenceToForm,
  validateEvidenceForm,
  type ChecklistEvidenceErrors,
  type ChecklistEvidenceForm,
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
}

type EvidenceRow = {
  key: 'images' | 'videos'
  field: 'includedImageCount' | 'includedVideoCount'
  label: string
  step: number
}

const MAX_IMAGE_CRITERIA = 8
const MAX_IMAGE_CRITERION_LENGTH = 300

/**
 * The checklist editor manages its work description and evidence requirements. Base price settings live in the
 * Operating Config pricing tab; service templates can only vary evidence allowances and whether the item is required.
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
  saved: (updated?: ChecklistDefinition) => void
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
  })
  const [evidence, setEvidence] = useState<ChecklistEvidenceForm>(
    evidenceToForm(row ?? {}),
  )
  const [criteria, setCriteria] = useState(() =>
    (row?.imageAssessmentCriteria ?? []).map((value, id) => ({ id, value })),
  )
  const nextCriterionId = useRef(criteria.length)
  const [imageAssessmentEnabled, setImageAssessmentEnabled] = useState(
    row?.imageAssessmentEnabled ?? true,
  )
  const [overrides, setOverrides] = useState<OverrideForm>({
    images: link?.includedImageCountOverride?.toString() ?? '',
    videos: link?.includedVideoCountOverride?.toString() ?? '',
    required: link?.required === true,
  })
  // Last saved values distinguish shared changes from changes for this service only.
  const [initialShared, setInitialShared] = useState(() =>
    JSON.stringify([content, evidence]),
  )
  const [initialOverrides, setInitialOverrides] = useState(() =>
    JSON.stringify(overrides),
  )
  const [savedCriteria, setSavedCriteria] = useState(
    row?.imageAssessmentCriteria ?? [],
  )
  const [savedEnabled, setSavedEnabled] = useState(
    row?.imageAssessmentEnabled ?? true,
  )
  const [saveSucceeded, setSaveSucceeded] = useState(false)
  const [evidenceErrors, setEvidenceErrors] = useState<ChecklistEvidenceErrors>(
    {},
  )
  const [acknowledged, setAcknowledged] = useState(false)
  const [page, setPage] = useState<'content' | 'evidence'>('content')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assignedDeviceTypes, setAssignedDeviceTypes] = useState(
    row?.deviceTypes ?? [],
  )
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('')
  const [deviceTypeBusy, setDeviceTypeBusy] = useState<string | null>(null)
  const [deviceTypeError, setDeviceTypeError] = useState<string | null>(null)
  const deviceTypeQuery = useApiQuery(
    (signal) =>
      row
        ? checklistsApi.deviceTypes(signal)
        : Promise.resolve({
            items: [],
            page: 0,
            totalItems: 0,
            totalPages: 0,
            first: true,
            last: true,
          }),
    [row?.id],
  )
  const availableDeviceTypes = (deviceTypeQuery.data?.items ?? []).filter(
    (type) => !assignedDeviceTypes.some((assigned) => assigned.id === type.id),
  )

  const sharedBy = row?.usedByServiceCount ?? 0
  const shared = sharedBy > 1
  const photoCapable = Number(evidence.includedImageCount) > 0
  const imageAssessmentCriteria = criteria.map(({ value }) => value.trim())
  const criteriaChanged =
    imageAssessmentCriteria.length !== savedCriteria.length ||
    imageAssessmentCriteria.some(
      (value, index) => value !== savedCriteria[index],
    )
  const imageAssessmentEnabledChanged = imageAssessmentEnabled !== savedEnabled
  const sharedDirty =
    JSON.stringify([content, evidence]) !== initialShared ||
    criteriaChanged ||
    imageAssessmentEnabledChanged
  const overridesDirty = JSON.stringify(overrides) !== initialOverrides
  const needsAck = shared && sharedDirty && !acknowledged

  /** Validates the checklist content and evidence settings before building the request. */
  function collect() {
    const text = content.content.trim()
    if (!text || text.length > 500) {
      setPage('content')
      setError(t.required)
      return null
    }
    const checked = validateEvidenceForm(evidence)
    if (!checked.ok) {
      setEvidenceErrors(checked.errors)
      setPage('evidence')
      setError(t.invalidPricing)
      return null
    }
    setEvidenceErrors({})
    if (
      imageAssessmentCriteria.length > MAX_IMAGE_CRITERIA ||
      imageAssessmentCriteria.some(
        (value) => !value || value.length > MAX_IMAGE_CRITERION_LENGTH,
      )
    ) {
      setPage('evidence')
      setError(
        t.imageCriteriaInvalid(MAX_IMAGE_CRITERIA, MAX_IMAGE_CRITERION_LENGTH),
      )
      return null
    }
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
        setPage('evidence')
        setError(t.invalidPricing)
        return null
      }
      override = inheritWhenUnchanged(parsed.value, {
        includedImageCount: checked.value.includedImageCount ?? 0,
        includedVideoCount: checked.value.includedVideoCount ?? 0,
      })
    }
    setError(null)
    // Base price is edited in the single Base Checklist pricing screen. This form only edits evidence requirements.
    const definition = {
      includedImageCount: checked.value.includedImageCount,
      includedVideoCount: checked.value.includedVideoCount,
      ...(checked.value.standardVideoDurationSeconds == null
        ? {}
        : {
            standardVideoDurationSeconds:
              checked.value.standardVideoDurationSeconds,
          }),
      ...guidance,
      ...(criteriaChanged ? { imageAssessmentCriteria } : {}),
      ...(imageAssessmentEnabledChanged ? { imageAssessmentEnabled } : {}),
    }
    return { text, definition, override }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setSaveSucceeded(false)
    const data = collect()
    if (!data) return
    if (needsAck) {
      setError(t.sharedAck(sharedBy))
      return
    }
    setBusy(true)
    try {
      let updated = row
      if (!row) {
        await checklistsApi.create(data.text, data.definition)
      } else if (!service || sharedDirty) {
        updated = await checklistsApi.update(row.id, data.text, data.definition)
      }
      if (service && link && data.override && overridesDirty) {
        await checklistsApi.updateRequirements(service.id, link.checklistId, {
          ...data.override,
          expectedVersion: link.version,
        })
      }
      setInitialShared(JSON.stringify([content, evidence]))
      setInitialOverrides(JSON.stringify(overrides))
      setSavedCriteria(imageAssessmentCriteria)
      setSavedEnabled(imageAssessmentEnabled)
      setSaveSucceeded(true)
      saved(updated)
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  async function addDeviceType() {
    if (!row || !selectedDeviceTypeId || deviceTypeBusy) return
    setDeviceTypeBusy(selectedDeviceTypeId)
    setDeviceTypeError(null)
    try {
      const requirement = await checklistsApi.addDeviceType(
        row.id,
        selectedDeviceTypeId,
      )
      setAssignedDeviceTypes((current) =>
        [...current, requirement.deviceType].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      )
      setSelectedDeviceTypeId('')
    } catch (cause) {
      setDeviceTypeError(checklistError(cause, t))
    } finally {
      setDeviceTypeBusy(null)
    }
  }

  async function removeDeviceType(deviceTypeId: string) {
    if (!row || deviceTypeBusy) return
    setDeviceTypeBusy(deviceTypeId)
    setDeviceTypeError(null)
    try {
      await checklistsApi.removeDeviceType(row.id, deviceTypeId)
      setAssignedDeviceTypes((current) =>
        current.filter((type) => type.id !== deviceTypeId),
      )
    } catch (cause) {
      setDeviceTypeError(checklistError(cause, t))
    } finally {
      setDeviceTypeBusy(null)
    }
  }

  const evidenceRows: EvidenceRow[] = [
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
    <form
      id="checklist-config"
      className="checklist-dialog checklist-config-form"
      noValidate
      onSubmit={(event) => void submit(event)}
    >
      {!shared && extra}
      {shared && (
        <div className="checklist-banner is-warning" role="note">
          <p>{t.sharedWarning(sharedBy)}</p>
          {extra}
          {sharedDirty && (
            <label className="adm-check">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>{t.sharedAck(sharedBy)}</span>
            </label>
          )}
        </div>
      )}

      <div className="checklist-tabs" role="tablist" aria-label={t.configTitle}>
        {(
          [
            ['content', t.sectionContent],
            ['evidence', t.sectionEvidence],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`checklist-tab-${id}`}
            aria-selected={page === id}
            aria-controls={`checklist-page-${id}`}
            className={'checklist-tab' + (page === id ? ' is-active' : '')}
            onClick={() => setPage(id)}
          >
            <Icon
              name={id === 'content' ? 'file-text' : 'camera'}
              width={16}
              height={16}
              aria-hidden="true"
            />
            {label}
          </button>
        ))}
      </div>

      <div
        id="checklist-page-content"
        role="tabpanel"
        aria-labelledby="checklist-tab-content"
        hidden={page !== 'content'}
      >
        <fieldset className="checklist-section checklist-content-grid">
          <legend>{t.sectionContent}</legend>
          <FormField id="checklist-content" label={t.content} required>
            <textarea
              id="checklist-content"
              className="odm-inp"
              required
              rows={2}
              maxLength={500}
              value={content.content}
              onChange={(event) =>
                setContent({ ...content, content: event.target.value })
              }
              aria-describedby="checklist-content-hint"
              aria-invalid={error !== null}
            />
          </FormField>
          <div id="checklist-content-hint" className="checklist-field-meta">
            <span>{t.contentHint}</span>
            <span>{content.content.length}/500</span>
          </div>
          <FormField id="checklist-description" label={t.descriptionLabel}>
            <textarea
              id="checklist-description"
              className="odm-inp"
              rows={2}
              maxLength={4000}
              value={content.description}
              onChange={(event) =>
                setContent({ ...content, description: event.target.value })
              }
              aria-describedby="checklist-description-hint"
            />
          </FormField>
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
            <div
              key={key}
              className={key === 'steps' ? 'checklist-config-steps' : 'is-half'}
            >
              <FormField id={`checklist-${key}`} label={label}>
                <textarea
                  id={`checklist-${key}`}
                  className="odm-inp"
                  rows={key === 'steps' ? 3 : 2}
                  value={content[key]}
                  onChange={(event) =>
                    setContent({ ...content, [key]: event.target.value })
                  }
                  aria-describedby={`checklist-${key}-hint`}
                />
              </FormField>
              <div
                id={`checklist-${key}-hint`}
                className="checklist-field-meta"
              >
                <span>{hint}</span>
              </div>
            </div>
          ))}
        </fieldset>
        {row && (
          <section
            className="checklist-device-types"
            aria-labelledby="checklist-device-types-title"
          >
            <div>
              <h3 id="checklist-device-types-title">{t.deviceTypesTitle}</h3>
              <p>{t.deviceTypesHint}</p>
            </div>
            {assignedDeviceTypes.length > 0 ? (
              <ul className="checklist-device-type-list">
                {assignedDeviceTypes.map((type) => (
                  <li key={type.id}>
                    <span>
                      <strong>{type.name}</strong>
                      <small>{type.code}</small>
                    </span>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh odm-btn-sm"
                      disabled={deviceTypeBusy !== null}
                      aria-label={t.removeDeviceType(type.name)}
                      onClick={() => void removeDeviceType(type.id)}
                    >
                      {t.removeDeviceTypeShort}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="checklist-field-meta is-block">
                {t.deviceTypesEmpty}
              </p>
            )}
            <div className="checklist-device-type-add">
              <select
                className="odm-inp"
                aria-label={t.deviceTypeSelect}
                value={selectedDeviceTypeId}
                disabled={deviceTypeQuery.loading || deviceTypeBusy !== null}
                onChange={(event) =>
                  setSelectedDeviceTypeId(event.target.value)
                }
              >
                <option value="">{t.deviceTypeSelectPlaceholder}</option>
                {availableDeviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="odm-btn"
                disabled={!selectedDeviceTypeId || deviceTypeBusy !== null}
                onClick={() => void addDeviceType()}
              >
                {deviceTypeBusy === selectedDeviceTypeId
                  ? t.deviceTypeAdding
                  : t.deviceTypeAdd}
              </button>
            </div>
            {(deviceTypeQuery.error !== undefined || deviceTypeError) && (
              <p className="checklist-banner is-error" role="alert">
                {deviceTypeError ?? t.deviceTypesLoadError}
              </p>
            )}
          </section>
        )}
      </div>

      <div
        id="checklist-page-evidence"
        role="tabpanel"
        aria-labelledby="checklist-tab-evidence"
        hidden={page !== 'evidence'}
      >
        <fieldset className="checklist-section checklist-config-evidence">
          <legend>{t.sectionEvidence}</legend>
          <p className="checklist-field-meta is-block">
            {t.evidenceConfigHint}
          </p>
          <div
            className={'checklist-price-grid' + (service ? ' has-service' : '')}
            role="group"
            aria-label={t.sectionEvidence}
          >
            <span aria-hidden="true" />
            <strong className="checklist-price-head">
              {t.columnBase}
              {shared ? ` · ${t.sharedBadge(sharedBy)}` : ''}
            </strong>
            {service && (
              <strong className="checklist-price-head">
                {t.columnService}
              </strong>
            )}
            {evidenceRows.map((item) => (
              <PriceLine
                key={item.key}
                id={`checklist-${item.key}`}
                label={item.label}
                step={item.step}
                base={evidence[item.field]}
                invalid={evidenceErrors[item.field] !== undefined}
                onBase={(value) =>
                  setEvidence({ ...evidence, [item.field]: value })
                }
                service={service !== undefined}
                override={overrides[item.key]}
                onOverride={(value) =>
                  setOverrides({ ...overrides, [item.key]: value })
                }
              />
            ))}
          </div>
          {service && (
            <label className="adm-check">
              <input
                type="checkbox"
                checked={overrides.required}
                onChange={(event) =>
                  setOverrides({ ...overrides, required: event.target.checked })
                }
              />
              <span>{t.requiredLabel}</span>
            </label>
          )}
          <div className="checklist-config-duration">
            <FormField
              id="checklist-video-duration"
              label={t.videoDuration}
              error={
                evidenceErrors.standardVideoDurationSeconds
                  ? t.invalidPricing
                  : undefined
              }
            >
              <input
                id="checklist-video-duration"
                className="odm-inp"
                type="number"
                min={0}
                inputMode="numeric"
                value={evidence.standardVideoDurationSeconds}
                onChange={(event) =>
                  setEvidence({
                    ...evidence,
                    standardVideoDurationSeconds: event.target.value,
                  })
                }
              />
            </FormField>
          </div>
        </fieldset>
        <fieldset
          className="checklist-section checklist-config-ai"
          disabled={busy}
        >
          <legend>
            <Icon name="sparkle" width={15} height={15} aria-hidden="true" />{' '}
            {t.imageCriteriaTitle}
          </legend>
          <label className="checklist-ai-switch">
            <input
              type="checkbox"
              role="switch"
              checked={imageAssessmentEnabled}
              onChange={(event) =>
                setImageAssessmentEnabled(event.target.checked)
              }
            />
            <span>{t.imageAssessmentEnabled}</span>
          </label>
          <p className="checklist-field-meta is-block">
            {t.imageAssessmentEnabledHint}
          </p>
          {!photoCapable && (
            <p className="checklist-field-meta is-block">
              {t.imageCriteriaDisabled}
            </p>
          )}
          <>
            <p className="checklist-field-meta is-block">
              {t.imageCriteriaHint}
            </p>
            <div className="checklist-criteria-grid">
              {criteria.map(({ id, value }, index) => (
                <div key={id} className="checklist-criterion">
                  <FormField
                    id={`checklist-image-criterion-${id}`}
                    label={t.imageCriterionLabel(index + 1)}
                  >
                    <textarea
                      id={`checklist-image-criterion-${id}`}
                      className="odm-inp"
                      rows={2}
                      maxLength={MAX_IMAGE_CRITERION_LENGTH}
                      value={value}
                      onChange={(event) => {
                        const value = event.target.value
                        setCriteria((current) =>
                          current.map((item) =>
                            item.id === id ? { id, value } : item,
                          ),
                        )
                      }}
                    />
                  </FormField>
                  <div className="checklist-field-meta">
                    <span>
                      {value.length}/{MAX_IMAGE_CRITERION_LENGTH}
                    </span>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh odm-btn-sm checklist-criterion-remove"
                      aria-label={t.imageCriterionRemove(index + 1)}
                      onClick={() =>
                        setCriteria((current) =>
                          current.filter((item) => item.id !== id),
                        )
                      }
                    >
                      <Icon
                        name="trash"
                        width={13}
                        height={13}
                        aria-hidden="true"
                      />
                      {t.imageCriteriaRemove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Button
                icon="plus"
                size="sm"
                disabled={criteria.length >= MAX_IMAGE_CRITERIA}
                onClick={() => {
                  const id = nextCriterionId.current++
                  setCriteria((current) => [...current, { id, value: '' }])
                }}
              >
                {t.imageCriteriaAdd}
              </Button>
            </div>
          </>
        </fieldset>
      </div>

      {error && (
        <p className="checklist-banner is-error" role="alert">
          {error}
        </p>
      )}
      {saveSucceeded && !sharedDirty && !overridesDirty && (
        <p className="checklist-banner" role="status">
          {t.configSaved}
        </p>
      )}
      <div className="checklist-form-actions">
        <Button variant="ghost" disabled={busy} onClick={close}>
          {t.cancel}
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon="check"
          loading={busy}
          disabled={busy || needsAck}
        >
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </form>
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
      <input
        id={id}
        className="odm-inp"
        type="number"
        min={0}
        step={step}
        inputMode="numeric"
        value={base}
        aria-invalid={invalid}
        onChange={(event) => onBase(event.target.value)}
      />
      {service && (
        <input
          className="odm-inp"
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
