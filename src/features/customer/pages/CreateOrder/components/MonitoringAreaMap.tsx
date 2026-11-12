import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { DeleteOutlined, RedoOutlined, UndoOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  HCMC_SERVICE_CENTER,
  hcmcServicePolygonLatLngs,
} from '../../../../../shared/lib/serviceArea'
import type {
  CoverageAreaGeometry,
  CoverageAreaShape,
  GeoPosition,
} from '../../../lib/createOrder/types'
import {
  closeCoverageRing,
  circleCoverageArea,
  rectangleCoverageArea,
} from '../../../lib/createOrder/coverageGeometry'

export type MapInteractionMode = 'location' | 'area'

function isPolygonShape(shape: CoverageAreaShape) {
  return shape === 'POLYGON' || shape === 'FREEHAND'
}

type Props = {
  latitude: string
  longitude: string
  locationSelected: boolean
  areaShape: CoverageAreaShape
  area: CoverageAreaGeometry | null
  circleCenter: GeoPosition | null
  radiusM: number
  interactionMode: MapInteractionMode
  addVertexMode: boolean
  selectedVertex: number | null
  label: string
  streetLabel: string
  satelliteLabel: string
  tileErrorLabel: string
  tileLoadingLabel: string
  attributionLabel: string
  undoLabel: string
  redoLabel: string
  deleteAreaLabel: string
  canUndo: boolean
  canRedo: boolean
  canDeleteArea: boolean
  onPickLocation: (latitude: number, longitude: number) => void
  onAreaChange: (
    area: CoverageAreaGeometry | null,
    circleCenter?: GeoPosition | null,
  ) => void
  onSelectVertex: (index: number | null) => void
  onAddVertex: (position: GeoPosition) => void
  onUndo: () => void
  onRedo: () => void
  onDeleteArea: () => void
}

const polygonStyle: L.PathOptions = {
  color: '#1262ed',
  weight: 3,
  opacity: 0.96,
  fillColor: '#1976ff',
  fillOpacity: 0.2,
}
const handleIcon = (selected: boolean) =>
  L.divIcon({
    className: `co-area-handle${selected ? ' is-selected' : ''}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
const circleCenterIcon = L.divIcon({
  className: 'co-area-center-handle',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function isClosed(positions: GeoPosition[]) {
  const first = positions[0]
  const last = positions.at(-1)
  return Boolean(
    positions.length >= 4 &&
    first &&
    last &&
    Math.abs(first[0] - last[0]) < 1e-8 &&
    Math.abs(first[1] - last[1]) < 1e-8,
  )
}

function uniqueVertices(area: CoverageAreaGeometry | null) {
  const positions = area?.coordinates[0] ?? []
  return isClosed(positions) ? positions.slice(0, -1) : positions
}

function toLatLngs(positions: GeoPosition[]): L.LatLngExpression[] {
  return positions.map(([longitude, latitude]) => [latitude, longitude])
}

function cleanPolygon(positions: GeoPosition[]): CoverageAreaGeometry {
  const ring = [...positions]
  const first = ring[0]
  const last = ring.at(-1)
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]])
  }
  return { type: 'Polygon', coordinates: [ring] }
}

function selectedCenter(area: CoverageAreaGeometry | null): GeoPosition | null {
  const points = uniqueVertices(area)
  if (!points.length) return null
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ]
}

function stopMapEvent(event: L.LeafletMouseEvent) {
  L.DomEvent.stopPropagation(event.originalEvent)
}

export function MonitoringAreaMap(props: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const overlayGroup = useRef<L.LayerGroup | null>(null)
  const rectangleStart = useRef<GeoPosition | null>(null)
  const rectanglePointerId = useRef<number | null>(null)
  const rectanglePreview = useRef<L.Rectangle | null>(null)
  const rectangleResizeTimers = useRef<number[]>([])
  const baseLayers = useRef<{ street: L.Layer; satellite: L.Layer } | null>(
    null,
  )
  const layersControl = useRef<L.Control.Layers | null>(null)
  const hasCenteredOnSelection = useRef(false)
  const propsRef = useRef(props)
  const loadedTileCount = useRef(0)
  const [mapReady, setMapReady] = useState(false)
  const [tilesLoaded, setTilesLoaded] = useState(false)
  const [tilesFailed, setTilesFailed] = useState(false)
  const [attributionOpen, setAttributionOpen] = useState(true)
  propsRef.current = props

  function pickMapPoint(latlng: L.LatLng) {
    const current = propsRef.current
    if (current.interactionMode === 'location') {
      current.onPickLocation(latlng.lat, latlng.lng)
      return
    }

    if (current.areaShape === 'CIRCLE') {
      const center: GeoPosition = [latlng.lng, latlng.lat]
      current.onAreaChange(circleCoverageArea(center, current.radiusM), center)
      return
    }

    if (!isPolygonShape(current.areaShape)) return
    const position: GeoPosition = [latlng.lng, latlng.lat]
    if (current.addVertexMode && current.area) {
      current.onAddVertex(position)
      return
    }

    const vertices = uniqueVertices(current.area)
    if (isClosed(current.area?.coordinates[0] ?? [])) return
    if (vertices.length >= 3 && map.current) {
      const first = map.current.latLngToContainerPoint([
        vertices[0][1],
        vertices[0][0],
      ])
      const clicked = map.current.latLngToContainerPoint(latlng)
      if (first.distanceTo(clicked) <= 36) {
        current.onAreaChange(cleanPolygon(vertices))
        return
      }
    }
    current.onAreaChange({
      type: 'Polygon',
      coordinates: [[...vertices, position]],
    })
  }

  function handleMapClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (
      (event.target as HTMLElement).closest(
        '.leaflet-control, .leaflet-marker-icon, .co-area-map-edit-tools, .co-area-map-attribution-toggle',
      )
    ) {
      return
    }
    const instance = map.current
    if (!instance) return
    const mapElement = container.current
    if (!mapElement) return
    const bounds = mapElement.getBoundingClientRect()
    const latlng = instance.containerPointToLatLng(
      L.point(event.clientX - bounds.left, event.clientY - bounds.top),
    )
    pickMapPoint(latlng)
  }

  useEffect(() => {
    if (!attributionOpen) return
    const timeout = window.setTimeout(() => setAttributionOpen(false), 5000)
    return () => window.clearTimeout(timeout)
  }, [attributionOpen])

  useLayoutEffect(() => {
    if (!container.current) return

    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: false,
      doubleClickZoom: false,
      layers: [],
    }).setView(
      [HCMC_SERVICE_CENTER.latitude, HCMC_SERVICE_CENTER.longitude],
      12,
    )
    L.control.attribution({ prefix: false }).addTo(instance)

    const markTileLoaded = () => {
      loadedTileCount.current += 1
      setTilesLoaded(true)
      setTilesFailed(false)
    }
    const markTileFailed = () => {
      if (loadedTileCount.current === 0) setTilesFailed(true)
    }
    const streetFallback = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', markTileFailed)
    const street = L.layerGroup([
      streetFallback,
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
        crossOrigin: true,
      })
        .on('tileload', markTileLoaded)
        .on('tileerror', markTileFailed),
    ])
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution:
          'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', markTileFailed)

    street.addTo(instance)
    baseLayers.current = { street, satellite }
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(instance)
    L.polygon(hcmcServicePolygonLatLngs(), {
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.035,
      weight: 1.5,
      interactive: false,
    }).addTo(instance)

    const overlays = L.layerGroup().addTo(instance)
    overlayGroup.current = overlays

    const onPointerDown = (event: PointerEvent) => {
      const current = propsRef.current
      if (
        current.interactionMode !== 'area' ||
        current.areaShape !== 'RECTANGLE' ||
        event.shiftKey ||
        event.button !== 0 ||
        rectangleStart.current ||
        (event.target as HTMLElement | null)?.closest('.leaflet-marker-icon')
      ) {
        return
      }
      const start = instance.mouseEventToLatLng(event)
      rectanglePointerId.current = event.pointerId
      rectangleStart.current = [start.lng, start.lat]
      rectanglePreview.current?.remove()
      rectanglePreview.current = L.rectangle(
        [
          [start.lat, start.lng],
          [start.lat, start.lng],
        ],
        { ...polygonStyle, fillOpacity: 0.1, dashArray: '6 5' },
      ).addTo(instance)
      if (instance.dragging.enabled()) instance.dragging.disable()
      container.current?.setPointerCapture(event.pointerId)
      event.preventDefault()
    }
    const onPointerMove = (event: PointerEvent) => {
      if (
        !rectangleStart.current ||
        !rectanglePreview.current ||
        rectanglePointerId.current !== event.pointerId
      )
        return
      const end = instance.mouseEventToLatLng(event)
      rectanglePreview.current.setBounds(
        L.latLngBounds(
          [rectangleStart.current[1], rectangleStart.current[0]],
          end,
        ),
      )
    }
    const onPointerUp = (event: PointerEvent) => {
      const start = rectangleStart.current
      if (!start || rectanglePointerId.current !== event.pointerId) return
      rectangleStart.current = null
      rectanglePointerId.current = null
      rectanglePreview.current?.remove()
      rectanglePreview.current = null
      if (!instance.dragging.enabled()) instance.dragging.enable()
      const endLatLng = instance.mouseEventToLatLng(event)
      const end: GeoPosition = [endLatLng.lng, endLatLng.lat]
      const next = rectangleCoverageArea(start, end)
      const points = next.coordinates[0]
      if (
        propsRef.current.interactionMode === 'area' &&
        propsRef.current.areaShape === 'RECTANGLE' &&
        points.length >= 5 &&
        Math.abs(start[0] - end[0]) + Math.abs(start[1] - end[1]) > 1e-7
      ) {
        propsRef.current.onAreaChange(next)
      }
    }
    const onPointerCancel = () => {
      rectangleStart.current = null
      rectanglePointerId.current = null
      rectanglePreview.current?.remove()
      rectanglePreview.current = null
      if (!instance.dragging.enabled()) instance.dragging.enable()
    }

    container.current.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    instance.on('baselayerchange', () => {
      loadedTileCount.current = 0
      setTilesLoaded(false)
      setTilesFailed(false)
    })
    map.current = instance
    setMapReady(true)

    const refreshMapSize = () => {
      if (!container.current || container.current.clientWidth === 0) return
      instance.invalidateSize({ animate: false, pan: false })
    }
    rectangleResizeTimers.current = [0, 100, 350, 800].map((delay) =>
      window.setTimeout(refreshMapSize, delay),
    )
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => window.requestAnimationFrame(refreshMapSize))
    resizeObserver?.observe(container.current)
    window.addEventListener('resize', refreshMapSize)

    return () => {
      rectangleResizeTimers.current.forEach((timer) =>
        window.clearTimeout(timer),
      )
      resizeObserver?.disconnect()
      window.removeEventListener('resize', refreshMapSize)
      container.current?.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      rectanglePreview.current?.remove()
      instance.remove()
      overlayGroup.current = null
      map.current = null
      setMapReady(false)
      baseLayers.current = null
      layersControl.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !map.current || !baseLayers.current) return
    layersControl.current?.remove()
    layersControl.current = L.control
      .layers(
        {
          [props.streetLabel]: baseLayers.current.street,
          [props.satelliteLabel]: baseLayers.current.satellite,
        },
        undefined,
        { position: 'topright', collapsed: false },
      )
      .addTo(map.current)
  }, [mapReady, props.streetLabel, props.satelliteLabel])

  useEffect(() => {
    if (!mapReady || !map.current) return
    const instance = map.current
    if (!instance.dragging.enabled()) {
      instance.dragging.enable()
    }
  }, [mapReady, props.interactionMode, props.areaShape])

  useEffect(() => {
    if (!mapReady || !map.current || !overlayGroup.current) return
    const overlays = overlayGroup.current
    overlays.clearLayers()
    const instance = map.current
    const lat = Number(props.latitude)
    const lng = Number(props.longitude)
    const validLocation =
      props.locationSelected &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180

    if (validLocation) {
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'co-area-location-marker',
          iconSize: [30, 38],
          iconAnchor: [15, 38],
        }),
        keyboard: true,
        title: 'Selected monitoring location',
      }).addTo(overlays)
    }

    const ring = props.area?.coordinates[0] ?? []
    const closed = isClosed(ring)
    const vertices = uniqueVertices(props.area)
    if (ring.length >= 2) {
      if (closed && vertices.length >= 3) {
        L.polygon(toLatLngs(ring), polygonStyle).addTo(overlays)
      } else {
        L.polyline(toLatLngs(ring), { ...polygonStyle, fill: false }).addTo(
          overlays,
        )
      }
    }

    if (props.interactionMode === 'area' && isPolygonShape(props.areaShape)) {
      vertices.forEach(([longitude, latitude], index) => {
        const handle = L.marker([latitude, longitude], {
          icon: handleIcon(props.selectedVertex === index),
          draggable: closed,
          keyboard: true,
          title: `Vertex ${index + 1}`,
          zIndexOffset: 900,
        }).addTo(overlays)
        handle.on('click', (event) => {
          stopMapEvent(event)
          if (!closed && index === 0 && vertices.length >= 3) {
            propsRef.current.onAreaChange({
              type: 'Polygon',
              coordinates: [closeCoverageRing(vertices)],
            })
            return
          }
          propsRef.current.onSelectVertex(index)
        })
        if (closed) {
          handle.on('dragend', () => {
            const point = handle.getLatLng()
            const updated = vertices.map((entry, pointIndex) =>
              pointIndex === index
                ? ([point.lng, point.lat] as GeoPosition)
                : entry,
            )
            propsRef.current.onAreaChange(cleanPolygon(updated))
          })
        }
      })
    }

    if (
      props.interactionMode === 'area' &&
      props.areaShape === 'RECTANGLE' &&
      closed
    ) {
      const center = L.polygon(toLatLngs(ring)).getBounds().getCenter()
      const centerHandle = L.marker(center, {
        icon: circleCenterIcon,
        draggable: true,
        title: 'Move rectangle',
        zIndexOffset: 1000,
      }).addTo(overlays)
      centerHandle.on('click', stopMapEvent)
      centerHandle.on('dragend', () => {
        const moved = centerHandle.getLatLng()
        const dx = moved.lng - center.lng
        const dy = moved.lat - center.lat
        propsRef.current.onAreaChange(
          cleanPolygon(vertices.map(([x, y]) => [x + dx, y + dy])),
        )
      })
      vertices.forEach(([longitude, latitude], index) => {
        const handle = L.marker([latitude, longitude], {
          icon: handleIcon(props.selectedVertex === index),
          draggable: true,
          title: `Resize rectangle corner ${index + 1}`,
          zIndexOffset: 900,
        }).addTo(overlays)
        handle.on('click', stopMapEvent)
        handle.on('click', () => propsRef.current.onSelectVertex(index))
        handle.on('dragend', () => {
          const point = handle.getLatLng()
          const next = vertices.map((entry, pointIndex) =>
            pointIndex === index
              ? ([point.lng, point.lat] as GeoPosition)
              : entry,
          )
          const west = Math.min(...next.map((entry) => entry[0]))
          const east = Math.max(...next.map((entry) => entry[0]))
          const south = Math.min(...next.map((entry) => entry[1]))
          const north = Math.max(...next.map((entry) => entry[1]))
          propsRef.current.onAreaChange(
            rectangleCoverageArea([west, south], [east, north]),
          )
        })
      })
    }

    if (props.interactionMode === 'area' && props.areaShape === 'CIRCLE') {
      const center = props.circleCenter ?? selectedCenter(props.area)
      if (center) {
        const centerHandle = L.marker([center[1], center[0]], {
          icon: circleCenterIcon,
          draggable: true,
          title: 'Move circle center',
          zIndexOffset: 1000,
        }).addTo(overlays)
        centerHandle.on('click', (event) => {
          stopMapEvent(event)
          propsRef.current.onSelectVertex(0)
        })
        centerHandle.on('dragend', () => {
          const moved = centerHandle.getLatLng()
          const nextCenter: GeoPosition = [moved.lng, moved.lat]
          propsRef.current.onAreaChange(
            circleCoverageArea(nextCenter, propsRef.current.radiusM),
            nextCenter,
          )
        })
      }
    }

    // Keep the selected site in view after geocoding without changing the area geometry.
    if (validLocation && !hasCenteredOnSelection.current) {
      if (props.area && closed && ring.length >= 5) {
        const bounds = L.latLngBounds(toLatLngs(ring))
        if (bounds.isValid()) instance.fitBounds(bounds, { padding: [48, 48] })
        else instance.setView([lat, lng], 15)
      } else {
        instance.setView([lat, lng], 15)
      }
      hasCenteredOnSelection.current = true
    }
  }, [
    mapReady,
    props.latitude,
    props.longitude,
    props.locationSelected,
    props.areaShape,
    props.area,
    props.circleCenter,
    props.radiusM,
    props.interactionMode,
    props.selectedVertex,
  ])

  return (
    <div className="co-area-map-shell" onClickCapture={handleMapClick}>
      <div
        ref={container}
        className={[
          'co-area-map',
          props.interactionMode === 'area' ? 'is-drawing' : '',
          props.interactionMode === 'area' && props.areaShape === 'RECTANGLE'
            ? 'is-rectangle-drawing'
            : '',
          tilesFailed ? 'has-tile-error' : '',
          attributionOpen ? 'has-attribution-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="region"
        aria-label={props.label}
      />
      <button
        type="button"
        className="co-area-map-attribution-toggle"
        aria-label={props.attributionLabel}
        aria-expanded={attributionOpen}
        title={props.attributionLabel}
        onClick={() => setAttributionOpen((open) => !open)}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>
      {props.interactionMode === 'area' && (
        <div
          className="co-area-map-edit-tools"
          role="group"
          aria-label={props.label}
        >
          <Button
            icon={<UndoOutlined />}
            aria-label={props.undoLabel}
            title={props.undoLabel}
            disabled={!props.canUndo}
            onClick={props.onUndo}
          />
          <Button
            icon={<RedoOutlined />}
            aria-label={props.redoLabel}
            title={props.redoLabel}
            disabled={!props.canRedo}
            onClick={props.onRedo}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            aria-label={props.deleteAreaLabel}
            title={props.deleteAreaLabel}
            disabled={!props.canDeleteArea}
            onClick={props.onDeleteArea}
          />
        </div>
      )}
      {tilesFailed && (
        <div className="co-area-map-error" role="status">
          {props.tileErrorLabel}
        </div>
      )}
      {mapReady && !tilesLoaded && !tilesFailed && (
        <div className="co-area-map-loading" role="status">
          {props.tileLoadingLabel}
        </div>
      )}
    </div>
  )
}
