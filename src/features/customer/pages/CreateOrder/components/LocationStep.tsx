import { Button } from 'antd'
import {
  AimOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { env } from '../../../../../config/env'
import { useI18n } from '../../../../../shared/i18n'
import {
  HCMC_SERVICE_CENTER,
  hcmcServicePolygonLatLngs,
  isInsideHcmcServiceArea,
  isLocationInsideCoverageArea,
} from '../../../../../shared/lib/serviceArea'
import type {
  CoverageAreaGeometry,
  CoverageAreaShape,
  FormErrors,
  FormState,
  GeoPosition,
  UpdateField,
} from '../../../lib/createOrder/types'
import { FormField } from '../../../components/common/ui'
import {
  closeCoverageRing,
  coverageAreaMetrics,
  circleCoverageArea,
  formatAreaM2,
  formatLengthM,
  isValidCoverageArea,
  rectangleCoverageArea,
} from '../../../lib/createOrder/coverageGeometry'
import { MonitoringAreaMap, type MapInteractionMode } from './MonitoringAreaMap'
import { monitoringAreaMessages } from './MonitoringArea.messages'
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

function isPolygonShape(shape: CoverageAreaShape) {
  return shape === 'POLYGON' || shape === 'FREEHAND'
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
  const { t } = useI18n(monitoringAreaMessages)
  const [locatingAddress, setLocatingAddress] = useState(false)
  const [locatingDevice, setLocatingDevice] = useState(false)
  const [addressLookupError, setAddressLookupError] = useState<string | null>(
    null,
  )
  const [interactionMode, setInteractionMode] =
    useState<MapInteractionMode>('location')
  const [addVertexMode, setAddVertexMode] = useState(false)
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null)
  const reverseLookupId = useRef(0)
  const history = useRef<{
    undo: AreaSnapshot[]
    redo: AreaSnapshot[]
  }>({ undo: [], redo: [] })

  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)
  const validCoordinates =
    form.latitude.trim() !== '' &&
    form.longitude.trim() !== '' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  const locationSelected =
    validCoordinates &&
    form.locationStatus === 'confirmed' &&
    Boolean(form.locationConfirmedAt)
  const coordinateLabel = validCoordinates
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : ''
  const selectedLocationLabel =
    form.normalizedAddress.trim() ||
    (locationSelected ? `${t.coordinatesLabel}: ${coordinateLabel}` : '')
  const metrics = coverageAreaMetrics(form.coverageArea)
  const areaValid = isValidCoverageArea(form.coverageArea)
  const locationOutsideArea = areaValid && validCoordinates && locationSelected &&
    !isLocationInsideCoverageArea({ latitude, longitude }, form.coverageArea)
  const hasClosedArea = (() => {
    const ring = form.coverageArea?.coordinates[0]
    const first = ring?.[0]
    const last = ring?.at(-1)
    return Boolean(
      first &&
      last &&
      Math.abs(first[0] - last[0]) < 1e-8 &&
      Math.abs(first[1] - last[1]) < 1e-8,
    )
  })()
  const circleCenter = form.coverageAreaCenter

  function snapshot(): AreaSnapshot {
    return {
      shape: form.coverageAreaShape,
      area: form.coverageArea,
      center: form.coverageAreaCenter,
      radiusM: form.radiusM,
    }
  }

  function applyArea(next: AreaSnapshot) {
    update('coverageAreaShape', next.shape)
    update('coverageArea', next.area)
    update('coverageAreaCenter', next.center)
    update('radiusM', next.radiusM)
    setSelectedVertex(null)
  }

  function commitArea(next: AreaSnapshot) {
    const current = snapshot()
    if (JSON.stringify(current) === JSON.stringify(next)) return
    history.current.undo = [...history.current.undo.slice(-29), current]
    history.current.redo = []
    applyArea(next)
  }

  function undoArea() {
    const previous = history.current.undo.pop()
    if (!previous) return
    history.current.redo.push(snapshot())
    applyArea(previous)
  }

  function redoArea() {
    const next = history.current.redo.pop()
    if (!next) return
    history.current.undo.push(snapshot())
    applyArea(next)
  }

  async function reverseGeocode(latitudeValue: number, longitudeValue: number) {
    const lookupId = reverseLookupId.current + 1
    reverseLookupId.current = lookupId
    update('latitude', latitudeValue.toFixed(7))
    update('longitude', longitudeValue.toFixed(7))
    update('address', '')
    update('normalizedAddress', '')
    update('locationSource', 'map')
    update('locationConfirmedAt', '')
    update('locationStatus', 'resolving')
    setAddressLookupError(null)

    const confirmCoordinateFallback = () => {
      update('address', '')
      update('normalizedAddress', '')
      update('locationConfirmedAt', new Date().toISOString())
      update('locationStatus', 'confirmed')
      setAddressLookupError(t.reverseFallback)
    }

    try {
      const params = new URLSearchParams({
        latitude: latitudeValue.toFixed(7),
        longitude: longitudeValue.toFixed(7),
      })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/reverse?${params.toString()}`,
        {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        },
      )
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<GeocodeResult> | null
      if (lookupId !== reverseLookupId.current) return
      if (!response.ok || payload?.success === false) {
        confirmCoordinateFallback()
        return
      }
      const address = payload?.data?.displayName?.trim()
      if (address) {
        update('address', address)
        update('normalizedAddress', address)
        update('locationConfirmedAt', new Date().toISOString())
        update('locationStatus', 'confirmed')
      } else {
        confirmCoordinateFallback()
      }
    } catch (error) {
      if (lookupId !== reverseLookupId.current) return
      console.error('[CreateRequestMap] Reverse geocoding failed', error)
      confirmCoordinateFallback()
    }
  }

  async function locateAddress() {
    const query = form.address.trim()
    if (!query || locatingAddress) return
    setLocatingAddress(true)
    setAddressLookupError(null)
    update('locationSource', 'search')
    update('locationStatus', 'resolving')
    update('locationConfirmedAt', '')
    try {
      const params = new URLSearchParams({ q: query })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/search?${params.toString()}`,
        {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        },
      )
      const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<GeocodeResult> | null
      if (!response.ok || payload?.success === false || !payload?.data) {
        if (response.status === 404 || payload?.success === false) {
          setAddressLookupError(t.notFound)
          update('locationStatus', 'error')
          return
        }
        throw new Error(payload?.message ?? `HTTP ${response.status}`)
      }
      const lat = Number(payload.data.latitude)
      const lng = Number(payload.data.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setAddressLookupError(t.notFound)
        update('locationStatus', 'error')
        return
      }
      const resolvedAddress = payload.data.displayName?.trim() ?? ''
      update('latitude', lat.toFixed(7))
      update('longitude', lng.toFixed(7))
      update('address', resolvedAddress)
      update('normalizedAddress', resolvedAddress)
      update('locationSource', 'search')
      update('locationConfirmedAt', new Date().toISOString())
      update('locationStatus', 'confirmed')
      setAddressLookupError(resolvedAddress ? null : t.reverseFallback)
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

  function chooseDeviceLocation() {
    if (!navigator.geolocation) {
      setAddressLookupError(t.geolocationUnavailable)
      return
    }
    setLocatingDevice(true)
    setAddressLookupError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingDevice(false)
        setInteractionMode('location')
        void reverseGeocode(position.coords.latitude, position.coords.longitude)
      },
      () => {
        setLocatingDevice(false)
        setAddressLookupError(t.geolocationFailed)
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    )
  }

  function confirmManualCoordinates() {
    if (!validCoordinates) return
    setInteractionMode('location')
    void reverseGeocode(latitude, longitude)
  }

  function selectShape(shape: Exclude<CoverageAreaShape, ''>) {
    setInteractionMode('area')
    setAddVertexMode(false)
    setAddressLookupError(null)
    if (shape !== form.coverageAreaShape) {
      commitArea({ shape, area: null, center: null, radiusM: form.radiusM })
    }
  }

  function changeRadius(radius: number) {
    const nextRadius = Math.min(1500, Math.max(100, radius))
    const nextArea = circleCenter
      ? circleCoverageArea(circleCenter, nextRadius)
      : form.coverageArea
    commitArea({
      shape: 'CIRCLE',
      area: nextArea,
      center: circleCenter,
      radiusM: nextRadius,
    })
  }

  function insertVertex(position: GeoPosition) {
    const ring = form.coverageArea?.coordinates[0]
    if (!ring || !isValidCoverageArea(form.coverageArea)) return
    const vertices = ring.slice(0, -1)
    const meanLat =
      vertices.reduce((sum, point) => sum + point[1], 0) / vertices.length
    const project = ([lng, lat]: GeoPosition): GeoPosition => [
      lng * Math.cos((meanLat * Math.PI) / 180),
      lat,
    ]
    const point = project(position)
    let insertAfter = 0
    let shortestDistance = Number.POSITIVE_INFINITY
    for (let index = 0; index < vertices.length; index += 1) {
      const first = project(vertices[index])
      const second = project(vertices[(index + 1) % vertices.length])
      const dx = second[0] - first[0]
      const dy = second[1] - first[1]
      const lengthSquared = dx * dx + dy * dy || 1
      const fraction = Math.max(
        0,
        Math.min(
          1,
          ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) /
            lengthSquared,
        ),
      )
      const distance = Math.hypot(
        point[0] - (first[0] + fraction * dx),
        point[1] - (first[1] + fraction * dy),
      )
      if (distance < shortestDistance) {
        shortestDistance = distance
        insertAfter = index
      }
    }
    const nextVertices = [...vertices]
    nextVertices.splice(insertAfter + 1, 0, position)
    commitArea({
      ...snapshot(),
      area: { type: 'Polygon', coordinates: [closeCoverageRing(nextVertices)] },
    })
    setAddVertexMode(false)
  }

  function removeSelectedVertex() {
    if (
      selectedVertex == null ||
      !isPolygonShape(form.coverageAreaShape) ||
      !form.coverageArea
    ) {
      return
    }
    const vertices = form.coverageArea.coordinates[0].slice(0, -1)
    const nextVertices = vertices.filter((_, index) => index !== selectedVertex)
    commitArea({
      ...snapshot(),
      area:
        nextVertices.length >= 3
          ? { type: 'Polygon', coordinates: [closeCoverageRing(nextVertices)] }
          : null,
    })
  }

  function moveSelectedPoint(direction: 'north' | 'east' | 'south' | 'west') {
    if (selectedVertex == null || !form.coverageArea) return
    const ring = form.coverageArea.coordinates[0]
    const vertices = ring.slice(0, -1)
    const point =
      form.coverageAreaShape === 'CIRCLE'
        ? circleCenter
        : vertices[selectedVertex]
    if (!point) return
    const latitudeStep = 10 / 111_320
    const longitudeStep =
      10 / (111_320 * Math.max(0.01, Math.cos((point[1] * Math.PI) / 180)))
    const [deltaLongitude, deltaLatitude] =
      direction === 'north'
        ? [0, latitudeStep]
        : direction === 'south'
          ? [0, -latitudeStep]
          : direction === 'east'
            ? [longitudeStep, 0]
            : [-longitudeStep, 0]
    const moved: GeoPosition = [
      point[0] + deltaLongitude,
      point[1] + deltaLatitude,
    ]

    if (form.coverageAreaShape === 'CIRCLE') {
      commitArea({
        ...snapshot(),
        center: moved,
        area: circleCoverageArea(moved, form.radiusM),
      })
      return
    }
    if (form.coverageAreaShape === 'RECTANGLE') {
      const next = vertices.map((entry, index) =>
        index === selectedVertex ? moved : entry,
      )
      const west = Math.min(...next.map((entry) => entry[0]))
      const east = Math.max(...next.map((entry) => entry[0]))
      const south = Math.min(...next.map((entry) => entry[1]))
      const north = Math.max(...next.map((entry) => entry[1]))
      commitArea({
        ...snapshot(),
        area: rectangleCoverageArea([west, south], [east, north]),
      })
      return
    }

    const next = vertices.map((entry, index) =>
      index === selectedVertex ? moved : entry,
    )
    commitArea({
      ...snapshot(),
      area: { type: 'Polygon', coordinates: [closeCoverageRing(next)] },
    })
  }

  function clearLocation() {
    reverseLookupId.current += 1
    update('address', '')
    update('normalizedAddress', '')
    update('locationConfirmedAt', '')
    update('locationSource', '')
    update('locationStatus', 'unconfirmed')
    setAddressLookupError(null)
    setInteractionMode('location')
  }

  const shapeOptions: Array<{
    value: Exclude<CoverageAreaShape, ''>
    label: string
  }> = [
    { value: 'FREEHAND', label: t.freehand },
    { value: 'POLYGON', label: t.polygon },
    { value: 'RECTANGLE', label: t.rectangle },
    { value: 'CIRCLE', label: t.circle },
  ]
  // Keep the step's existing location validation visible in this compact panel.
  const displayedLocationError = errors.address

  return (
    <div className="co-area-workspace">
      <section className="co-area-map-column">
        <MonitoringAreaMap
          latitude={form.latitude}
          longitude={form.longitude}
          locationSelected={
            validCoordinates &&
            ((form.locationStatus === 'resolving' &&
              form.locationSource !== 'search') ||
              (form.locationStatus === 'confirmed' &&
                Boolean(form.locationConfirmedAt)))
          }
          areaShape={form.coverageAreaShape}
          area={form.coverageArea}
          circleCenter={circleCenter}
          radiusM={form.radiusM}
          interactionMode={interactionMode}
          addVertexMode={addVertexMode}
          selectedVertex={selectedVertex}
          label={t.mapLabel}
          streetLabel={t.street}
          satelliteLabel={t.satellite}
          tileErrorLabel={t.tileError}
          tileLoadingLabel={t.tileLoading}
          attributionLabel={t.attributionLabel}
          undoLabel={t.undo}
          redoLabel={t.redo}
          deleteAreaLabel={t.deleteArea}
          canUndo={history.current.undo.length > 0}
          canRedo={history.current.redo.length > 0}
          canDeleteArea={Boolean(form.coverageArea)}
          onPickLocation={(lat, lng) => {
            setInteractionMode('location')
            void reverseGeocode(lat, lng)
          }}
          onAreaChange={(area, nextCenter) =>
            commitArea({
              ...snapshot(),
              area,
              center:
                nextCenter === undefined ? form.coverageAreaCenter : nextCenter,
            })
          }
          onSelectVertex={(index) => setSelectedVertex(index)}
          onAddVertex={insertVertex}
          onUndo={undoArea}
          onRedo={redoArea}
          onDeleteArea={() =>
            commitArea({ ...snapshot(), area: null, center: null })
          }
        />
        <div className="co-area-map-tools">
          <span className={`co-area-mode is-${interactionMode}`} role="status">
            {interactionMode === 'location' ? t.mapModeLocation : t.mapModeArea}
          </span>
          <Button
            icon={<AimOutlined />}
            loading={locatingDevice}
            onClick={chooseDeviceLocation}
          >
            {t.locateDevice}
          </Button>
        </div>
      </section>

      <aside className="co-area-side-panel">
        <section
          className="co-area-card"
          aria-labelledby="co-area-location-title"
        >
          <header className="co-area-card-heading">
            <span className="co-area-step-number">1</span>
            <h2 id="co-area-location-title">{t.locationTitle}</h2>
          </header>
          <div className="co-area-search-row">
            <FormField
              id="co-address"
              label={t.addressLabel}
              required
              error={displayedLocationError}
            >
              <div className="co-area-search-control">
                <input
                  id="co-address"
                  className="co-input"
                  type="search"
                  autoComplete="off"
                  value={form.address}
                  aria-required="true"
                  aria-invalid={Boolean(displayedLocationError)}
                  aria-describedby={
                    displayedLocationError ? 'co-address-error' : undefined
                  }
                  onChange={(event) => {
                    update('address', event.target.value)
                    update('normalizedAddress', '')
                    update('locationConfirmedAt', '')
                    update(
                      'locationStatus',
                      event.target.value.trim() ? 'stale' : 'unconfirmed',
                    )
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void locateAddress()
                    }
                  }}
                  placeholder={t.locationPlaceholder}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={locatingAddress}
                  disabled={!form.address.trim() || locatingAddress}
                  aria-label={t.search}
                  onClick={() => void locateAddress()}
                >
                  {t.search}
                </Button>
              </div>
            </FormField>
          </div>
          {addressLookupError && (
            <p className="co-area-inline-status is-info" role="status">
              {addressLookupError}
            </p>
          )}
          <div className="co-area-selected-location">
            <EnvironmentOutlined aria-hidden="true" />
            <div>
              <strong>
                {locationSelected ? t.selectedLocation : t.locationEmpty}
              </strong>
              <span>
                {selectedLocationLabel ||
                  (form.locationStatus === 'resolving'
                    ? t.resolving
                    : t.locationNeedsConfirm)}
              </span>
            </div>
            {locationSelected && (
              <button
                type="button"
                className="co-area-icon-button"
                aria-label={t.locationEmpty}
                title={t.locationEmpty}
                onClick={clearLocation}
              >
                ×
              </button>
            )}
          </div>
          <div className="co-area-location-actions">
            <Button
              type={interactionMode === 'location' ? 'primary' : 'default'}
              icon={<AimOutlined />}
              onClick={() => {
                setInteractionMode('location')
                setAddVertexMode(false)
              }}
            >
              {t.changeLocation}
            </Button>
            <details
              className="co-area-coordinates"
              open={Boolean(errors.latitude || errors.longitude)}
            >
              <summary>{t.advancedCoordinates}</summary>
              <div className="co-area-coordinate-fields">
                <FormField
                  id="co-lat"
                  label={t.latitudeLabel}
                  error={errors.latitude}
                >
                  <input
                    id="co-lat"
                    className="co-input"
                    type="number"
                    min={-90}
                    max={90}
                    step="any"
                    inputMode="decimal"
                    value={form.latitude}
                    aria-invalid={Boolean(errors.latitude)}
                    aria-describedby={
                      errors.latitude ? 'co-lat-error' : undefined
                    }
                    onChange={(event) => {
                      update('latitude', event.target.value)
                      update('locationConfirmedAt', '')
                      update('locationStatus', 'stale')
                    }}
                  />
                </FormField>
                <FormField
                  id="co-lng"
                  label={t.longitudeLabel}
                  error={errors.longitude}
                >
                  <input
                    id="co-lng"
                    className="co-input"
                    type="number"
                    min={-180}
                    max={180}
                    step="any"
                    inputMode="decimal"
                    value={form.longitude}
                    aria-invalid={Boolean(errors.longitude)}
                    aria-describedby={
                      errors.longitude ? 'co-lng-error' : undefined
                    }
                    onChange={(event) => {
                      update('longitude', event.target.value)
                      update('locationConfirmedAt', '')
                      update('locationStatus', 'stale')
                    }}
                  />
                </FormField>
                <Button
                  disabled={!validCoordinates}
                  onClick={confirmManualCoordinates}
                >
                  {t.confirmCoordinates}
                </Button>
              </div>
            </details>
          </div>
        </section>

        <section
          className="co-area-card"
          aria-labelledby="co-area-region-title"
        >
          <header className="co-area-card-heading">
            <span className="co-area-step-number">2</span>
            <h2 id="co-area-region-title">{t.areaTitle}</h2>
          </header>
          <div
            className="co-area-shape-options"
            role="group"
            aria-label={t.areaTitle}
          >
            {shapeOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                disabled={!locationSelected}
                aria-pressed={form.coverageAreaShape === option.value}
                className={`co-area-shape-option${form.coverageAreaShape === option.value ? ' is-active' : ''}`}
                onClick={() => selectShape(option.value)}
              >
                <span
                  className={`co-area-shape-icon is-${option.value.toLowerCase()}`}
                  aria-hidden="true"
                />
                {option.label}
              </button>
            ))}
          </div>
          {locationSelected && (
            <p className="co-area-shape-hint">{t.areaSuggestionHint}</p>
          )}

          {!locationSelected ? (
            <p className="co-area-empty-state">{t.areaWaitingLocation}</p>
          ) : !form.coverageAreaShape ? (
            <p className="co-area-empty-state">{t.areaEmpty}</p>
          ) : (
            <>
              {form.coverageAreaShape === 'CIRCLE' && (
                <div className="co-area-radius-control">
                  <label htmlFor="co-radius-range">
                    <span>{t.circleRadius}</span>
                    <strong>{form.radiusM.toLocaleString()} m</strong>
                  </label>
                  <input
                    id="co-radius-range"
                    type="range"
                    min={100}
                    max={1500}
                    step={50}
                    value={form.radiusM}
                    disabled={!circleCenter}
                    aria-valuetext={`${form.radiusM} m`}
                    onChange={(event) =>
                      changeRadius(Number(event.target.value))
                    }
                  />
                  <div>
                    <span>100 m</span>
                    <span>1,500 m</span>
                  </div>
                  {!circleCenter && (
                    <p className="co-area-empty-state">{t.circleCenterHint}</p>
                  )}
                </div>
              )}
              {isPolygonShape(form.coverageAreaShape) && (
                <p className="co-area-shape-hint">
                  {areaValid
                    ? t.vertexHint
                    : hasClosedArea
                      ? t.areaError
                      : t.drawHint}
                </p>
              )}
              {form.coverageAreaShape === 'RECTANGLE' && (
                <p
                  className={`co-area-shape-hint${hasClosedArea && !areaValid ? ' is-error' : ''}`}
                >
                  {hasClosedArea && !areaValid ? t.areaError : t.rectangleHint}
                </p>
              )}

              {metrics && (
                <dl
                  className={`co-area-metric-grid${isPolygonShape(form.coverageAreaShape) ? ' has-vertices' : ''}`}
                >
                  <div>
                    <dt>{t.area}</dt>
                    <dd>{formatAreaM2(metrics.areaM2)}</dd>
                  </div>
                  <div>
                    <dt>{t.perimeter}</dt>
                    <dd>{formatLengthM(metrics.perimeterM)}</dd>
                  </div>
                  {isPolygonShape(form.coverageAreaShape) && (
                    <div>
                      <dt>{t.vertices}</dt>
                      <dd>{metrics.vertexCount}</dd>
                    </div>
                  )}
                </dl>
              )}
              <div className="co-area-edit-actions">
                {isPolygonShape(form.coverageAreaShape) && areaValid && (
                  <Button
                    icon={<EnvironmentOutlined />}
                    type={addVertexMode ? 'primary' : 'default'}
                    aria-pressed={addVertexMode}
                    onClick={() => {
                      setInteractionMode('area')
                      setAddVertexMode((active) => !active)
                    }}
                  >
                    {t.addVertex}
                  </Button>
                )}
                {isPolygonShape(form.coverageAreaShape) &&
                  selectedVertex != null && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={removeSelectedVertex}
                    >
                      {t.removeVertex}
                    </Button>
                  )}
                {selectedVertex != null && form.coverageArea && (
                  <div
                    className="co-area-nudge-actions"
                    role="group"
                    aria-label={t.moveSelectedPoint}
                  >
                    <span>{t.moveSelectedPoint}</span>
                    <Button
                      icon={<ArrowUpOutlined />}
                      aria-label={`${t.moveSelectedPoint}: ${t.north}`}
                      title={t.north}
                      onClick={() => moveSelectedPoint('north')}
                    />
                    <Button
                      icon={<ArrowRightOutlined />}
                      aria-label={`${t.moveSelectedPoint}: ${t.east}`}
                      title={t.east}
                      onClick={() => moveSelectedPoint('east')}
                    />
                    <Button
                      icon={<ArrowDownOutlined />}
                      aria-label={`${t.moveSelectedPoint}: ${t.south}`}
                      title={t.south}
                      onClick={() => moveSelectedPoint('south')}
                    />
                    <Button
                      icon={<ArrowLeftOutlined />}
                      aria-label={`${t.moveSelectedPoint}: ${t.west}`}
                      title={t.west}
                      onClick={() => moveSelectedPoint('west')}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          {locationOutsideArea && (
            <p className="co-area-inline-status is-error" role="alert">{t.locationOutsideArea}</p>
          )}
          {errors.coverageArea && !locationOutsideArea && (
            <p className="co-area-inline-status is-error" role="alert">
              {errors.coverageArea === 'INVALID_COVERAGE_AREA'
                ? t.areaError
                : errors.coverageArea}
            </p>
          )}
        </section>
      </aside>
    </div>
  )
}

type AreaSnapshot = {
  shape: CoverageAreaShape
  area: CoverageAreaGeometry | null
  center: GeoPosition | null
  radiusM: number
}
