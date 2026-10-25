import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { calcArea } from '../../../lib/createOrder/payload'
import type {
  FormErrors,
  FormState,
  LocationStatus,
} from '../../../lib/createOrder/types'
import { locationPanelMessages } from './LocationPanel.messages'

const RADIUS_MIN = 100
const RADIUS_MAX = 1500
const RADIUS_DEFAULT = 300
const RADIUS_PRESETS = [100, 300, 500, 1000]

type Props = {
  form: FormState
  errors: FormErrors
  locatingAddress?: boolean
  addressLookupError?: string | null
  onLocateAddress: () => void
  onAddressChange: (value: string) => void
  onCoordinateChange: (field: 'latitude' | 'longitude', value: string) => void
  onConfirmCoordinates: () => void
  onRadiusChange: (value: number) => void
}

export function LocationPanel({
  form,
  errors,
  locatingAddress = false,
  addressLookupError,
  onLocateAddress,
  onAddressChange,
  onCoordinateChange,
  onConfirmCoordinates,
  onRadiusChange,
}: Props) {
  const { t } = useI18n(locationPanelMessages)
  const statusLabels: Record<LocationStatus, string> = {
    unconfirmed: t.statusUnconfirmed,
    resolving: t.statusResolving,
    confirmed: t.statusConfirmed,
    stale: t.statusStale,
    error: t.statusError,
  }
  const coordinatesValid =
    Number.isFinite(Number(form.latitude)) &&
    Number.isFinite(Number(form.longitude)) &&
    Math.abs(Number(form.latitude)) <= 90 &&
    Math.abs(Number(form.longitude)) <= 180

  return (
    <Card title={t.cardTitle}>
      <div
        className={`co-location-status is-${form.locationStatus}`}
        role="status"
        aria-live="polite"
      >
        <strong>{statusLabels[form.locationStatus]}</strong>
        <span>
          {form.locationStatus === 'confirmed'
            ? form.locationSource === 'gps'
              ? t.statusGpsConfirmedHint
              : t.statusConfirmedHint
            : t.statusNeedsAction}
        </span>
      </div>
      <FormField
        id="co-address"
        label={t.addressLabel}
        required
        error={errors.address}
      >
        <div className="co-address-search">
          <input
            id="co-address"
            name="monitoring-address"
            className="co-input"
            type="search"
            autoComplete="off"
            value={form.address}
            placeholder={t.addressPlaceholder}
            aria-describedby="co-address-help"
            aria-invalid={Boolean(errors.address)}
            onChange={(event) => onAddressChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onLocateAddress()
              }
            }}
          />
          <button
            type="button"
            className="co-secondary-action"
            disabled={!form.address.trim() || locatingAddress}
            onClick={onLocateAddress}
          >
            {locatingAddress ? t.locatingAddress : t.locateAddress}
          </button>
        </div>
        <div id="co-address-help" className="co-help">
          {t.addressHint}
        </div>
        {addressLookupError ? (
          <div className="co-address-error" role="alert">
            {addressLookupError === 'NOT_FOUND'
              ? t.addressNotFound
              : addressLookupError}
          </div>
        ) : null}
      </FormField>
      <details className="co-location-advanced">
        <summary>{t.advancedCoordinates}</summary>
        <p className="co-help">{t.coordinatesHint}</p>
        <div className="co-two">
          <FormField
            id="co-lat"
            label={t.latitudeLabel}
            error={errors.latitude}
          >
            <input
              id="co-lat"
              name="latitude"
              className="co-input"
              inputMode="decimal"
              value={form.latitude}
              aria-invalid={Boolean(errors.latitude)}
              onChange={(e) => onCoordinateChange('latitude', e.target.value)}
            />
          </FormField>
          <FormField
            id="co-lng"
            label={t.longitudeLabel}
            error={errors.longitude}
          >
            <input
              id="co-lng"
              name="longitude"
              className="co-input"
              inputMode="decimal"
              value={form.longitude}
              aria-invalid={Boolean(errors.longitude)}
              onChange={(e) => onCoordinateChange('longitude', e.target.value)}
            />
          </FormField>
        </div>
        <button
          type="button"
          className="co-secondary-action"
          disabled={!coordinatesValid}
          onClick={onConfirmCoordinates}
        >
          {t.confirmCoordinates}
        </button>
      </details>
      <section className="co-radius-section" aria-labelledby="co-radius-title">
        <div className="co-radius-heading">
          <div>
            <strong id="co-radius-title">{t.radiusTitle}</strong>
            <span>{t.radiusHint}</span>
          </div>
          <label className="co-radius-number">
            <span>{t.radiusInputLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              min={RADIUS_MIN}
              max={RADIUS_MAX}
              value={form.radiusM}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
            />
            <span aria-hidden="true">m</span>
          </label>
        </div>
        <input
          id="co-radius"
          className="co-range"
          type="range"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={50}
          value={form.radiusM}
          aria-valuetext={`${form.radiusM} m`}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <div className="co-range-ends" aria-hidden="true">
          <span>{RADIUS_MIN} m</span>
          <span>{RADIUS_MAX.toLocaleString()} m</span>
        </div>
        <div className="co-radius-presets" aria-label={t.radiusPresets}>
          {RADIUS_PRESETS.map((radius) => (
            <button
              key={radius}
              type="button"
              className={form.radiusM === radius ? 'is-active' : ''}
              aria-pressed={form.radiusM === radius}
              onClick={() => onRadiusChange(radius)}
            >
              {radius.toLocaleString()} m
            </button>
          ))}
          <button type="button" onClick={() => onRadiusChange(RADIUS_DEFAULT)}>
            {t.resetRadius}
          </button>
        </div>
        <dl className="co-area-metrics">
          <div>
            <dt>{t.radiusMetric}</dt>
            <dd>{form.radiusM.toLocaleString()} m</dd>
          </div>
          <div>
            <dt>{t.diameterMetric}</dt>
            <dd>{(form.radiusM * 2).toLocaleString()} m</dd>
          </div>
          <div>
            <dt>{t.areaEstimate}</dt>
            <dd>{calcArea(form.radiusM)} ha</dd>
          </div>
        </dl>
        <p className="co-help">{t.areaHint}</p>
      </section>
    </Card>
  )
}
