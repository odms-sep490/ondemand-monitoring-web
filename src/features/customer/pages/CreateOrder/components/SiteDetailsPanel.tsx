import { useState, type ReactNode } from 'react'

import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ParsedArea } from '../../../lib/createOrder/areaFile'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { ALTITUDE_MAX, ALTITUDE_MIN } from '../../../lib/createOrder/validators'
import { AreaFilesField } from './AreaFilesField'
import { siteDetailsPanelMessages } from './SiteDetailsPanel.messages'

const ACCESS_NOTES_MAX = 1000

/** Optional group that stays closed until needed (or when it already has data). */
function Fold({
  title,
  hint,
  filled,
  hasError,
  children,
}: {
  title: string
  hint?: string
  filled: boolean
  hasError?: boolean
  children: ReactNode
}) {
  const [manualOpen, setOpen] = useState(filled)
  const open = manualOpen || Boolean(hasError)
  return (
    <div className={`co-fold${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="co-fold-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>
          <strong>{title}</strong>
          {hint && <small>{hint}</small>}
        </span>
        <span className="co-fold-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="co-fold-body">{children}</div>}
    </div>
  )
}

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

export function SiteDetailsPanel({ form, errors, update }: Props) {
  const { t } = useI18n(siteDetailsPanelMessages)

  function applyParsed(area: ParsedArea) {
    update('latitude', area.latitude.toFixed(7))
    update('longitude', area.longitude.toFixed(7))
    update('radiusM', area.radiusM)
    update('normalizedAddress', '')
    update('locationSource', 'file')
    update('locationConfirmedAt', '')
    update('locationStatus', 'stale')
    if (area.lengthM) update('estimatedLengthM', String(area.lengthM))
  }

  return (
    <Card title={t.cardTitle}>
      <div className="co-two">
        <FormField
          id="co-altitude"
          label={t.altitudeLabel}
          required
          error={errors.altitudeM}
        >
          <input
            id="co-altitude"
            className="co-input"
            type="number"
            inputMode="decimal"
            min={ALTITUDE_MIN}
            max={ALTITUDE_MAX}
            value={Number.isFinite(form.altitudeM) ? form.altitudeM : ''}
            onChange={(e) =>
              update(
                'altitudeM',
                e.target.value === '' ? Number.NaN : Number(e.target.value),
              )
            }
          />
          {!errors.altitudeM && <div className="co-help">{t.altitudeHint}</div>}
        </FormField>
        <FormField
          id="co-length"
          label={t.lengthLabel}
          error={errors.estimatedLengthM}
        >
          <input
            id="co-length"
            className="co-input"
            type="number"
            inputMode="decimal"
            min={0}
            value={form.estimatedLengthM}
            placeholder={t.lengthPlaceholder}
            onChange={(e) => update('estimatedLengthM', e.target.value)}
          />
          {!errors.estimatedLengthM && (
            <div className="co-help">{t.lengthHint}</div>
          )}
        </FormField>
      </div>
      <Fold
        title={t.contactSection}
        hint={t.contactHint}
        filled
        hasError={Boolean(
          errors.siteContactName ||
          errors.siteContactPhone ||
          errors.accessNotes,
        )}
      >
        <div className="co-two co-mt">
          <FormField
            id="co-contact-name"
            label={t.contactNameLabel}
            required
            error={errors.siteContactName}
          >
            <input
              id="co-contact-name"
              className="co-input"
              maxLength={120}
              value={form.siteContactName}
              placeholder={t.contactNamePlaceholder}
              onChange={(e) => update('siteContactName', e.target.value)}
            />
          </FormField>
          <FormField
            id="co-contact-phone"
            label={t.contactPhoneLabel}
            required
            error={errors.siteContactPhone}
          >
            <input
              id="co-contact-phone"
              className="co-input"
              type="tel"
              maxLength={20}
              value={form.siteContactPhone}
              placeholder={t.contactPhonePlaceholder}
              onChange={(e) => update('siteContactPhone', e.target.value)}
            />
          </FormField>
        </div>
        <div className="co-mt">
          <FormField
            id="co-access-notes"
            label={t.accessNotesLabel}
            required
            error={errors.accessNotes}
          >
            <textarea
              id="co-access-notes"
              className="co-input"
              rows={3}
              maxLength={ACCESS_NOTES_MAX}
              value={form.accessNotes}
              placeholder={t.accessNotesPlaceholder}
              onChange={(e) => update('accessNotes', e.target.value)}
            />
          </FormField>
          <div className="co-counter">
            {form.accessNotes.length} / {ACCESS_NOTES_MAX}
          </div>
        </div>
      </Fold>
      <Fold title={t.filesSection} filled={form.areaFiles.length > 0}>
        <div>
          <AreaFilesField
            files={form.areaFiles}
            onChange={(files) => update('areaFiles', files)}
            onParsed={applyParsed}
          />
        </div>
      </Fold>
    </Card>
  )
}
