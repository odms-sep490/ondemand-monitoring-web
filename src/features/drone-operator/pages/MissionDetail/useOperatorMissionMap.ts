import type { OperatorMission } from '../../types/mission'
import { useRef, useEffect } from 'react'
import L from 'leaflet'
import { missionTargetGps, routeMarkerIcon } from './missionGeo'
import type { GpsPoint } from './types'
import { HCMC_SERVICE_CENTER } from '../../../../shared/lib/serviceArea'

export function useOperatorMissionMap(mission: OperatorMission) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const homeMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.Marker | null>(null)
  const routeLine = useRef<L.Polyline | null>(null)
  const target = missionTargetGps(mission)
  const targetLat = target?.latitude
  const targetLon = target?.longitude
  const homePoint: GpsPoint = {
    latitude: HCMC_SERVICE_CENTER.latitude,
    longitude: HCMC_SERVICE_CENTER.longitude,
  }
  const home: L.LatLngExpression = [homePoint.latitude, homePoint.longitude]

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!container.current || map.current) return
    const initialCenter: L.LatLngExpression = target
      ? [target.latitude, target.longitude]
      : [HCMC_SERVICE_CENTER.latitude, HCMC_SERVICE_CENTER.longitude]
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
      marker.current = null
      circle.current = null
      homeMarker.current = null
      targetMarker.current = null
      routeLine.current = null
    }
  }, [targetLat, targetLon])

  useEffect(() => {
    if (!map.current) return
    const point: L.LatLngExpression | null = target
      ? [target.latitude, target.longitude]
      : null

    if (!target || !point) return
    const targetPoint: GpsPoint = {
      latitude: target.latitude,
      longitude: target.longitude,
    }
    const route = [homePoint, targetPoint]
    const routeLatLngs = route.map(
      (routePoint) =>
        [routePoint.latitude, routePoint.longitude] as L.LatLngExpression,
    )

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
      targetMarker.current.setLatLng(point)
    } else {
      targetMarker.current = L.marker(point, {
        icon: routeMarkerIcon('TARGET', '#dc2626'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
    }

    if (routeLine.current) {
      routeLine.current.setLatLngs(routeLatLngs)
    } else {
      routeLine.current = L.polyline(routeLatLngs, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.95,
        dashArray: '8 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map.current)
    }

    if (marker.current) {
      marker.current.setLatLng(point)
    } else {
      marker.current = L.marker(point)
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
    }

    if (mission.radiusMeters && mission.radiusMeters > 0) {
      if (circle.current) {
        circle.current.setLatLng(point).setRadius(mission.radiusMeters)
      } else {
        circle.current = L.circle(point, {
          radius: mission.radiusMeters,
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

    const bounds = L.latLngBounds([home, point])
    if (circle.current) bounds.extend(circle.current.getBounds())
    if (routeLine.current) bounds.extend(routeLine.current.getBounds())
    map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  }, [targetLat, targetLon, mission.radiusMeters])

  return { container, target }
}
