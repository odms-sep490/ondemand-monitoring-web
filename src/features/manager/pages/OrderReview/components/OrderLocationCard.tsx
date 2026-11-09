import { useEffect, useRef, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { hcmcServicePolygonLatLngs } from '../../../../../shared/lib/serviceArea'
import type { OrderDetail } from '../../../types/orders'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { estimatedAreaHa } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { orderLocationCardMessages } from './OrderLocationCard.messages'
import { preferredRangeLabel } from '../../../lib/viLabels'

function useLeafletOrderMap(order: OrderDetail, showServiceArea: boolean) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const resolved = resolveOrderGpsCenter(order.center)
  const centerLat = resolved?.center.lat
  const centerLon = resolved?.center.lon

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!resolved) return
    if (!container.current || map.current) return
    const initialCenter: L.LatLngExpression = [
      resolved.center.lat,
      resolved.center.lon,
    ]
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(initialCenter, 16)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    if (showServiceArea) {
      L.polygon(hcmcServicePolygonLatLngs(), {
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(instance)
    }

    map.current = instance
    const resizeTimer = window.setTimeout(() => instance.invalidateSize(), 0)
    return () => {
      window.clearTimeout(resizeTimer)
      instance.remove()
      map.current = null
      marker.current = null
      circle.current = null
    }
  }, [centerLat, centerLon, showServiceArea])

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
  overview = false,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  showAreaAddress?: boolean
  /** Adds the schedule and location summary composition used in order intake. */
  overview?: boolean
}) {
  const { t: tl } = useI18n(orderLocationCardMessages)
  const mapRef = useLeafletOrderMap(order, !overview)
  const resolved = resolveOrderGpsCenter(order.center)
  const areaAddress = order.addressText?.trim() || null
  const preferred =
    preferredRangeLabel(
      order.preferredDateFrom ?? order.preferredDate,
      order.preferredDateTo ?? order.preferredDateFrom ?? order.preferredDate,
      order.preferredTimeName,
      order.preferredWindow,
    ) || '—'

  const header = (action?: ReactNode) => (
    <header className="odm-or-card-head">
      <span className="odm-or-card-title">
        <OrderIcon name={overview ? 'calendar' : 'pin'} size={18} />
        {overview ? t.serviceAndMedia : t.location}
      </span>
      {action}
    </header>
  )

  if (!resolved && !order.center && !order.addressText) {
    return (
      <section className="odm-or-card">
        {header()}
        <div className="odm-or-card-body odm-or-empty">{t.noLocationData}</div>
      </section>
    )
  }

  function toggleFullscreen() {
    const frame = mapRef.current?.closest(
      '.odm-or-overview-map, .odm-or-map',
    ) as HTMLElement | null
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
    <Button type="button" onClick={toggleFullscreen}>
      {t.openInMap}
      <OrderIcon name="external" size={14} />
    </Button>
  )

  if (overview) {
    return (
      <section className="odm-or-card odm-or-location-overview">
        {header(resolved ? openButton : undefined)}
        <div className="odm-or-location-overview-grid">
          <dl className="odm-or-location-facts">
            <div className="odm-or-location-fact is-emphasized">
              <span className="odm-or-location-fact-icon" aria-hidden="true">
                <OrderIcon name="calendar" size={20} />
              </span>
              <span>
                <dt>{t.preferredWindow}</dt>
                <dd>{preferred}</dd>
              </span>
            </div>
            <div className="odm-or-location-fact">
              <span className="odm-or-location-fact-icon" aria-hidden="true">
                <OrderIcon name="pin" size={20} />
              </span>
              <span>
                <dt>{t.locationLabel}</dt>
                <dd>{areaAddress || '—'}</dd>
              </span>
            </div>
          </dl>

          {resolved ? (
            <div className="odm-or-overview-map odm-or-real-map">
              <div
                ref={mapRef}
                className="odm-or-real-map-canvas"
                role="application"
                aria-label={t.mapAriaLabel}
              />
            </div>
          ) : (
            <div className="odm-or-overview-map odm-or-map-unavailable" role="status">
              <OrderIcon name="pin" size={22} />
              <span>{tl.noCoordinates}</span>
            </div>
          )}

          <dl className="odm-or-location-metrics">
            <div className="odm-or-location-metric">
              <dt>{t.centerCoords}</dt>
              <dd>
                {resolved
                  ? `${resolved.center.lat.toFixed(6)}, ${resolved.center.lon.toFixed(6)}`
                  : '—'}
              </dd>
            </div>
            <div className="odm-or-location-metric">
              <dt>{t.monitoringRadius}</dt>
              <dd>{order.radiusM != null ? `${order.radiusM} m` : '—'}</dd>
            </div>
            <div className="odm-or-location-metric">
              <dt>{t.estimatedArea}</dt>
              <dd>{areaHa != null ? `${areaHa} ha` : '—'}</dd>
            </div>
          </dl>
        </div>
      </section>
    )
  }

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
            <span className="odm-or-area-address-label">{tl.areaAddress}</span>
            <strong>{areaAddress}</strong>
          </span>
        </div>
      ) : null}
    </section>
  )
}
