import { useEffect, useRef, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  HCMC_SERVICE_CENTER,
  hcmcServicePolygonLatLngs,
} from '../../../../../shared/lib/serviceArea'
import type { OrderDetail } from '../../../types/orders'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { estimatedAreaHa } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'

function useLeafletOrderMap(order: OrderDetail) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const resolved = resolveOrderGpsCenter(order.center)
  const centerLat = resolved?.center.lat
  const centerLon = resolved?.center.lon

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!container.current || map.current) return
    const initialCenter: L.LatLngExpression = resolved
      ? [resolved.center.lat, resolved.center.lon]
      : [HCMC_SERVICE_CENTER.latitude, HCMC_SERVICE_CENTER.longitude]
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(initialCenter, resolved ? 16 : 11)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    L.polygon(hcmcServicePolygonLatLngs(), {
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.08,
      weight: 2,
    }).addTo(instance)

    map.current = instance
    const resizeTimer = window.setTimeout(() => instance.invalidateSize(), 0)
    return () => {
      window.clearTimeout(resizeTimer)
      instance.remove()
      map.current = null
      marker.current = null
      circle.current = null
    }
  }, [centerLat, centerLon])

  useEffect(() => {
    if (!map.current || !resolved) return
    const target: L.LatLngExpression = [
      resolved.center.lat,
      resolved.center.lon,
    ]
    if (marker.current) {
      marker.current.setLatLng(target)
    } else {
      marker.current = L.marker(target)
        .addTo(map.current)
        .bindTooltip('GPS target')
    }
    if (order.radiusM != null) {
      if (circle.current) {
        circle.current.setLatLng(target).setRadius(order.radiusM)
      } else {
        circle.current = L.circle(target, {
          radius: order.radiusM,
          color: '#1677ff',
          fillColor: '#1677ff',
          fillOpacity: 0.16,
          weight: 2,
        }).addTo(map.current)
      }
    } else if (circle.current) {
      circle.current.remove()
      circle.current = null
    }
    map.current.setView(target, 16)
  }, [centerLat, centerLon, order.radiusM])

  return container
}

export function OrderLocationCard({
  order,
  t,
  showAreaAddress = false,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  showAreaAddress?: boolean
}) {
  const mapRef = useLeafletOrderMap(order)
  const resolved = resolveOrderGpsCenter(order.center)
  const areaAddress = order.addressText?.trim() || null

  const header = (action?: ReactNode) => (
    <header className="odm-or-card-head">
      <span className="odm-or-card-title">
        <OrderIcon name="pin" size={18} />
        {t.location}
      </span>
      {action}
    </header>
  )

  if (!order.center && !order.addressText) {
    return (
      <section className="odm-or-card">
        {header()}
        <div className="odm-or-card-body odm-or-empty">{t.noLocationData}</div>
      </section>
    )
  }

  function toggleFullscreen() {
    const frame = mapRef.current?.closest('.odm-or-map') as HTMLElement | null
    if (!frame) return
    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
    } else {
      void frame.requestFullscreen?.()
    }
    window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 0)
  }

  const areaHa = estimatedAreaHa(order.radiusM)
  const openButton = (
    <button
      type="button"
      className="odm-or-btn-outline"
      onClick={toggleFullscreen}
    >
      {t.openInMap}
      <OrderIcon name="external" size={14} />
    </button>
  )

  return (
    <section className="odm-or-card">
      {header(openButton)}
      <div
        className={`odm-or-map odm-or-real-map${showAreaAddress && areaAddress ? ' has-area-address' : ''}`}
      >
        <div
          ref={mapRef}
          className="odm-or-real-map-canvas"
          role="application"
          aria-label={t.mapAriaLabel}
        />

        {resolved ? (
          <div className="odm-or-map-badge odm-or-gps-badge">
            TARGET · {resolved.center.lat.toFixed(6)},{' '}
            {resolved.center.lon.toFixed(6)}
          </div>
        ) : null}

        {order.radiusM != null ? (
          <div className="odm-or-map-overlay">
            <span className="odm-or-map-overlay-icon">
              <OrderIcon name="radius" size={18} />
            </span>
            <span>
              <span className="odm-or-map-overlay-line">
                {t.monitoringRadius}: <b>{order.radiusM} m</b>
              </span>
              {areaHa != null ? (
                <span className="odm-or-map-overlay-line is-muted">
                  {t.estimatedArea}: {areaHa} ha
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
      {showAreaAddress && areaAddress ? (
        <div className="odm-or-area-address">
          <span className="odm-or-area-address-icon" aria-hidden="true">
            <OrderIcon name="pin" size={18} />
          </span>
          <span>
            <span className="odm-or-area-address-label">Địa chỉ khu vực</span>
            <strong>{areaAddress}</strong>
          </span>
        </div>
      ) : null}
    </section>
  )
}
