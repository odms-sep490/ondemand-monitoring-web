import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { HCMC_SERVICE_CENTER } from '../../../../../shared/lib/serviceArea'

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
  latitude,
  longitude,
  radiusMeters,
}: {
  missionId: string
  latitude: number | null
  longitude: number | null
  radiusMeters?: number | null
}) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const homeMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.Marker | null>(null)
  const routeLine = useRef<L.Polyline | null>(null)
  const targetPin = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const target = validGps({
    latitude: latitude ?? Number.NaN,
    longitude: longitude ?? Number.NaN,
  })
    ? { latitude: latitude as number, longitude: longitude as number }
    : null
  const targetLat = target?.latitude
  const targetLon = target?.longitude
  const homePoint = HCMC_SERVICE_CENTER

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!container.current || map.current) return
    const initialCenter: L.LatLngExpression = target
      ? [target.latitude, target.longitude]
      : [homePoint.latitude, homePoint.longitude]
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(initialCenter, target ? 16 : 11)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    map.current = instance
    window.setTimeout(() => instance.invalidateSize(), 0)
    return () => {
      instance.remove()
      map.current = null
      homeMarker.current = null
      targetMarker.current = null
      routeLine.current = null
      targetPin.current = null
      circle.current = null
    }
  }, [homePoint.latitude, homePoint.longitude, targetLat, targetLon])

  useEffect(() => {
    if (!map.current) return
    const home: L.LatLngExpression = [homePoint.latitude, homePoint.longitude]

    if (!target) {
      map.current.setView(home, 11)
      return
    }

    const targetLatLng: L.LatLngExpression = [target.latitude, target.longitude]
    // The visual line is informational only.
    const route = [homePoint, target]
    const routeLatLngs = route.map(
      (routePoint) =>
        [routePoint.latitude, routePoint.longitude] as L.LatLngExpression,
    )
    const routeColor = '#2563eb'

    if (homeMarker.current) {
      homeMarker.current.setLatLng(home)
    } else {
      homeMarker.current = L.marker(home, {
        icon: routeMarkerIcon('HOME', '#16a34a'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm xuất phát')
    }

    if (targetMarker.current) {
      targetMarker.current.setLatLng(targetLatLng)
    } else {
      targetMarker.current = L.marker(targetLatLng, {
        icon: routeMarkerIcon('TARGET', '#dc2626'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
    }

    if (routeLine.current) {
      routeLine.current.setLatLngs(routeLatLngs).setStyle({ color: routeColor })
    } else {
      routeLine.current = L.polyline(routeLatLngs, {
        color: routeColor,
        weight: 4,
        opacity: 0.95,
        dashArray: '8 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map.current)
    }

    if (targetPin.current) {
      targetPin.current.setLatLng(targetLatLng)
    } else {
      targetPin.current = L.marker(targetLatLng)
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
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

    const bounds = L.latLngBounds([home, targetLatLng])
    if (circle.current) bounds.extend(circle.current.getBounds())
    if (routeLine.current) bounds.extend(routeLine.current.getBounds())
    map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  }, [homePoint, radiusMeters, targetLat, targetLon])

  return (
    <div
      className="odm-rm-satellite"
      role="application"
      aria-label="Bản đồ vệ tinh mission"
    >
      <div ref={container} className="odm-rm-leaflet" />
      {target ? (
        <div className="odm-rm-chip odm-rm-chip-target">
          ĐIỂM GIÁM SÁT · {target.latitude.toFixed(6)},{' '}
          {target.longitude.toFixed(6)}
        </div>
      ) : null}
      {target ? (
        <div className="odm-rm-chip odm-rm-chip-route">
          Đường bay: HOME → điểm giám sát
        </div>
      ) : null}
      {radiusMeters ? (
        <div className="odm-rm-chip odm-rm-chip-radius">
          Bán kính giám sát: {Math.round(radiusMeters)} m
        </div>
      ) : null}
      {!target ? (
        <div className="odm-rm-empty">Chưa có tọa độ mission</div>
      ) : null}
    </div>
  )
}
