import { Button } from 'antd'
import { useEffect, useState } from 'react'

import { env } from '../../../../../config/env'
import { apiRequest } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import { buildCoverageArea } from '../../../lib/createOrder/payload'
import type { OrderDetailView } from '../../../lib/orders/types'
import { RealLocationMap } from '../../CreateOrder/components/LocationStep'
import '../../CreateOrder/CreateOrder.css'
import { locationCorrectionFormMessages } from './LocationCorrectionForm.messages'

export function LocationCorrectionForm({ order, onSaved }: {
  order: OrderDetailView
  onSaved: () => void
}) {
  const { t } = useI18n(locationCorrectionFormMessages)
  const [address, setAddress] = useState(order.address ?? '')
  const [latitude, setLatitude] = useState(String(order.latitude ?? ''))
  const [longitude, setLongitude] = useState(String(order.longitude ?? ''))
  const [radiusM, setRadiusM] = useState(String(order.radiusM ?? 300))
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // The notice expands from a compact status card. Mount Leaflet only after
    // that layout has reached its final width, otherwise it caches a half-width map.
    const timer = window.setTimeout(() => setMapReady(true), 150)
    return () => window.clearTimeout(timer)
  }, [])

  const lat = Number(latitude)
  const lon = Number(longitude)
  const radius = Number(radiusM)
  const valid = address.trim() && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    Number.isFinite(lon) && Math.abs(lon) <= 180 && Number.isFinite(radius) &&
    radius >= 50 && radius <= 5000

  async function pickLocation(nextLatitude: number, nextLongitude: number) {
    if (
      !Number.isFinite(nextLatitude) ||
      !Number.isFinite(nextLongitude) ||
      Math.abs(nextLatitude) > 90 ||
      Math.abs(nextLongitude) > 180
    ) {
      setError(t.outOfRange)
      return
    }
    setLatitude(nextLatitude.toFixed(7))
    setLongitude(nextLongitude.toFixed(7))
    setLocating(true)
    setError('')
    try {
      const params = new URLSearchParams({
        latitude: nextLatitude.toFixed(7),
        longitude: nextLongitude.toFixed(7),
      })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/reverse?${params.toString()}`,
        { headers: { Accept: 'application/json' }, credentials: 'include' },
      )
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean
        message?: string
        data?: { displayName?: string }
      } | null
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message ?? t.notFound)
      }
      const nextAddress = payload?.data?.displayName?.trim()
      if (nextAddress) setAddress(nextAddress)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `${cause.message} ${t.manualHint}`
          : t.lookupFailed,
      )
    } finally {
      setLocating(false)
    }
  }

  async function save() {
    if (!valid) return
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        body: {
          address: address.trim(),
          latitude: lat,
          longitude: lon,
          radiusM: radius,
          coverageArea: buildCoverageArea(lon, lat, radius),
        },
      })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.updateFailed)
      setBusy(false)
    }
  }

  return (
    <div className="od-additional-info-form od-additional-info-target">
      <strong>{t.heading}</strong>
      <p>{t.intro}</p>
      {mapReady ? (
        <RealLocationMap
          latitude={latitude}
          longitude={longitude}
          radiusM={Number.isFinite(radius) ? radius : 300}
          label={t.mapLabel}
          labels={{ street: t.street, satellite: t.satellite }}
          onPick={(nextLatitude, nextLongitude) => {
            void pickLocation(nextLatitude, nextLongitude)
          }}
        />
      ) : (
        <div className="od-location-map-loading">{t.openingMap}</div>
      )}
      {locating ? <small>{t.locating}</small> : null}
      <div className="od-additional-info-grid">
        <label className="is-wide"><span>{t.address}</span><input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        <label><span>{t.lat}</span><input inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></label>
        <label><span>{t.lon}</span><input inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></label>
        <label className="is-wide od-radius-control">
          <span>{t.radius(Number.isFinite(radius) ? radius : 0)}</span>
          <div className="od-radius-inputs">
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={Number.isFinite(radius) ? Math.min(5000, Math.max(50, radius)) : 300}
              aria-label={t.radiusSlider}
              onChange={(e) => setRadiusM(e.target.value)}
            />
            <input
              className="od-radius-number"
              type="number"
              min="50"
              max="5000"
              step="50"
              value={radiusM}
              aria-label={t.radiusMeters}
              onChange={(e) => setRadiusM(e.target.value)}
            />
          </div>
          <small><span>50 m</span><span>{t.max}</span></small>
        </label>
      </div>
      <Button type="primary" disabled={busy || !valid} onClick={() => void save()}>
        {busy ? t.sending : t.submit}
      </Button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  )
}
