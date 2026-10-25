import {
  SATELLITE_MAX_NATIVE_ZOOM,
  SATELLITE_TILE_URL,
} from './satelliteSource'
import { cameraZoomForAltitude } from './components/CameraSatelliteMap'

const TILE = 256
const OUT_W = 1280
const OUT_H = 720

export type SnapshotInput = {
  latitude: number
  longitude: number
  heading?: number | null
  altitudeM?: number | null
  caption?: string
}

function project(lat: number, lon: number, zoom: number) {
  const scale = TILE * 2 ** zoom
  const sin = Math.sin(
    (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180,
  )
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  }
}

function loadTile(
  zoom: number,
  x: number,
  y: number,
): Promise<HTMLImageElement | null> {
  const max = 2 ** zoom
  if (y < 0 || y >= max) return Promise.resolve(null)
  const wrappedX = ((x % max) + max) % max
  const url = SATELLITE_TILE_URL.replace('{z}', String(zoom))
    .replace('{y}', String(y))
    .replace('{x}', String(wrappedX))
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * Renders what the cockpit "camera" shows (satellite imagery centred on the drone, heading up)
 * into a JPEG, so "Take photo" saves the same picture the operator is looking at.
 */
export async function captureSatelliteSnapshot(
  input: SnapshotInput,
): Promise<Blob> {
  const viewZoom = cameraZoomForAltitude(input.altitudeM)
  const tileZoom = Math.min(Math.round(viewZoom), SATELLITE_MAX_NATIVE_ZOOM)
  const scale = 2 ** (viewZoom - tileZoom)
  const center = project(input.latitude, input.longitude, tileZoom)

  const canvas = document.createElement('canvas')
  canvas.width = OUT_W
  canvas.height = OUT_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.fillStyle = '#0b1220'
  ctx.fillRect(0, 0, OUT_W, OUT_H)

  // The view is rotated so the heading points up; cover the rotated rectangle's bounding circle.
  const radius = Math.hypot(OUT_W, OUT_H) / 2 / scale
  const minX = Math.floor((center.x - radius) / TILE)
  const maxX = Math.floor((center.x + radius) / TILE)
  const minY = Math.floor((center.y - radius) / TILE)
  const maxY = Math.floor((center.y + radius) / TILE)
  if ((maxX - minX + 1) * (maxY - minY + 1) > 64)
    throw new Error('Snapshot area too large')

  const jobs: Array<
    Promise<{ img: HTMLImageElement | null; x: number; y: number }>
  > = []
  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      jobs.push(
        loadTile(tileZoom, tx, ty).then((img) => ({ img, x: tx, y: ty })),
      )
    }
  }
  const tiles = await Promise.all(jobs)
  if (!tiles.some((tile) => tile.img))
    throw new Error('Satellite tiles unavailable')

  const heading =
    typeof input.heading === 'number' && Number.isFinite(input.heading)
      ? input.heading
      : 0
  ctx.save()
  ctx.translate(OUT_W / 2, OUT_H / 2)
  ctx.rotate((-heading * Math.PI) / 180)
  ctx.scale(scale, scale)
  for (const tile of tiles) {
    if (tile.img)
      ctx.drawImage(
        tile.img,
        tile.x * TILE - center.x,
        tile.y * TILE - center.y,
        TILE + 0.5,
        TILE + 0.5,
      )
  }
  ctx.restore()

  if (input.caption) {
    ctx.font = '600 20px ui-monospace, Menlo, Consolas, monospace'
    const pad = 10
    const width = ctx.measureText(input.caption).width + pad * 2
    ctx.fillStyle = 'rgba(5, 11, 22, 0.72)'
    ctx.fillRect(12, OUT_H - 44, width, 32)
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(input.caption, 12 + pad, OUT_H - 22)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not encode JPEG')),
      'image/jpeg',
      0.92,
    )
  })
}
