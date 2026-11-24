import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../../shared/types/domain'
import type { AvailableDrone } from '../../../../staff/api/droneApi'
import { CORE_DRONE_PADS, getDroneRoomExtent, getExpansionPadPosition } from './droneRoomLayout'
import { DroneSceneToolbar } from './DroneSceneToolbar'
import './droneRoom.scss'

type Props = {
  drones: AvailableDrone[]
  selectedDroneId: string | null
  onSelect: (droneId: string) => void
  label: string
  fallbackMessage: string
  loadingMessage: string
  lang?: string
  /** Incrementing token from the parent list to smoothly focus the camera on the selected drone. */
  focusRequestId?: number
  /** Compact status badge displayed in the top-left corner of the viewport. */
  bayCountLabel?: string
  fleetSummaryLabel?: string
}

type DroneModel = {
  root: THREE.Group
  materials: THREE.Material[]
  statusRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  baseY: number
}

type CameraGoal = {
  position: THREE.Vector3
  target: THREE.Vector3
  zoom: number
}

type HoverTooltipState = {
  droneId: string
  label: string
  status: string
  x: number
  y: number
} | null

type SceneRuntime = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  controls: OrbitControls
  template: THREE.Object3D
  pads: Map<number, THREE.Object3D>
  expansionPads: Map<number, THREE.Object3D>
  labels: Map<number, THREE.Sprite>
  models: Map<string, DroneModel>
  selectedRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
  selectedPulseRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  hoverRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
  expansionFloor: THREE.Group | null
  layoutCount: number
  viewExtent: number
  cameraGoal: CameraGoal | null
  render: () => void
  syncDrones: () => void
  focusDrone: (droneId: string | null, immediate?: boolean) => void
  fitAll: (immediate?: boolean) => void
  resetCamera: (immediate?: boolean) => void
  zoomBy: (factor: number) => void
  detach: () => void
}

const ROOM_ASSET = `${import.meta.env.BASE_URL}models/drone-assignment/drone-assignment-room.glb`
const DEFAULT_CAMERA_POS = new THREE.Vector3(5.6, 13.5, 15.2)
const DEFAULT_TARGET = new THREE.Vector3(0, 0.85, 0.4)
const MIN_ZOOM = 0.58
const MAX_ZOOM = 3.2

function statusColorHex(status?: string | null): number {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (normalized === 'AVAILABLE' || normalized === 'READY') return 0x10b981
  if (
    normalized === 'MAINTENANCE' ||
    normalized === 'CHARGING' ||
    normalized === 'PREFLIGHT'
  )
    return 0xf59e0b
  if (
    normalized === 'OUT_OF_SERVICE' ||
    normalized === 'RETIRED' ||
    normalized === 'OFFLINE' ||
    normalized === 'FAULT'
  )
    return 0xef4444
  return 0x1565e8
}

function disposeObjectTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()

  root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.add(object.geometry)
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return
    const list = Array.isArray(object.material) ? object.material : [object.material]
    list.forEach((material) => {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value)
      })
    })
  })

  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
  textures.forEach((texture) => texture.dispose())
}

function cloneDrone(
  template: THREE.Object3D,
  droneId: string,
  status: string | null | undefined,
  pad: THREE.Object3D,
): DroneModel {
  const root = new THREE.Group()
  root.name = `drone-slot-${droneId}`
  root.userData.droneId = droneId
  root.scale.setScalar(0.84)

  const anchor = pad.getWorldPosition(new THREE.Vector3())
  const baseY = anchor.y + 0.08
  root.position.set(anchor.x, baseY, anchor.z)

  const visual = template.clone(true)
  visual.visible = true
  const clonedMaterials: THREE.Material[] = []
  visual.traverse((object) => {
    object.visible = true
    object.userData.droneId = droneId
    if (!(object instanceof THREE.Mesh)) return

    object.castShadow = true
    object.receiveShadow = true
    if (Array.isArray(object.material)) {
      object.material = object.material.map((material) => {
        const clone = material.clone()
        clonedMaterials.push(clone)
        return clone
      })
    } else {
      const clone = object.material.clone()
      clonedMaterials.push(clone)
      object.material = clone
    }
  })
  root.add(visual)

  // Subtle status ring anchored on the pad underneath each drone
  const statusRing = new THREE.Mesh(
    new THREE.RingGeometry(1.02, 1.18, 48),
    new THREE.MeshBasicMaterial({
      color: statusColorHex(status),
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  statusRing.rotation.x = -Math.PI / 2
  statusRing.position.set(0, 0.03, 0)
  statusRing.userData.droneId = droneId
  root.add(statusRing)

  return { root, materials: clonedMaterials, statusRing, baseY }
}

function createRenderer() {
  return new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  })
}

function clonePad(source: THREE.Object3D, position: { x: number; z: number }, slot: number) {
  source.updateWorldMatrix(true, false)
  const worldPosition = source.getWorldPosition(new THREE.Vector3())
  const worldQuaternion = source.getWorldQuaternion(new THREE.Quaternion())
  const worldScale = source.getWorldScale(new THREE.Vector3())
  const pad = source.clone(true)
  pad.name = `PAD_${String(slot).padStart(2, '0')}`
  pad.position.set(position.x, worldPosition.y, position.z)
  pad.quaternion.copy(worldQuaternion)
  pad.scale.copy(worldScale)
  pad.visible = true
  return pad
}

function createPadLabel(slot: number, position: THREE.Vector3, inward?: THREE.Vector2) {
  const canvas = document.createElement('canvas')
  canvas.width = 160
  canvas.height = 80
  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = 'rgba(15, 37, 68, 0.9)'
  context.strokeStyle = 'rgba(147, 197, 253, 0.85)'
  context.lineWidth = 4
  context.beginPath()
  context.roundRect(10, 10, 140, 60, 22)
  context.fill()
  context.stroke()
  context.fillStyle = '#ffffff'
  context.font = '700 34px Inter, Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(String(slot).padStart(2, '0'), 80, 41)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  })
  const label = new THREE.Sprite(material)
  label.name = `PAD_LABEL_${String(slot).padStart(2, '0')}`
  label.scale.set(0.62, 0.31, 1)
  label.position.copy(position)
  label.position.y += 0.42
  if (inward) {
    label.position.x += inward.x * 0.96
    label.position.z += inward.y * 0.96
  } else {
    label.position.z += 0.96
  }
  label.renderOrder = 3
  return label
}

function createExpansionFloor(radius: number) {
  const group = new THREE.Group()
  group.name = 'DRONE_ROOM_EXPANSION_FLOOR'
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(8.2, radius, 96),
    new THREE.MeshStandardMaterial({
      color: '#e2edf9',
      roughness: 0.88,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0.045
  floor.receiveShadow = true
  group.add(floor)

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 0.05, 0.035, 8, 96),
    new THREE.MeshBasicMaterial({ color: '#93c5fd', transparent: true, opacity: 0.72 }),
  )
  edge.rotation.x = Math.PI / 2
  edge.position.y = 0.07
  group.add(edge)
  return group
}

export function DroneRoomScene({
  drones,
  selectedDroneId,
  onSelect,
  label,
  fallbackMessage,
  loadingMessage,
  lang = 'vi',
  focusRequestId = 0,
  bayCountLabel,
  fleetSummaryLabel,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<SceneRuntime | null>(null)
  const dronesRef = useRef(drones)
  const selectedDroneIdRef = useRef(selectedDroneId)
  const onSelectRef = useRef(onSelect)
  const [sceneLoading, setSceneLoading] = useState(true)
  const [sceneError, setSceneError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hovered, setHovered] = useState<HoverTooltipState>(null)

  dronesRef.current = drones
  selectedDroneIdRef.current = selectedDroneId
  onSelectRef.current = onSelect

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement && document.fullscreenElement === wrapRef.current))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let runtime: SceneRuntime | null = null
    let resizeObserver: ResizeObserver | null = null
    let pointerOrigin: { x: number; y: number } | null = null
    let rafId = 0
    let lastClickAt = 0
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    try {
      const renderer = createRenderer()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.06
      renderer.setClearColor('#edf4fc', 1)
      renderer.domElement.setAttribute('aria-hidden', 'true')
      renderer.domElement.className = 'mgr-office-drone-canvas'
      host.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#edf4fc')
      const camera = new THREE.OrthographicCamera(-7, 7, 6.3, -6.3, 0.1, 120)
      camera.position.copy(DEFAULT_CAMERA_POS)
      camera.lookAt(DEFAULT_TARGET)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.copy(DEFAULT_TARGET)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.enablePan = true
      controls.screenSpacePanning = true
      controls.minZoom = MIN_ZOOM
      controls.maxZoom = MAX_ZOOM
      controls.minPolarAngle = 0.25
      controls.maxPolarAngle = Math.PI / 2.25
      controls.rotateSpeed = 0.65
      controls.zoomSpeed = 0.85
      controls.panSpeed = 0.75
      controls.update()

      // Studio lighting: crisp hemisphere + soft shadow key + subtle cool rim light
      scene.add(new THREE.HemisphereLight('#ffffff', '#9db8d6', 1.7))
      const keyLight = new THREE.DirectionalLight('#ffffff', 2.05)
      keyLight.position.set(-7, 13, 9)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.set(1024, 1024)
      keyLight.shadow.camera.left = -11
      keyLight.shadow.camera.right = 11
      keyLight.shadow.camera.top = 11
      keyLight.shadow.camera.bottom = -11
      keyLight.shadow.bias = -0.00025
      scene.add(keyLight)

      const rimLight = new THREE.DirectionalLight('#bae6fd', 0.65)
      rimLight.position.set(10, 8, -8)
      scene.add(rimLight)

      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap

      const selectedRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.38, 0.055, 10, 64),
        new THREE.MeshBasicMaterial({
          color: '#1565e8',
          transparent: true,
          opacity: 0.96,
          depthWrite: false,
        }),
      )
      selectedRing.rotation.x = Math.PI / 2
      selectedRing.visible = false
      selectedRing.renderOrder = 3
      scene.add(selectedRing)

      const selectedPulseRing = new THREE.Mesh(
        new THREE.RingGeometry(1.42, 1.72, 64),
        new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      )
      selectedPulseRing.rotation.x = -Math.PI / 2
      selectedPulseRing.visible = false
      selectedPulseRing.renderOrder = 2
      scene.add(selectedPulseRing)

      const hoverRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.34, 0.036, 8, 64),
        new THREE.MeshBasicMaterial({
          color: '#0ea5e9',
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
        }),
      )
      hoverRing.rotation.x = Math.PI / 2
      hoverRing.visible = false
      hoverRing.renderOrder = 2
      scene.add(hoverRing)

      const render = () => {
        if (!disposed) renderer.render(scene, camera)
      }

      const setCameraGoal = (goal: CameraGoal, immediate = false) => {
        if (!runtime) return
        if (immediate || reduceMotion) {
          runtime.cameraGoal = null
          camera.position.copy(goal.position)
          controls.target.copy(goal.target)
          camera.zoom = THREE.MathUtils.clamp(goal.zoom, MIN_ZOOM, MAX_ZOOM)
          camera.updateProjectionMatrix()
          controls.update()
          render()
        } else {
          runtime.cameraGoal = {
            position: goal.position.clone(),
            target: goal.target.clone(),
            zoom: THREE.MathUtils.clamp(goal.zoom, MIN_ZOOM, MAX_ZOOM),
          }
        }
      }

      const cancelCameraGoal = () => {
        if (runtime) runtime.cameraGoal = null
      }
      controls.addEventListener('start', cancelCameraGoal)

      runtime = {
        renderer,
        scene,
        camera,
        controls,
        template: new THREE.Group(),
        pads: new Map(),
        expansionPads: new Map(),
        labels: new Map(),
        models: new Map(),
        selectedRing,
        selectedPulseRing,
        hoverRing,
        expansionFloor: null,
        layoutCount: -1,
        viewExtent: 8.4,
        cameraGoal: null,
        render,
        syncDrones: () => {},
        focusDrone: (droneId, immediate) => {
          if (!runtime || !droneId) return
          const model = runtime.models.get(droneId)
          if (!model) return
          const target = model.root.position.clone()
          target.y += 0.25
          const offset = camera.position.clone().sub(controls.target)
          if (offset.lengthSq() < 1) offset.copy(DEFAULT_CAMERA_POS)
          setCameraGoal(
            {
              position: target.clone().add(offset),
              target,
              zoom: Math.max(1.85, Math.min(2.35, camera.zoom < 1.7 ? 2.05 : camera.zoom)),
            },
            immediate,
          )
        },
        fitAll: (immediate) => {
          if (!runtime) return
          setCameraGoal(
            {
              position: DEFAULT_CAMERA_POS.clone(),
              target: DEFAULT_TARGET.clone(),
              zoom: 1.04,
            },
            immediate,
          )
        },
        resetCamera: (immediate) => {
          if (!runtime) return
          setCameraGoal(
            {
              position: DEFAULT_CAMERA_POS.clone(),
              target: DEFAULT_TARGET.clone(),
              zoom: 1.12,
            },
            immediate,
          )
        },
        zoomBy: (factor) => {
          if (!runtime) return
          const nextZoom = THREE.MathUtils.clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM)
          setCameraGoal(
            {
              position: camera.position.clone(),
              target: controls.target.clone(),
              zoom: nextZoom,
            },
            false,
          )
        },
        detach: () => {},
      }
      runtimeRef.current = runtime

      const resize = () => {
        const width = host.clientWidth
        const height = host.clientHeight
        if (width < 1 || height < 1) return
        const aspect = width / height
        // Tighter, better-proportioned orthographic framing so drones fill the room cleanly
        const extent = runtime!.viewExtent
        const viewHeight = Math.max(
          10.8,
          12.4 / Math.max(aspect, 0.75),
          (extent * 1.82) / Math.max(aspect, 0.75),
          extent * 1.32,
        )
        const viewWidth = viewHeight * aspect
        camera.left = -viewWidth / 2
        camera.right = viewWidth / 2
        camera.top = viewHeight / 2
        camera.bottom = -viewHeight / 2
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
        render()
      }

      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)
      resize()

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const findDroneAt = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        if (!rect.width || !rect.height) return null
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )
        raycaster.setFromCamera(pointer, camera)
        const candidates = [...(runtime?.models.values() ?? [])].map((model) => model.root)
        const intersection = raycaster.intersectObjects(candidates, true)[0]
        let object: THREE.Object3D | null = intersection?.object ?? null
        while (object && typeof object.userData.droneId !== 'string') object = object.parent
        return typeof object?.userData.droneId === 'string' ? (object.userData.droneId as string) : null
      }

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return
        pointerOrigin = { x: event.clientX, y: event.clientY }
      }
      const onPointerUp = (event: PointerEvent) => {
        if (!pointerOrigin) return
        const moved = Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y)
        pointerOrigin = null
        if (moved > 6) return
        const now = performance.now()
        if (now - lastClickAt < 220) return
        const droneId = findDroneAt(event)
        if (droneId) {
          lastClickAt = now
          onSelectRef.current(droneId)
        }
      }
      const onPointerMove = (event: PointerEvent) => {
        const droneId = findDroneAt(event)
        renderer.domElement.style.cursor = droneId ? 'pointer' : 'grab'
        if (!runtime) return
        if (!droneId) {
          runtime.hoverRing.visible = false
          setHovered((prev) => (prev ? null : prev))
          return
        }
        const model = runtime.models.get(droneId)
        if (model) {
          runtime.hoverRing.visible = droneId !== selectedDroneIdRef.current
          runtime.hoverRing.position.set(
            model.root.position.x,
            model.baseY + 0.14,
            model.root.position.z,
          )
        }
        const rect = renderer.domElement.getBoundingClientRect()
        const meta = dronesRef.current.find((d) => d.id === droneId)
        if (meta) {
          setHovered({
            droneId,
            label: meta.label,
            status: meta.status ?? '',
            x: Math.min(rect.width - 140, Math.max(16, event.clientX - rect.left + 14)),
            y: Math.max(14, event.clientY - rect.top - 42),
          })
        }
      }
      const onPointerLeave = () => {
        if (runtime) runtime.hoverRing.visible = false
        setHovered(null)
      }

      renderer.domElement.addEventListener('pointerdown', onPointerDown)
      renderer.domElement.addEventListener('pointerup', onPointerUp)
      renderer.domElement.addEventListener('pointermove', onPointerMove)
      renderer.domElement.addEventListener('pointerleave', onPointerLeave)

      // Animation loop (paused automatically when document.hidden; idle pulse throttled to ~24fps)
      const clock = new THREE.Clock()
      let lastPulseRender = 0
      const animate = () => {
        if (disposed) return
        rafId = window.requestAnimationFrame(animate)
        if (document.hidden || !runtime) return

        const elapsed = clock.getElapsedTime()
        let needsRender = false

        if (runtime.cameraGoal) {
          const goal = runtime.cameraGoal
          const lerpAlpha = 0.14
          camera.position.lerp(goal.position, lerpAlpha)
          controls.target.lerp(goal.target, lerpAlpha)
          camera.zoom = THREE.MathUtils.lerp(camera.zoom, goal.zoom, lerpAlpha)
          camera.updateProjectionMatrix()
          if (
            camera.position.distanceTo(goal.position) < 0.03 &&
            controls.target.distanceTo(goal.target) < 0.02 &&
            Math.abs(camera.zoom - goal.zoom) < 0.01
          ) {
            camera.position.copy(goal.position)
            controls.target.copy(goal.target)
            camera.zoom = goal.zoom
            camera.updateProjectionMatrix()
            runtime.cameraGoal = null
          }
          needsRender = true
        }

        if (controls.update()) needsRender = true

        // Subtle pulse & gentle lift on the selected drone only (restrained, throttled ~24fps)
        const activeId = selectedDroneIdRef.current
        if (!reduceMotion && activeId && (needsRender || elapsed - lastPulseRender >= 0.042)) {
          const selectedModel = runtime.models.get(activeId)
          if (selectedModel) {
            lastPulseRender = elapsed
            const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.8)
            selectedModel.root.position.y = selectedModel.baseY + 0.05 + pulse * 0.045
            runtime.selectedRing.position.set(
              selectedModel.root.position.x,
              selectedModel.baseY + 0.16,
              selectedModel.root.position.z,
            )
            runtime.selectedPulseRing.position.set(
              selectedModel.root.position.x,
              selectedModel.baseY + 0.05,
              selectedModel.root.position.z,
            )
            const s = 0.96 + pulse * 0.14
            runtime.selectedPulseRing.scale.set(s, s, 1)
            runtime.selectedPulseRing.material.opacity = 0.14 + (1 - pulse) * 0.24
            needsRender = true
          }
        }

        if (needsRender) renderer.render(scene, camera)
      }
      rafId = window.requestAnimationFrame(animate)

      const loader = new GLTFLoader()
      void loader.loadAsync(ROOM_ASSET).then((gltf) => {
        if (disposed || !runtime) {
          disposeObjectTree(gltf.scene)
          return
        }

        const template = gltf.scene.getObjectByName('DRONE_TEMPLATE')
        const pads = new Map<number, THREE.Object3D>()
        for (let index = 1; index <= CORE_DRONE_PADS; index += 1) {
          const pad = gltf.scene.getObjectByName(`PAD_${String(index).padStart(2, '0')}`)
          if (pad) pads.set(index - 1, pad)
        }
        if (!template || pads.size !== CORE_DRONE_PADS) {
          disposeObjectTree(gltf.scene)
          setSceneLoading(false)
          setSceneError(true)
          return
        }

        template.visible = false
        template.parent?.remove(template)
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = object !== template
            object.receiveShadow = true
          }
        })
        scene.add(gltf.scene)
        scene.updateMatrixWorld(true)
        runtime.template = template
        runtime.pads = pads
        for (const [index, pad] of pads) {
          const anchor = pad.getWorldPosition(new THREE.Vector3())
          const padLabel = createPadLabel(index + 1, anchor)
          if (!padLabel) continue
          scene.add(padLabel)
          runtime.labels.set(index, padLabel)
        }
        setSceneLoading(false)
        setSceneError(false)

        const syncDrones = () => {
          if (!runtime) return
          const wanted = dronesRef.current
          if (runtime.layoutCount !== wanted.length) {
            runtime.layoutCount = wanted.length
            runtime.viewExtent = getDroneRoomExtent(wanted.length)
            if (runtime.expansionFloor) {
              scene.remove(runtime.expansionFloor)
              disposeObjectTree(runtime.expansionFloor)
              runtime.expansionFloor = null
            }
            if (wanted.length > CORE_DRONE_PADS) {
              runtime.expansionFloor = createExpansionFloor(runtime.viewExtent)
              scene.add(runtime.expansionFloor)
            }

            const shadowExtent = runtime.viewExtent + 2.5
            keyLight.shadow.camera.left = -shadowExtent
            keyLight.shadow.camera.right = shadowExtent
            keyLight.shadow.camera.top = shadowExtent
            keyLight.shadow.camera.bottom = -shadowExtent
            keyLight.shadow.camera.updateProjectionMatrix()
            resize()
          }

          const extraCount = Math.max(0, wanted.length - CORE_DRONE_PADS)
          for (let extraIndex = 0; extraIndex < extraCount; extraIndex += 1) {
            let pad = runtime.expansionPads.get(extraIndex)
            const position = getExpansionPadPosition(extraIndex, extraCount)
            if (!pad) {
              const padSource = runtime.pads.get(0)
              if (!padSource) continue
              pad = clonePad(padSource, position, CORE_DRONE_PADS + extraIndex + 1)
              scene.add(pad)
              runtime.expansionPads.set(extraIndex, pad)
            }
            pad.position.x = position.x
            pad.position.z = position.z
            pad.visible = true

            let padLabel = runtime.labels.get(CORE_DRONE_PADS + extraIndex)
            if (!padLabel) {
              const anchor = pad.getWorldPosition(new THREE.Vector3())
              const inward = new THREE.Vector2(-position.x, -position.z).normalize()
              padLabel = createPadLabel(CORE_DRONE_PADS + extraIndex + 1, anchor, inward) ?? undefined
              if (padLabel) {
                scene.add(padLabel)
                runtime.labels.set(CORE_DRONE_PADS + extraIndex, padLabel)
              }
            }
            if (padLabel) padLabel.visible = true
          }
          for (const [extraIndex, pad] of runtime.expansionPads) {
            if (extraIndex >= extraCount) pad.visible = false
          }
          for (const [slot, padLabel] of runtime.labels) {
            if (slot >= CORE_DRONE_PADS && slot >= wanted.length) padLabel.visible = false
          }

          const wantedIds = new Set(wanted.map((drone) => drone.id))
          for (const [droneId, model] of runtime.models) {
            if (wantedIds.has(droneId)) continue
            runtime.scene.remove(model.root)
            model.materials.forEach((material) => material.dispose())
            model.statusRing.geometry.dispose()
            model.statusRing.material.dispose()
            runtime.models.delete(droneId)
          }

          wanted.forEach((drone, index) => {
            let model = runtime?.models.get(drone.id)
            const pad =
              index < CORE_DRONE_PADS
                ? runtime?.pads.get(index)
                : runtime?.expansionPads.get(index - CORE_DRONE_PADS)
            if (!runtime || !pad) return
            if (!model) {
              model = cloneDrone(runtime.template, drone.id, drone.status, pad)
              runtime.models.set(drone.id, model)
              runtime.scene.add(model.root)
            } else {
              model.statusRing.material.color.setHex(statusColorHex(drone.status))
            }
            const anchor = pad.getWorldPosition(new THREE.Vector3())
            model.baseY = anchor.y + 0.08
            model.root.position.set(anchor.x, model.baseY, anchor.z)
          })

          const selectedModel = selectedDroneIdRef.current
            ? runtime.models.get(selectedDroneIdRef.current)
            : undefined
          runtime.selectedRing.visible = Boolean(selectedModel)
          runtime.selectedPulseRing.visible = Boolean(selectedModel)
          if (selectedModel) {
            runtime.selectedRing.position.set(
              selectedModel.root.position.x,
              selectedModel.baseY + 0.16,
              selectedModel.root.position.z,
            )
            runtime.selectedPulseRing.position.set(
              selectedModel.root.position.x,
              selectedModel.baseY + 0.05,
              selectedModel.root.position.z,
            )
          }
          runtime.render()
        }

        runtimeRef.current = runtime
        runtime.syncDrones = syncDrones
        syncDrones()
      }).catch(() => {
        if (disposed) return
        setSceneLoading(false)
        setSceneError(true)
      })

      runtime.detach = () => {
        controls.removeEventListener('start', cancelCameraGoal)
        controls.dispose()
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        renderer.domElement.removeEventListener('pointerup', onPointerUp)
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
        renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      }
    } catch {
      setSceneLoading(false)
      setSceneError(true)
    }

    return () => {
      disposed = true
      window.cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      const active = runtimeRef.current
      if (active) {
        active.detach()
        active.models.forEach((model) => {
          model.materials.forEach((material) => material.dispose())
          model.statusRing.geometry.dispose()
          model.statusRing.material.dispose()
        })
        disposeObjectTree(active.scene)
        active.renderer.dispose()
        active.renderer.domElement.remove()
      }
      runtimeRef.current = null
    }
  }, [])

  useEffect(() => {
    runtimeRef.current?.syncDrones()
  }, [drones])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    // Reset previous lifted drones to their baseY
    runtime.models.forEach((model) => {
      model.root.position.y = model.baseY
    })
    const selectedModel = selectedDroneId ? runtime.models.get(selectedDroneId) : undefined
    runtime.selectedRing.visible = Boolean(selectedModel)
    runtime.selectedPulseRing.visible = Boolean(selectedModel)
    if (selectedModel) {
      runtime.selectedRing.position.set(
        selectedModel.root.position.x,
        selectedModel.baseY + 0.16,
        selectedModel.root.position.z,
      )
      runtime.selectedPulseRing.position.set(
        selectedModel.root.position.x,
        selectedModel.baseY + 0.05,
        selectedModel.root.position.z,
      )
    }
    runtime.render()
  }, [selectedDroneId])

  useEffect(() => {
    if (focusRequestId > 0 && selectedDroneId) {
      runtimeRef.current?.focusDrone(selectedDroneId)
    }
  }, [focusRequestId, selectedDroneId])

  const handleToggleFullscreen = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement === el) {
      void document.exitFullscreen?.()
    } else {
      void el.requestFullscreen?.()
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className={`mgr-office-drone-scene-wrap${isFullscreen ? ' is-fullscreen' : ''}`}
      role="region"
      aria-label={label}
    >
      <div ref={hostRef} className="mgr-office-drone-scene" aria-hidden="true" />

      {/* Subtle top-left operational HUD badges */}
      {(fleetSummaryLabel || bayCountLabel) && (
        <div className="mgr-drone-scene-hud-top">
          {fleetSummaryLabel && (
            <span className="mgr-drone-scene-pill">{fleetSummaryLabel}</span>
          )}
          {bayCountLabel && (
            <span className="mgr-drone-scene-pill is-accent">{bayCountLabel}</span>
          )}
        </div>
      )}

      {/* Hover tooltip showing short drone identity + actual status */}
      {hovered && (
        <div
          className="mgr-drone-scene-hover-tip"
          style={{ left: hovered.x, top: hovered.y }}
          role="status"
          aria-live="polite"
        >
          <strong>{hovered.label}</strong>
          {hovered.status && (
            <span>
              {getDroneStatusLabel(hovered.status as DroneStatus, lang === 'en' ? 'en' : 'vi')}
            </span>
          )}
        </div>
      )}

      {/* Compact floating 3D camera toolbar */}
      {!sceneError && (
        <DroneSceneToolbar
          lang={lang}
          hasSelection={Boolean(selectedDroneId)}
          isFullscreen={isFullscreen}
          onZoomIn={() => runtimeRef.current?.zoomBy(1.24)}
          onZoomOut={() => runtimeRef.current?.zoomBy(0.8)}
          onFocusSelected={() => runtimeRef.current?.focusDrone(selectedDroneId)}
          onFitAll={() => runtimeRef.current?.fitAll()}
          onReset={() => runtimeRef.current?.resetCamera()}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {sceneLoading && (
        <p className="mgr-office-drone-scene-status" role="status" aria-live="polite">
          {loadingMessage}
        </p>
      )}
      {sceneError && (
        <p className="mgr-office-drone-scene-fallback" role="status">
          {fallbackMessage}
        </p>
      )}
    </div>
  )
}
