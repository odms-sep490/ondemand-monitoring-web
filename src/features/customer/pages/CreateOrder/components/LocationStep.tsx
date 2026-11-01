import { Button } from 'antd'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { env } from '../../../../../config/env'
import { useI18n } from '../../../../../shared/i18n'
import {
  HCMC_SERVICE_CENTER,
  hcmcServicePolygonLatLngs,
  isInsideHcmcServiceArea,
} from '../../../../../shared/lib/serviceArea'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { LocationPanel } from './LocationPanel'
import { locationStepMessages } from './LocationStep.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

type GeocodeResult = {
  latitude: number
  longitude: number
  displayName?: string
}

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

export function RealLocationMap({
  latitude,
  longitude,
  radiusM,
  label,
  labels,
  onPick,
  cameraRequest = 0,
}: {
  latitude: string
  longitude: string
  radiusM: number
  label: string
  labels: { street: string; satellite: string }
  onPick: (latitude: number, longitude: number) => void
  cameraRequest?: number
}) {
  const { t } = useI18n(locationStepMessages)
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const serviceArea = useRef<L.Polygon | null>(null)
  const baseLayers = useRef<{ street: L.Layer; satellite: L.Layer } | null>(
    null,
  )
  const layersControl = useRef<L.Control.Layers | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const onPickRef = useRef(onPick)
  const [tilesFailed, setTilesFailed] = useState(false)
  const loadedTileCount = useRef(0)
  onPickRef.current = onPick

  function markTileLoaded() {
    loadedTileCount.current += 1
    setTilesFailed(false)
  }

  function markTileFailed(kind: string, event: L.TileErrorEvent) {
    const tile = event.tile as HTMLImageElement | undefined
    console.warn(`[CreateRequestMap] ${kind} tile failed to load`, {
      url: tile?.src,
      coords: event.coords,
      error: event.error,
    })
    if (loadedTileCount.current === 0) {
      setTilesFailed(true)
    }
  }

  useLayoutEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: false,
      layers: [],
    }).setView(
      [HCMC_SERVICE_CENTER.latitude, HCMC_SERVICE_CENTER.longitude],
      12,
    )

    const streetFallbackLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', (event: L.TileErrorEvent) =>
        markTileFailed('Street fallback', event),
      )

    const osmLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', (event: L.TileErrorEvent) =>
        markTileFailed('Map', event),
      )

    const streetLayer = L.layerGroup([streetFallbackLayer, osmLayer]).addTo(
      instance,
    )

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', (event: L.TileErrorEvent) =>
        markTileFailed('Satellite', event),
      )

    baseLayers.current = { street: streetLayer, satellite: satelliteLayer }
    setMapReady(true)

    serviceArea.current = L.polygon(hcmcServicePolygonLatLngs(), {
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.08,
      weight: 2,
    }).addTo(instance)

    instance.on('click', (event: L.LeafletMouseEvent) => {
      onPickRef.current(event.latlng.lat, event.latlng.lng)
    })
    instance.on('baselayerchange', () => {
      loadedTileCount.current = 0
      setTilesFailed(false)
    })
    map.current = instance
    const refreshMapSize = () => {
      if (!container.current || !map.current) return
      if (
        container.current.clientWidth === 0 ||
        container.current.clientHeight === 0
      )
        return
      instance.invalidateSize({ animate: false, pan: false })
      instance.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) layer.redraw()
      })
    }
    const refreshTimers = [0, 100, 300, 800].map((delay) =>
      window.setTimeout(refreshMapSize, delay),
    )
    const readyRefresh = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(refreshMapSize)
      })
    }
    instance.whenReady(readyRefresh)
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            window.requestAnimationFrame(refreshMapSize)
          })
    resizeObserver?.observe(container.current)
    if (container.current.parentElement) {
      resizeObserver?.observe(container.current.parentElement)
    }
    window.addEventListener('resize', refreshMapSize)
    return () => {
      refreshTimers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', refreshMapSize)
      resizeObserver?.disconnect()
      instance.remove()
      map.current = null
      circle.current = null
      marker.current = null
      serviceArea.current = null
      baseLayers.current = null
      layersControl.current = null
      setMapReady(false)
    }
  }, [])

  // Re-create the layer switcher when the UI language changes so its labels follow it.
  useEffect(() => {
    if (!mapReady || !map.current || !baseLayers.current) return
    layersControl.current?.remove()
    layersControl.current = L.control
      .layers(
        {
          [labels.street]: baseLayers.current.street,
          [labels.satellite]: baseLayers.current.satellite,
        },
        undefined,
        { position: 'topright', collapsed: false },
      )
      .addTo(map.current)
  }, [mapReady, labels.street, labels.satellite])

  useEffect(() => {
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (
      !map.current ||
      !latitude ||
      !longitude ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      return
    const center: L.LatLngExpression = [lat, lng]
    if (marker.current) {
      marker.current.setLatLng(center)
    } else {
      marker.current = L.marker(center).addTo(map.current)
    }
    if (circle.current) {
      circle.current.setLatLng(center).setRadius(radiusM)
    } else {
      circle.current = L.circle(center, {
        radius: radiusM,
        color: '#1565e8',
        fillColor: '#1565e8',
        fillOpacity: 0.14,
      }).addTo(map.current)
    }
  }, [latitude, longitude, radiusM])

  useEffect(() => {
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!map.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return
    map.current.setView([lat, lng], 16)
  }, [cameraRequest])

  const lat = Number(latitude)
  const lng = Number(longitude)
  const invalidCoordinates =
    Boolean(latitude || longitude) &&
    (!Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180)
  const outsideServiceArea =
    !invalidCoordinates &&
    Boolean(latitude && longitude) &&
    !isInsideHcmcServiceArea({ latitude: lat, longitude: lng })

  return (
    <div className="co-real-map-wrap">
      <div
        ref={container}
        className={`co-real-map${tilesFailed ? ' has-tile-fallback' : ''}`}
        role="region"
        aria-label={label}
        aria-describedby="co-map-instructions"
      />
      {invalidCoordinates ? (
        <div className="co-real-map-notice">{t.invalidCoordinates}</div>
      ) : null}
      {outsideServiceArea ? (
        <div className="co-real-map-notice">{t.outsideServiceArea}</div>
      ) : null}
    </div>
  )
}

/** Customer chooses a WGS84 target, not a point on the Gazebo image. */
export function LocationStep({ form, errors, update }: Props) {
  const { t } = useI18n(locationStepMessages)
  const [locatingAddress, setLocatingAddress] = useState(false)
  const [addressLookupError, setAddressLookupError] = useState<string | null>(
    null,
  )
  const [cameraRequest, setCameraRequest] = useState(0)
  const reverseLookupId = useRef(0)
  async function locateAddress() {
    const query = form.address.trim()
    if (!query || locatingAddress) return

    setLocatingAddress(true)
    setAddressLookupError(null)
    update('locationStatus', 'resolving')
    try {
      const params = new URLSearchParams({ q: query })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/search?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
          credentials: 'include',
        },
      )
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<GeocodeResult> | null
      if (!response.ok || payload?.success === false) {
        if (response.status === 404) {
          setAddressLookupError('NOT_FOUND')
          update('locationStatus', 'error')
          return
        }
        throw new Error(payload?.message ?? `HTTP ${response.status}`)
      }
      const place = payload?.data
      if (!place) {
        setAddressLookupError('NOT_FOUND')
        update('locationStatus', 'error')
        return
      }
      const lat = Number(place.latitude)
      const lng = Number(place.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setAddressLookupError('NOT_FOUND')
        update('locationStatus', 'error')
        return
      }
      update('latitude', lat.toFixed(7))
      update('longitude', lng.toFixed(7))
      const normalizedAddress = place.displayName?.trim() || query
      update('address', normalizedAddress)
      update('normalizedAddress', normalizedAddress)
      update('locationSource', 'search')
      update('locationConfirmedAt', new Date().toISOString())
      update('locationStatus', 'confirmed')
      setCameraRequest((current) => current + 1)
    } catch (error) {
      console.error('[CreateRequestMap] Address geocoding failed', error)
      setAddressLookupError(
        error instanceof Error ? error.message : t.addressLookupFailed,
      )
      update('locationStatus', 'error')
    } finally {
      setLocatingAddress(false)
    }
  }

  async function updateAddressFromPoint(latitude: number, longitude: number) {
    const lookupId = reverseLookupId.current + 1
    reverseLookupId.current = lookupId
    update('latitude', latitude.toFixed(7))
    update('longitude', longitude.toFixed(7))
    update('address', '')
    update('normalizedAddress', '')
    update('locationSource', 'map')
    update('locationConfirmedAt', '')
    update('locationStatus', 'resolving')
    setAddressLookupError(null)

    try {
      const params = new URLSearchParams({
        latitude: latitude.toFixed(7),
        longitude: longitude.toFixed(7),
      })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/reverse?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
          credentials: 'include',
        },
      )
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<GeocodeResult> | null
      if (lookupId !== reverseLookupId.current) return
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`)
      }
      const address = payload?.data?.displayName?.trim()
      if (address) {
        update('address', address)
        update('normalizedAddress', address)
        update('locationConfirmedAt', new Date().toISOString())
        update('locationStatus', 'confirmed')
      }
    } catch (error) {
      if (lookupId !== reverseLookupId.current) return
      console.error('[CreateRequestMap] Reverse geocoding failed', error)
      setAddressLookupError(
        error instanceof Error ? error.message : t.reverseLookupFailed,
      )
      update('locationStatus', 'error')
    }
  }

  function markLocationStale() {
    update('normalizedAddress', '')
    update('locationConfirmedAt', '')
    update('locationStatus', 'stale')
  }

  function confirmManualCoordinates() {
    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    const coordinateLabel = `${latitude.toFixed(7)}, ${longitude.toFixed(7)}`
    update('address', form.address.trim() || coordinateLabel)
    update('normalizedAddress', form.address.trim() || coordinateLabel)
    update('locationSource', 'gps')
    update('locationConfirmedAt', new Date().toISOString())
    update('locationStatus', 'confirmed')
    setAddressLookupError(null)
    setCameraRequest((current) => current + 1)
  }

  return (
    <div className="co-stack">
      <div className="co-grid is-location">
        <div className="co-location-left">
          <RealLocationMap
            latitude={form.latitude}
            longitude={form.longitude}
            radiusM={form.radiusM}
            label={t.mapLabel}
            labels={{ street: t.layerStreet, satellite: t.layerSatellite }}
            onPick={(latitude, longitude) => {
              void updateAddressFromPoint(latitude, longitude)
            }}
            cameraRequest={cameraRequest}
          />
          <div className="co-map-toolbar">
            <p id="co-map-instructions">{t.mapInstructions}</p>
            <div>
              <Button
                size="small"
                onClick={() => setCameraRequest((current) => current + 1)}
              >
                {t.recenter}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  update('address', '')
                  update('normalizedAddress', '')
                  update('locationStatus', 'unconfirmed')
                  update('locationSource', '')
                  update('locationConfirmedAt', '')
                  setAddressLookupError(null)
                }}
              >
                {t.resetLocation}
              </Button>
            </div>
          </div>
          <div className="co-map-legend" aria-label={t.legendTitle}>
            <span>
              <i className="is-monitoring" />
              {t.legendMonitoring}
            </span>
            <span>
              <i className="is-service" />
              {t.legendService}
            </span>
            <span>
              <i className="is-unknown" />
              {t.legendUnknown}
            </span>
          </div>
        </div>
        <div className="co-stack co-location-settings">
          <LocationPanel
            form={form}
            errors={errors}
            locatingAddress={locatingAddress}
            addressLookupError={addressLookupError}
            onLocateAddress={locateAddress}
            onAddressChange={(value) => {
              update('address', value)
              markLocationStale()
            }}
            onCoordinateChange={(field, value) => {
              update(field, value)
              update('locationSource', 'gps')
              markLocationStale()
            }}
            onConfirmCoordinates={confirmManualCoordinates}
            onRadiusChange={(value) =>
              update('radiusM', Math.min(1500, Math.max(100, value || 100)))
            }
          />
        </div>
      </div>
      <section
        className="co-flight-status"
        aria-labelledby="co-flight-status-title"
      >
        <div>
          <strong id="co-flight-status-title">{t.flightTitle}</strong>
          <span className="co-status-neutral">{t.flightNotVerified}</span>
        </div>
        <p>{t.flightBody}</p>
        <a href="https://cambay.mod.gov.vn/" target="_blank" rel="noreferrer">
          {t.flightLink}
        </a>
        <small>{t.flightNote}</small>
      </section>
    </div>
  )
}
