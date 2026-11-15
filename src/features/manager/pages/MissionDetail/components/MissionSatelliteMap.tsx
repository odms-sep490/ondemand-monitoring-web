import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  coverageAreaToLatLngRings,
} from '../../../../../shared/lib/coverageArea'
import { resolveOrderGpsCenter } from '../../../components/common/orderGps'
import type { OrderDetail } from '../../../types/orders'
import type { GeoJsonPolygon } from '../../../../../shared/types/geo'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

type GpsPoint = { latitude: number; longitude: number }

function validGps(point: GpsPoint | null) {
  return (
    point !== null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180 &&
    (point.latitude !== 0 || point.longitude !== 0)
  )
}

function routeMarkerIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="
      min-width:42px;
      height:24px;
      padding:0 8px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-sizing:border-box;
      background:${color};
      color:#fff;
      border:2px solid #fff;
      box-shadow:0 3px 10px rgba(15,23,42,.28);
      font-size:10px;
      font-weight:800;
      line-height:1;
    ">${label}</div>`,
    className: 'odm-rm-route-marker',
    iconSize: [42, 24],
    iconAnchor: [21, 12],
  })
}

export function MissionSatelliteMap({
  latitude: missionLatitude,
  longitude: missionLongitude,
  radiusMeters: missionRadius,
  coverageArea: missionCoverage,
  order,
  visible,
}: {
  missionId: string
  order?: Pick<OrderDetail, 'center' | 'radiusM' | 'coverageArea' | 'addressText'> | null
  latitude: number | null
  longitude: number | null
  radiusMeters?: number | null
  coverageArea?: GeoJsonPolygon | null
  visible: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const targetMarker = useRef<L.Marker | null>(null)
  const { t } = useI18n(missionDetailPageMessages)
  const x = t.extra
  const circle = useRef<L.Circle | null>(null)
  const polygon = useRef<L.Polygon | null>(null)
  const orderCenter = resolveOrderGpsCenter(order?.center ?? null)?.center
  const latitude = orderCenter?.lat ?? missionLatitude
  const longitude = orderCenter?.lon ?? missionLongitude
  const radiusMeters = order?.radiusM ?? missionRadius
  const coverageArea = order?.coverageArea ?? missionCoverage
  const target = validGps({
    latitude: latitude ?? Number.NaN,
    longitude: longitude ?? Number.NaN,
  })
    ? { latitude: latitude as number, longitude: longitude as number }
    : null
  const targetLat = target?.latitude
  const targetLon = target?.longitude

  useEffect(() => {
    if (
      import.meta.env.MODE === 'test' ||
      !visible ||
      targetLat == null ||
      targetLon == null
    )
      return
    if (!container.current || map.current) return
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([targetLat, targetLon], 16)
    instance.zoomControl.setPosition('bottomright')

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    map.current = instance
    // This map lives inside a tab panel that starts hidden. Leaflet measures a
    // hidden container as a tiny map and only paints the first tile unless its
    // size is recalculated after the panel becomes visible/resizes.
    let frame = window.requestAnimationFrame(() => {
      instance.invalidateSize({ pan: false })
    })
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame(() => {
              instance.invalidateSize({ pan: false })
            })
          })
        : null
    resizeObserver?.observe(container.current)

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      instance.remove()
      map.current = null
      targetMarker.current = null
      circle.current = null
      polygon.current = null
    }
  }, [targetLat, targetLon, visible])

  useEffect(() => {
    if (!visible || !map.current || targetLat == null || targetLon == null) return

    const targetLatLng: L.LatLngExpression = [targetLat, targetLon]

    if (targetMarker.current) {
      targetMarker.current
        .setLatLng(targetLatLng)
        .setTooltipContent(x.targetPoint)
    } else {
      targetMarker.current = L.marker(targetLatLng, {
        icon: routeMarkerIcon('GS', '#dc2626'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip(x.targetPoint)
    }

    const areaRings = coverageAreaToLatLngRings(coverageArea)
    if (areaRings) {
      if (circle.current) {
        circle.current.remove()
        circle.current = null
      }
      if (polygon.current) {
        polygon.current.setLatLngs(areaRings)
      } else {
        polygon.current = L.polygon(areaRings, {
          color: '#16a34a',
          fillColor: '#22c55e',
          fillOpacity: 0.16,
          weight: 2,
        }).addTo(map.current)
      }
    } else {
      if (polygon.current) {
        polygon.current.remove()
        polygon.current = null
      }
      if (radiusMeters && radiusMeters > 0) {
        if (circle.current) {
          circle.current.setLatLng(targetLatLng).setRadius(radiusMeters)
        } else {
          circle.current = L.circle(targetLatLng, {
            radius: radiusMeters,
            color: '#16a34a',
            fillColor: '#22c55e',
            fillOpacity: 0.16,
            weight: 2,
          }).addTo(map.current)
        }
      } else if (circle.current) {
        circle.current.remove()
        circle.current = null
      }
    }

    // Fit only after the formerly hidden tab has its real dimensions.
    const instance = map.current
    const frame = window.requestAnimationFrame(() => {
      instance.invalidateSize({ pan: false })
      const areaBounds = polygon.current?.getBounds() ?? circle.current?.getBounds()
      if (areaBounds?.isValid()) {
        instance.fitBounds(areaBounds, { padding: [36, 36], maxZoom: 17, animate: false })
      } else {
        instance.setView(targetLatLng, 17, { animate: false })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [coverageArea, radiusMeters, targetLat, targetLon, visible, x])

  if (!target) {
    return (
      <div
        className="odm-rm-satellite is-empty"
        role="img"
        aria-label={x.satelliteAria}
      >
        <p>{x.noCoordinates}</p>
      </div>
    )
  }

  return (
    <div
      className="odm-rm-satellite"
      role="application"
      aria-label={x.satelliteAria}
    >
      <div ref={container} className="odm-rm-leaflet" />
      <div className="odm-rm-chip odm-rm-chip-target">
        {x.targetChip} · {target.latitude.toFixed(6)},{' '}
        {target.longitude.toFixed(6)}
      </div>
      {radiusMeters && !coverageAreaToLatLngRings(coverageArea) ? (
        <div className="odm-rm-chip odm-rm-chip-radius">
          {x.radiusChip} {Math.round(radiusMeters)} m
        </div>
      ) : null}
    </div>
  )
}
