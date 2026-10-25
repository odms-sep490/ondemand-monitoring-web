import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  SATELLITE_MAX_NATIVE_ZOOM,
  SATELLITE_TILE_URL,
} from '../satelliteSource'

type Props = {
  latitude: number | null | undefined
  longitude: number | null | undefined
  heading?: number | null
  altitude?: number | null
}

const MOVE_DURATION_S = 0.9

/** Closer to the ground => closer zoom. Stepped so the picture does not breathe constantly. */
export function cameraZoomForAltitude(altitudeM: number | null | undefined) {
  if (typeof altitudeM !== 'number' || !Number.isFinite(altitudeM)) return 18
  if (altitudeM <= 80) return 18
  if (altitudeM <= 140) return 17.5
  return 17
}

function validCoordinate(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    (lat !== 0 || lon !== 0)
  )
}

/**
 * Display-only satellite map that follows the drone: centred on the same GPS telemetry as the
 * main flight map, rotated so the drone heading points up (gimbal looking straight down).
 * Leaflet cannot rotate a map natively, so the map lives in an oversized square that is rotated
 * with CSS; the HUD sits outside it and never rotates.
 */
export function CameraSatelliteMap({
  latitude,
  longitude,
  heading,
  altitude,
}: Props) {
  const frame = useRef<HTMLDivElement>(null)
  const rotor = useRef<HTMLDivElement>(null)
  const mapEl = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const centered = useRef(false)
  const angle = useRef(0)
  const lastUpdateAt = useRef<number | null>(null)
  const moveDurationS = useRef(MOVE_DURATION_S)

  useEffect(() => {
    if (!frame.current || !rotor.current || !mapEl.current) return
    const instance = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      tap: false,
      zoomSnap: 0,
      fadeAnimation: false,
    } as L.MapOptions).setView([0, 0], 2)
    L.tileLayer(SATELLITE_TILE_URL, {
      maxZoom: SATELLITE_MAX_NATIVE_ZOOM,
      maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
      keepBuffer: 4,
    }).addTo(instance)
    map.current = instance

    const resize = () => {
      if (!frame.current || !rotor.current) return
      const { width, height } = frame.current.getBoundingClientRect()
      const side = Math.ceil(Math.hypot(width, height))
      rotor.current.style.width = `${side}px`
      rotor.current.style.height = `${side}px`
      rotor.current.style.marginLeft = `${-side / 2}px`
      rotor.current.style.marginTop = `${-side / 2}px`
      instance.invalidateSize({ animate: false })
      window.requestAnimationFrame(() =>
        instance.invalidateSize({ animate: false }),
      )
    }
    resize()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(frame.current)
    return () => {
      observer?.disconnect()
      instance.remove()
      map.current = null
      centered.current = false
    }
  }, [])

  // Follow the drone: update the existing map instance, never recreate it.
  useEffect(() => {
    const instance = map.current
    if (!instance || !validCoordinate(latitude, longitude)) return
    const zoom = cameraZoomForAltitude(altitude)
    // Glide for as long as the gap between telemetry samples, so the ground keeps sliding.
    const now = performance.now()
    if (lastUpdateAt.current !== null) {
      moveDurationS.current = Math.max(
        0.25,
        Math.min(3, (now - lastUpdateAt.current) / 1000),
      )
    }
    lastUpdateAt.current = now
    if (rotor.current)
      rotor.current.style.transitionDuration = `${moveDurationS.current}s`
    instance.setView([latitude, longitude as number], zoom, {
      animate: centered.current,
      duration: moveDurationS.current,
      easeLinearity: 1,
    })
    centered.current = true
  }, [latitude, longitude, altitude])

  // Rotate with heading along the shortest arc (no spin when crossing 359° -> 0°).
  useEffect(() => {
    if (
      !rotor.current ||
      typeof heading !== 'number' ||
      !Number.isFinite(heading)
    )
      return
    const target = ((heading % 360) + 360) % 360
    const current = ((angle.current % 360) + 360) % 360
    let delta = target - current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    angle.current += delta
    rotor.current.style.transform = `rotate(${-angle.current}deg)`
  }, [heading])

  return (
    <div ref={frame} className="camera-satellite-map" aria-hidden="true">
      <div ref={rotor} className="camera-satellite-rotor">
        <div ref={mapEl} className="camera-satellite-leaflet" />
      </div>
    </div>
  )
}
