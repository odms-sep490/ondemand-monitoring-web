import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { env } from '../../../../../config/env'
import {
  bearingDegrees,
  buildFlightPath,
  isRestrictedGpsZonePayload,
  isValidGps,
  type GpsPoint,
  type RestrictedGpsZone,
  withDefaultRestrictedGpsZones,
} from '../gpsRoutePlanner'
import { SATELLITE_TILE_URL } from '../satelliteSource'
import {
  droneArrowIcon,
  sameGpsPoint,
  lerpGpsPoint,
} from '../satelliteMapHelpers'
import { type GpsPosition } from '../satelliteMapTypes'

type Props = {
  missionId: string
  target: { latitude: number; longitude: number } | null
  drone: GpsPosition | null
}

export function SatelliteFlightMap({ missionId, target, drone }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const droneMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.CircleMarker | null>(null)
  const track = useRef<L.Polyline | null>(null)
  const targetLine = useRef<L.Polyline | null>(null)
  const zoneLayers = useRef<L.Polygon[]>([])
  const zones = useRef<RestrictedGpsZone[]>([])
  const trackPoints = useRef<L.LatLngExpression[]>([])
  const displayedDronePoint = useRef<GpsPoint | null>(null)
  const droneAnimationFrame = useRef<number | null>(null)
  const lastDroneUpdateAt = useRef<number | null>(null)
  const centeredOnDrone = useRef(false)

  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, { zoomControl: true }).setView(
      [0, 0],
      2,
    )
    instance.zoomControl.setPosition('topright')
    L.control
      .scale({ imperial: false, position: 'topright', maxWidth: 140 })
      .addTo(instance)
    L.tileLayer(SATELLITE_TILE_URL, {
      maxZoom: 19,
      attribution:
        'Imagery &copy; Esri, Maxar, Earthstar Geographics, GIS User Community',
    }).addTo(instance)
    track.current = L.polyline([], {
      color: 'transparent',
      weight: 0,
      opacity: 0,
    }).addTo(instance)
    targetLine.current = L.polyline([], {
      color: '#60a5fa',
      dashArray: '10 8',
      opacity: 0.95,
      weight: 2,
    }).addTo(instance)
    map.current = instance
    return () => {
      if (droneAnimationFrame.current !== null)
        window.cancelAnimationFrame(droneAnimationFrame.current)
      instance.remove()
      map.current = null
      droneMarker.current = null
      targetMarker.current = null
      track.current = null
      targetLine.current = null
      displayedDronePoint.current = null
      droneAnimationFrame.current = null
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const restrictedZones = withDefaultRestrictedGpsZones(
          items
            .filter(isRestrictedGpsZonePayload)
            .map(
              (zone: {
                id?: string
                code?: string
                name?: string
                coordinates?: number[][]
              }) => ({
                id: String(
                  zone.id ?? zone.code ?? zone.name ?? 'restricted-zone',
                ),
                code: zone.code,
                name: zone.name,
                coordinates: (zone.coordinates ?? [])
                  .map((point) => ({
                    longitude: Number(point[0]),
                    latitude: Number(point[1]),
                  }))
                  .filter(isValidGps),
              }),
            )
            .filter((zone: RestrictedGpsZone) => zone.coordinates.length >= 3),
        )
        if (!alive) return
        zones.current = restrictedZones

        if (!map.current) return
        for (const layer of zoneLayers.current) layer.remove()
        zoneLayers.current = restrictedZones.map((zone: RestrictedGpsZone) =>
          L.polygon(
            zone.coordinates.map((point) => [point.latitude, point.longitude]),
            {
              color: '#ef4444',
              dashArray: '6 6',
              fillColor: '#ef4444',
              fillOpacity: 0.18,
              weight: 2,
            },
          )
            .addTo(map.current!)
            .bindTooltip(zone.name ?? zone.code ?? 'Vùng cấm bay'),
        )
      } catch {
        if (alive) zones.current = withDefaultRestrictedGpsZones([])
      }
    }

    void loadZones()
    const timer = window.setInterval(loadZones, 10000)
    return () => {
      alive = false
      window.clearInterval(timer)
      for (const layer of zoneLayers.current) layer.remove()
      zoneLayers.current = []
    }
  }, [])

  useEffect(() => {
    if (droneAnimationFrame.current !== null)
      window.cancelAnimationFrame(droneAnimationFrame.current)
    droneAnimationFrame.current = null
    displayedDronePoint.current = null
    trackPoints.current = []
    track.current?.setLatLngs([])
    targetLine.current?.setLatLngs([])
    centeredOnDrone.current = false
  }, [missionId])

  useEffect(() => {
    if (!map.current) return
    if (!isValidGps(target)) {
      targetMarker.current?.remove()
      targetMarker.current = null
      return
    }
    const point: L.LatLngExpression = [target.latitude, target.longitude]
    if (targetMarker.current) targetMarker.current.setLatLng(point)
    else {
      targetMarker.current = L.circleMarker(point, {
        radius: 9,
        color: '#fff',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 1,
      })
        .addTo(map.current)
        .bindTooltip('Mission target')
    }
    if (!centeredOnDrone.current) map.current.setView(point, 16)
  }, [target?.latitude, target?.longitude])

  useEffect(() => {
    if (!map.current) return
    if (!isValidGps(drone)) {
      if (droneAnimationFrame.current !== null)
        window.cancelAnimationFrame(droneAnimationFrame.current)
      droneAnimationFrame.current = null
      displayedDronePoint.current = null
      droneMarker.current?.remove()
      droneMarker.current = null
      targetLine.current?.setLatLngs([])
      return
    }
    const currentPoint = {
      latitude: drone.latitude,
      longitude: drone.longitude,
    }
    const point: L.LatLngExpression = [
      currentPoint.latitude,
      currentPoint.longitude,
    ]
    const previous = trackPoints.current.at(-1)
    const previousPoint = Array.isArray(previous)
      ? { latitude: Number(previous[0]), longitude: Number(previous[1]) }
      : null
    const flightPath = isValidGps(target)
      ? buildFlightPath(currentPoint, target, zones.current)
      : []
    const heading =
      flightPath.length > 1 ? bearingDegrees(currentPoint, flightPath[1]) : 0
    // Rotate the existing icon in place. Replacing the icon (setIcon) rebuilt the DOM on every
    // frame, which was expensive and restarted the rotor animation.
    const setMarkerHeading = (deg: number) => {
      const el = droneMarker.current
        ?.getElement()
        ?.querySelector<HTMLElement>('.satellite-drone-arrow')
      if (el) el.style.transform = `rotate(${deg}deg)`
    }
    if (droneMarker.current) {
      setMarkerHeading(heading)
    } else {
      droneMarker.current = L.marker(point, {
        icon: droneArrowIcon(heading),
        zIndexOffset: 1000,
      })
        .addTo(map.current)
        .bindTooltip('PX4 drone')
    }
    // Animate over the time we expect until the next telemetry sample (the last measured
    // interval), so the marker glides continuously instead of "move 0.5s, then stand still".
    const updateAt = window.performance.now()
    const measuredIntervalMs =
      lastDroneUpdateAt.current === null
        ? 600
        : updateAt - lastDroneUpdateAt.current
    lastDroneUpdateAt.current = updateAt
    const durationMs = Math.max(250, Math.min(3000, measuredIntervalMs))
    const animationStart =
      displayedDronePoint.current ?? previousPoint ?? currentPoint
    if (droneAnimationFrame.current !== null)
      window.cancelAnimationFrame(droneAnimationFrame.current)
    if (!sameGpsPoint(animationStart, currentPoint)) {
      const startedAt = updateAt
      let lastRouteAt = 0
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / durationMs)
        const nextPoint = lerpGpsPoint(animationStart, currentPoint, progress)
        const nextLatLng: L.LatLngExpression = [
          nextPoint.latitude,
          nextPoint.longitude,
        ]
        droneMarker.current?.setLatLng(nextLatLng)
        displayedDronePoint.current = nextPoint
        // Route planning is the costly part: refresh it ~8x per second, not every frame.
        if (isValidGps(target) && (now - lastRouteAt >= 120 || progress >= 1)) {
          lastRouteAt = now
          const route = buildFlightPath(nextPoint, target, zones.current)
          setMarkerHeading(
            route.length > 1 ? bearingDegrees(nextPoint, route[1]) : 0,
          )
          targetLine.current?.setLatLngs(
            route.map((routePoint) => [
              routePoint.latitude,
              routePoint.longitude,
            ]),
          )
        }
        if (progress < 1)
          droneAnimationFrame.current = window.requestAnimationFrame(animate)
        else {
          droneAnimationFrame.current = null
          // keep the drone on screen while it flies
          const instance = map.current
          if (
            instance &&
            !instance.getBounds().pad(-0.2).contains(nextLatLng)
          ) {
            instance.panTo(nextLatLng, { animate: true, duration: 0.8 })
          }
        }
      }
      droneAnimationFrame.current = window.requestAnimationFrame(animate)
    } else {
      droneMarker.current.setLatLng(point)
      displayedDronePoint.current = currentPoint
    }
    if (
      !previous ||
      !Array.isArray(previous) ||
      previous[0] !== currentPoint.latitude ||
      previous[1] !== currentPoint.longitude
    ) {
      trackPoints.current.push(point)
      if (trackPoints.current.length > 500) trackPoints.current.shift()
      track.current?.setLatLngs(trackPoints.current)
    }
    if (isValidGps(target)) {
      const route = buildFlightPath(currentPoint, target, zones.current)
      targetLine.current?.setLatLngs(
        route.map((routePoint) => [routePoint.latitude, routePoint.longitude]),
      )
    } else targetLine.current?.setLatLngs([])
    if (!centeredOnDrone.current) {
      map.current.setView(point, 17)
      centeredOnDrone.current = true
    }
  }, [drone?.latitude, drone?.longitude])

  return (
    <div
      ref={container}
      className="satellite-flight-map"
      role="application"
      aria-label="Live satellite flight map"
    />
  )
}
