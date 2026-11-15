import { Button } from 'antd'
import { useEffect, useState } from 'react'

import { apiRequest } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import {
  isCoverageInsideHcmcServiceArea,
  isInsideHcmcServiceArea,
  isLocationInsideCoverageArea,
} from '../../../../../shared/lib/serviceArea'
import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { isValidCoverageArea } from '../../../lib/createOrder/coverageGeometry'
import { buildCoverageArea } from '../../../lib/createOrder/payload'
import type { CoverageAreaGeometry, FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import type { OrderDetailView } from '../../../lib/orders/types'
import { LocationStep } from '../../CreateOrder/components/LocationStep'
import { monitoringAreaMessages } from '../../CreateOrder/components/MonitoringArea.messages'
import '../../CreateOrder/CreateOrder.css'
import '../../CreateOrder/CreateOrder.refinement.css'
import { locationCorrectionFormMessages } from './LocationCorrectionForm.messages'

function initialLocation(order: OrderDetailView): FormState {
  const hasLocation = order.latitude != null && order.longitude != null
  const radiusM = order.radiusM ?? 300
  const storedArea = order.coverageArea as CoverageAreaGeometry | null
  const coverageArea = isValidCoverageArea(storedArea)
    ? storedArea
    : hasLocation && !order.coverageArea
      ? buildCoverageArea(order.longitude!, order.latitude!, radiusM) as CoverageAreaGeometry
      : null

  return {
    ...createDefaultForm(),
    address: order.address ?? '',
    normalizedAddress: order.address ?? '',
    latitude: String(order.latitude ?? ''),
    longitude: String(order.longitude ?? ''),
    locationStatus: hasLocation ? 'confirmed' : 'unconfirmed',
    locationSource: 'restored',
    locationConfirmedAt: hasLocation ? new Date().toISOString() : '',
    radiusM,
    coverageArea,
    // Stored boundaries are edited as polygons so their original vertices are preserved.
    coverageAreaShape: coverageArea ? 'POLYGON' : '',
  }
}

export function LocationCorrectionForm({ order, onSaved }: {
  order: OrderDetailView
  onSaved: () => void
}) {
  const { t } = useI18n(locationCorrectionFormMessages)
  const { t: areaText } = useI18n(monitoringAreaMessages)
  const [form, setForm] = useState(() => initialLocation(order))
  const [busy, setBusy] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setMapReady(true), 150)
    return () => window.clearTimeout(timer)
  }, [])

  const update: UpdateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
    setError('')
  }
  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  const point = { latitude, longitude }
  const locationValid = Boolean(
    form.latitude.trim() && form.longitude.trim() &&
    Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180 &&
    form.locationStatus === 'confirmed' && form.locationConfirmedAt,
  )
  const errors: FormErrors = {}
  if (!locationValid) errors.address = areaText.locationError
  else if (!isInsideHcmcServiceArea(point)) errors.address = t.outsideServiceArea
  if (!isValidCoverageArea(form.coverageArea)) errors.coverageArea = areaText.areaError
  else if (!isCoverageInsideHcmcServiceArea(form.coverageArea)) {
    errors.coverageArea = t.outsideServiceArea
  } else if (locationValid && !isLocationInsideCoverageArea(point, form.coverageArea)) {
    errors.coverageArea = areaText.locationOutsideArea
  }
  const valid = Object.keys(errors).length === 0

  async function save() {
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        body: {
          address: form.normalizedAddress.trim() || form.address.trim() ||
            `${latitude.toFixed(7)}, ${longitude.toFixed(7)}`,
          latitude,
          longitude,
          radiusM: form.radiusM,
          coverageArea: form.coverageArea,
        },
      })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.updateFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="od-additional-info-form od-additional-info-target">
      <strong>{t.heading}</strong>
      <p>{t.intro}</p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {mapReady ? <LocationStep form={form} errors={errors} update={update} /> : (
          <div className="od-location-map-loading">{t.openingMap}</div>
        )}
      </fieldset>
      {error ? <p role="alert">{error}</p> : null}
      <Button type="primary" loading={busy} disabled={busy || !valid} onClick={() => void save()}>
        {busy ? t.sending : t.submit}
      </Button>
    </div>
  )
}
