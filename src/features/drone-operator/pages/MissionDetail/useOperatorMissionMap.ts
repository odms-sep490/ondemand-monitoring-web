import type { OperatorMission } from '../../types/mission'
import { useRef, useEffect } from 'react'
import L from 'leaflet'
import { missionTargetGps, routeMarkerIcon } from './missionGeo'
import type { GpsPoint } from './types'
import { HCMC_SERVICE_CENTER } from '../../../../shared/lib/serviceArea'

export function useOperatorMissionMap(
  mission: OperatorMission,
  viewMode: 'area' | 'route' = 'area',
) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
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
      zoomControl: false,
      attributionControl: true,
    }).setView(initialCenter, target ? 16 : 11)

    L.control
      .zoom({
        zoomInTitle: 'Phóng to bản đồ',
        zoomOutTitle: 'Thu nhỏ bản đồ',
      })
      .addTo(instance)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    map.current = instance
    const resizeObserver = new ResizeObserver(() => {
      instance.invalidateSize({ pan: false })
    })
    resizeObserver.observe(container.current)
    const frame = window.requestAnimationFrame(() => {
      instance.invalidateSize({ pan: false })
    })
    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(frame)
      instance.remove()
      map.current = null
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
        keyboard: true,
        title: 'Điểm xuất phát HOME',
        alt: 'Điểm xuất phát HOME',
      })
        .addTo(map.current)
        .bindTooltip('Điểm xuất phát')
    }

    if (targetMarker.current) {
      targetMarker.current.setLatLng(point)
    } else {
      targetMarker.current = L.marker(point, {
        icon: routeMarkerIcon('TARGET', '#dc2626'),
        keyboard: true,
        title: 'Điểm giám sát',
        alt: 'Điểm giám sát',
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

    targetMarker.current.addTo(map.current)

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

    if (viewMode === 'route') {
      homeMarker.current.addTo(map.current)
      routeLine.current.addTo(map.current)
      const routeBounds = L.latLngBounds([home, point])
      if (circle.current) routeBounds.extend(circle.current.getBounds())
      map.current.fitBounds(routeBounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 40],
        maxZoom: 15,
      })
    } else {
      homeMarker.current.remove()
      routeLine.current.remove()
      if (circle.current) {
        map.current.fitBounds(circle.current.getBounds(), {
          padding: [52, 52],
          maxZoom: 16,
        })
      } else {
        map.current.setView(point, 16)
      }
    }
  }, [targetLat, targetLon, mission.radiusMeters, viewMode])

  return { container, target }
}
