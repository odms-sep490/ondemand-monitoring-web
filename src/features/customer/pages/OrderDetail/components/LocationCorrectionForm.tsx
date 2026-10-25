import { useEffect, useState } from 'react'

import { env } from '../../../../../config/env'
import { apiRequest } from '../../../../../shared/api/httpClient'
import { buildCoverageArea } from '../../../lib/createOrder/payload'
import type { OrderDetailView } from '../../../lib/orders/types'
import { RealLocationMap } from '../../CreateOrder/components/LocationStep'
import '../../CreateOrder/CreateOrder.css'

export function LocationCorrectionForm({ order, onSaved }: {
  order: OrderDetailView
  onSaved: () => void
}) {
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
      setError('Điểm vừa chọn nằm ngoài phạm vi bản đồ hợp lệ. Vui lòng chọn lại.')
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
        throw new Error(payload?.message ?? 'Không tìm được địa chỉ tại vị trí này.')
      }
      const nextAddress = payload?.data?.displayName?.trim()
      if (nextAddress) setAddress(nextAddress)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `${cause.message} Bạn vẫn có thể nhập địa chỉ thủ công.`
          : 'Không thể tìm địa chỉ. Bạn vẫn có thể nhập thủ công.',
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
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật khu vực.')
      setBusy(false)
    }
  }

  return (
    <div className="od-additional-info-form od-additional-info-target">
      <strong>Cập nhật khu vực giám sát</strong>
      <p>Bấm vào bản đồ để chọn lại vị trí. Chỉ khu vực hiện tại của đơn sẽ được thay đổi.</p>
      {mapReady ? (
        <RealLocationMap
          latitude={latitude}
          longitude={longitude}
          radiusM={Number.isFinite(radius) ? radius : 300}
          label="Bản đồ chọn lại khu vực giám sát"
          labels={{ street: 'Bản đồ', satellite: 'Vệ tinh' }}
          onPick={(nextLatitude, nextLongitude) => {
            void pickLocation(nextLatitude, nextLongitude)
          }}
        />
      ) : (
        <div className="od-location-map-loading">Đang mở bản đồ…</div>
      )}
      {locating ? <small>Đang tìm địa chỉ tại vị trí mới…</small> : null}
      <div className="od-additional-info-grid">
        <label className="is-wide"><span>Địa chỉ khu vực</span><input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        <label><span>Vĩ độ</span><input inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></label>
        <label><span>Kinh độ</span><input inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></label>
        <label className="is-wide od-radius-control">
          <span>Bán kính giám sát: {Number.isFinite(radius) ? radius : 0} m</span>
          <div className="od-radius-inputs">
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={Number.isFinite(radius) ? Math.min(5000, Math.max(50, radius)) : 300}
              aria-label="Kéo để chọn bán kính giám sát"
              onChange={(e) => setRadiusM(e.target.value)}
            />
            <input
              className="od-radius-number"
              type="number"
              min="50"
              max="5000"
              step="50"
              value={radiusM}
              aria-label="Bán kính giám sát theo mét"
              onChange={(e) => setRadiusM(e.target.value)}
            />
          </div>
          <small><span>50 m</span><span>5.000 m</span></small>
        </label>
      </div>
      <button type="button" className="odm-btn odm-btn-ok" disabled={busy || !valid} onClick={() => void save()}>
        {busy ? 'Đang gửi…' : 'Cập nhật khu vực và gửi lại'}
      </button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  )
}
