import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Icon } from '../../../shared/components/Icon'

export type Stage3DPreset = {
  id: string
  code: string
  label: string
  summary: string
  metricLabel: string
  metricValue: string
}

type VisualizationMode = 'realistic' | 'digital-twin' | 'scan' | 'wireframe'
type QualityLevel = 'HIGH' | 'MEDIUM' | 'LOW'

type Props = {
  eyebrow: string
  heading: string
  subtitle: string
  dragHint: string
  fallbackCaption: string
  presets: readonly Stage3DPreset[]
  ctaLabel: string
  ctaHref: string
}

type CameraView = {
  pos: THREE.Vector3
  target: THREE.Vector3
}

type CollisionPeak = {
  x: number
  z: number
  halfW: number
  halfD: number
  topY: number
}

// Synthetic inspection peaks in Three.js Y-up meters (glTF converts Blender (x, y, z) -> (x, z, -y))
const DEFAULT_PEAK_TARGETS: readonly {
  id: string
  label: string
  pos: [number, number, number]
}[] = [
  { id: 'SCAN_TARGET_PEAK_NW_11F', label: 'Điểm A · Khối 11 tầng (40.5m)', pos: [-48, 44.5, -50] },
  { id: 'SCAN_TARGET_PEAK_NE_9F', label: 'Điểm B · Khối 9 tầng (33.3m)', pos: [50, 37.3, -47] },
  { id: 'SCAN_TARGET_PEAK_SW_6F', label: 'Điểm C · Khối 6 tầng (22.5m)', pos: [-45, 26.5, 46] },
]

// Simplified collision envelopes matching the 3 stepped architectural peaks (6 / 9 / 11 floors)
const PEAK_COLLISION_HULLS: readonly CollisionPeak[] = [
  { x: -48, z: -50, halfW: 16, halfD: 14, topY: 42 },
  { x: 50, z: -47, halfW: 15, halfD: 14, topY: 35 },
  { x: -45, z: 46, halfW: 15, halfD: 13, topY: 24 },
]

const VISUAL_MODES: readonly { id: VisualizationMode; label: string }[] = [
  { id: 'realistic', label: 'Kiến trúc thực tế' },
  { id: 'digital-twin', label: 'Digital Twin' },
  { id: 'scan', label: 'Chế độ quét Drone' },
  { id: 'wireframe', label: 'Wireframe' },
]

const SPEED_OPTIONS = [0.5, 1, 2] as const

function detectInitialQuality(): QualityLevel {
  if (typeof window === 'undefined') return 'MEDIUM'
  if (window.innerWidth < 768) return 'LOW'
  if (window.innerWidth < 1280) return 'MEDIUM'
  return 'HIGH'
}

/** Preserved industrial quadcopter builder scaled for the 148m campus digital twin. */
function buildIndustrialDrone(): {
  group: THREE.Group
  rotors: THREE.Object3D[]
  gimbal: THREE.Object3D
  scanBeam: THREE.Mesh
  navLeds: THREE.Mesh[]
} {
  const group = new THREE.Group()
  const rotors: THREE.Object3D[] = []
  const navLeds: THREE.Mesh[] = []

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.36,
    metalness: 0.22,
  })
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.08,
  })
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.15,
  })
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.32,
    metalness: 0.25,
  })

  const core = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 1.25), carbonMat)
  group.add(core)

  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.58, 0.18, 6),
    shellMat,
  )
  canopy.position.set(0, 0.17, -0.02)
  canopy.rotation.y = Math.PI / 6
  group.add(canopy)

  const statusStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.04, 0.08),
    accentMat,
  )
  statusStrip.position.set(0, 0.18, 0.56)
  group.add(statusStrip)

  for (const side of [-1, 1]) {
    const legA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.48, 8),
      carbonMat,
    )
    legA.position.set(side * 0.42, -0.28, 0.24)
    legA.rotation.z = side * 0.18
    group.add(legA)

    const legB = legA.clone()
    legB.position.z = -0.24
    group.add(legB)

    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 1.15, 10),
      carbonMat,
    )
    rail.rotation.x = Math.PI / 2
    rail.position.set(side * 0.47, -0.5, 0)
    group.add(rail)
  }

  const armAngles = [
    Math.PI * 0.25,
    Math.PI * 0.75,
    -Math.PI * 0.75,
    -Math.PI * 0.25,
  ]
  const blurDiscMat = new THREE.MeshBasicMaterial({
    color: 0x6ee7b7,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.2,
  })

  armAngles.forEach((angle, idx) => {
    const armLen = 1.28
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.052, armLen, 10),
      carbonMat,
    )
    arm.rotation.z = Math.PI / 2
    arm.rotation.y = angle
    arm.position.set(
      Math.cos(angle) * (armLen * 0.48),
      0.06,
      -Math.sin(angle) * (armLen * 0.48),
    )
    group.add(arm)

    const tipX = Math.cos(angle) * 1.16
    const tipZ = -Math.sin(angle) * 1.16

    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.12, 0.16, 16),
      darkMetalMat,
    )
    motor.position.set(tipX, 0.14, tipZ)
    group.add(motor)

    const rotorHub = new THREE.Group()
    rotorHub.position.set(tipX, 0.24, tipZ)

    const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.014, 0.08), bladeMat)
    const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.014, 0.92), bladeMat)
    const blurDisc = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.47, 24), blurDiscMat)
    blurDisc.rotation.x = -Math.PI / 2
    rotorHub.add(bladeA, bladeB, blurDisc)
    group.add(rotorHub)
    rotors.push(rotorHub)

    const isFront = idx === 0 || idx === 3
    const ledMat = new THREE.MeshBasicMaterial({
      color: isFront ? 0x65dfba : 0xf97316,
    })
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), ledMat)
    led.position.set(tipX, 0.02, tipZ)
    group.add(led)
    navLeds.push(led)
  })

  const gimbal = new THREE.Group()
  gimbal.position.set(0, -0.22, 0.34)
  const housing = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    darkMetalMat,
  )
  const lensRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.12, 16),
    accentMat,
  )
  lensRing.rotation.x = Math.PI / 2
  lensRing.position.set(0, -0.02, 0.12)
  gimbal.add(housing, lensRing)
  group.add(gimbal)

  // Volumetric scanning cone beneath gimbal (clear without obscuring architecture)
  const beamGeo = new THREE.ConeGeometry(2.6, 5.2, 28, 1, true)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x64dfc4,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const scanBeam = new THREE.Mesh(beamGeo, beamMat)
  scanBeam.position.set(0, -2.85, 0.34)
  group.add(scanBeam)

  group.scale.setScalar(2.15)
  return { group, rotors, gimbal, scanBeam, navLeds }
}

/** Computes camera presets dynamically from the loaded campus bounding box. */
function computeCampusCameraViews(box: THREE.Box3): Record<string, CameraView> {
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)
  const span = Math.max(size.x, size.z, 120)

  return {
    overview: {
      pos: new THREE.Vector3(center.x + span * 0.86, size.y * 1.72, center.z + span * 0.90),
      target: new THREE.Vector3(center.x, size.y * 0.22, center.z - 2),
    },
    topdown: {
      pos: new THREE.Vector3(center.x, span * 1.24, center.z + 18),
      target: new THREE.Vector3(center.x, 4, center.z),
    },
    facade: {
      pos: new THREE.Vector3(center.x - span * 0.16, size.y * 0.56, center.z + span * 0.84),
      target: new THREE.Vector3(center.x - 4, size.y * 0.32, center.z + 6),
    },
    courtyard: {
      pos: new THREE.Vector3(center.x + 18, 14, center.z + 32),
      target: new THREE.Vector3(center.x - 10, 14, center.z - 16),
    },
    drone: {
      pos: new THREE.Vector3(center.x + 28, 52, center.z + 36),
      target: new THREE.Vector3(center.x, 30, center.z),
    },
    free: {
      pos: new THREE.Vector3(center.x + span * 0.64, size.y * 1.32, center.z + span * 0.68),
      target: new THREE.Vector3(center.x, size.y * 0.22, center.z),
    },
  }
}

/** Simplified collision avoidance: guarantees safe vertical clearance above peak roofs & terrain. */
function enforceDroneClearance(pos: THREE.Vector3): void {
  let minY = 16.0
  for (const hull of PEAK_COLLISION_HULLS) {
    const dx = Math.abs(pos.x - hull.x)
    const dz = Math.abs(pos.z - hull.z)
    if (dx <= hull.halfW + 6 && dz <= hull.halfD + 6) {
      minY = Math.max(minY, hull.topY + 6.5)
    }
  }
  if (pos.y < minY) {
    pos.y = minY
  }
}

/**
 * Interactive WebGL Three.js 3D Digital Twin of FPT University HCMC
 * with procedural Blender GLB asset loading, OrbitControls, 6 camera presets,
 * 4 visualization modes, 3 quality tiers, and synthetic drone scanning simulation.
 */
export function Interactive3DDroneStage({
  eyebrow,
  heading,
  subtitle,
  dragHint,
  fallbackCaption,
  presets,
  ctaLabel,
  ctaHref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [visualMode, setVisualMode] = useState<VisualizationMode>('realistic')
  const [quality, setQuality] = useState<QualityLevel>(() => detectInitialQuality())
  const [paused, setPaused] = useState(false)
  const [simSpeed, setSimSpeed] = useState<number>(1)
  const [scanProgress, setScanProgress] = useState(0)
  const [activeTargetLabel, setActiveTargetLabel] = useState(DEFAULT_PEAK_TARGETS[0].label)
  const [loadProgress, setLoadProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [resetViewNonce, setResetViewNonce] = useState(0)
  const [resetSimNonce, setResetSimNonce] = useState(0)
  const [webglReady, setWebglReady] = useState(true)

  const activePresetIdRef = useRef<string>(presets[0]?.id ?? 'overview')
  const visualModeRef = useRef<VisualizationMode>(visualMode)
  const pausedRef = useRef(paused)
  const simSpeedRef = useRef(simSpeed)
  const cameraTransitionRef = useRef(true)
  const simProgressRef = useRef(0)

  useEffect(() => {
    const nextId = presets[activeIndex]?.id ?? 'overview'
    activePresetIdRef.current = nextId
    cameraTransitionRef.current = true
  }, [activeIndex, presets])

  useEffect(() => {
    visualModeRef.current = visualMode
  }, [visualMode])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    simSpeedRef.current = simSpeed
  }, [simSpeed])

  useEffect(() => {
    if (resetViewNonce > 0) {
      cameraTransitionRef.current = true
    }
  }, [resetViewNonce])

  useEffect(() => {
    if (resetSimNonce > 0) {
      simProgressRef.current = 0
      setScanProgress(0)
      setPaused(false)
    }
  }, [resetSimNonce])

  useEffect(() => {
    const mount = containerRef.current
    if (!mount) return
    if (
      typeof window === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setWebglReady(false)
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: quality !== 'LOW',
        alpha: false,
        powerPreference: quality === 'LOW' ? 'default' : 'high-performance',
      })
    } catch {
      setWebglReady(false)
      return
    }

    const dprLimit = quality === 'HIGH' ? 2 : quality === 'MEDIUM' ? 1.5 : 1
    const width = mount.clientWidth || 960
    const height = mount.clientHeight || 560
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprLimit))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    renderer.shadowMap.enabled = quality !== 'LOW'
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    // Natural warm-neutral tropical daylight sky for Kiến trúc thực tế (matching Blender AgX/Nishita)
    const daylightBg = new THREE.Color(0xc9dff0)
    const twinBg = new THREE.Color(0x091620)
    scene.background = daylightBg.clone()
    scene.fog = new THREE.FogExp2(0xc9dff0, 0.0014)

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 950)
    camera.position.set(112, 74, 118)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.maxPolarAngle = Math.PI * 0.485
    controls.minDistance = 18
    controls.maxDistance = 300
    controls.target.set(-4, 14, -2)

    const onControlStart = () => {
      // Hand camera smoothly to user as soon as they drag/zoom
      cameraTransitionRef.current = false
    }
    controls.addEventListener('start', onControlStart)

    // Balanced tropical daylight lighting (neutral/warm sun + sky hemisphere, no cyan cast)
    const hemiLight = new THREE.HemisphereLight(0xf4f8fc, 0x5c6e58, 1.12)
    const sunLight = new THREE.DirectionalLight(0xfff7ea, 2.25)
    sunLight.position.set(95, 138, 82)
    if (quality !== 'LOW') {
      sunLight.castShadow = true
      const shadowRes = quality === 'HIGH' ? 2048 : 1024
      sunLight.shadow.mapSize.set(shadowRes, shadowRes)
      sunLight.shadow.camera.near = 20
      sunLight.shadow.camera.far = 360
      const d = 115
      sunLight.shadow.camera.left = -d
      sunLight.shadow.camera.right = d
      sunLight.shadow.camera.top = d
      sunLight.shadow.camera.bottom = -d
      sunLight.shadow.bias = -0.0005
    }
    const fillLight = new THREE.DirectionalLight(0xe2eef8, 0.52)
    fillLight.position.set(-90, 58, -72)
    scene.add(hemiLight, sunLight, fillLight)

    // Digital Twin ground grid accent (visible in Digital Twin & Scan modes)
    const twinGrid = new THREE.GridHelper(210, 42, 0x64dfc4, 0x1e3a4c)
    twinGrid.position.y = -0.08
    ;(twinGrid.material as THREE.Material).transparent = true
    ;(twinGrid.material as THREE.Material).opacity = 0.28
    twinGrid.visible = false
    scene.add(twinGrid)

    // Preserved Drone + Scan overlays
    const drone = buildIndustrialDrone()
    drone.group.position.set(-40, 50, -32)
    scene.add(drone.group)

    const scanRing = new THREE.Mesh(
      new THREE.RingGeometry(4.5, 6.2, 40),
      new THREE.MeshBasicMaterial({
        color: 0x64dfc4,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    scanRing.rotation.x = -Math.PI / 2
    scanRing.position.set(-40, 44.5, -32)
    scene.add(scanRing)

    // Synthetic closed flight curve orbiting all 3 peaks & central courtyard
    let targetCoords = DEFAULT_PEAK_TARGETS.map((t) => ({
      ...t,
      vec: new THREE.Vector3(...t.pos),
    }))

    const buildFlightPath = () => {
      const p0 = targetCoords[0].vec
      const p1 = targetCoords[1].vec
      const p2 = targetCoords[2].vec
      return new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(p0.x, p0.y + 8, p0.z),
          new THREE.Vector3(0, 44, -36),
          new THREE.Vector3(p1.x, p1.y + 8, p1.z),
          new THREE.Vector3(34, 34, 24),
          new THREE.Vector3(0, 26, 26),
          new THREE.Vector3(p2.x, p2.y + 8, p2.z),
          new THREE.Vector3(-44, 38, 0),
        ],
        true,
      )
    }

    let flightCurve = buildFlightPath()
    const pathMat = new THREE.LineBasicMaterial({
      color: 0x64dfc4,
      transparent: true,
      opacity: 0.6,
    })
    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(flightCurve.getPoints(120)),
      pathMat,
    )
    scene.add(pathLine)

    // 3 Virtual inspection markers
    const markersGroup = new THREE.Group()
    const markerMeshes: THREE.Mesh[] = []
    const markerRings: THREE.Mesh[] = []
    const markerGeo = new THREE.OctahedronGeometry(2.1, 0)
    const markerRingGeo = new THREE.RingGeometry(2.8, 3.6, 28)

    targetCoords.forEach((t) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      const m = new THREE.Mesh(markerGeo, mat)
      m.position.copy(t.vec)
      markersGroup.add(m)
      markerMeshes.push(m)

      const rMat = new THREE.MeshBasicMaterial({
        color: 0x64dfc4,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(markerRingGeo, rMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(t.vec.x, t.vec.y - 1.2, t.vec.z)
      markersGroup.add(ring)
      markerRings.push(ring)
    })
    scene.add(markersGroup)

    // Campus model container + visualization mode helper collections
    const campusRoot = new THREE.Group()
    scene.add(campusRoot)
    const campusMeshes: THREE.Mesh[] = []
    const twinEdgeLines: THREE.LineSegments[] = []
    let cameraViews = computeCampusCameraViews(
      new THREE.Box3(new THREE.Vector3(-74, 0, -72), new THREE.Vector3(74, 42, 72)),
    )

    let disposed = false
    const modelUrl =
      quality === 'LOW' ? '/models/fpt-campus-low.glb?v=4' : '/models/fpt-campus.glb?v=4'

    setLoading(true)
    setLoadError(null)
    setLoadProgress(5)

    const loader = new GLTFLoader()
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return
        const root = gltf.scene
        campusRoot.add(root)

        const edgeMat = new THREE.LineBasicMaterial({
          color: 0x64dfc4,
          transparent: true,
          opacity: 0.36,
        })

        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.castShadow = quality !== 'LOW'
            obj.receiveShadow = quality !== 'LOW'
            campusMeshes.push(obj)

            // Build lightweight architectural outline accents for Digital Twin mode (skip foliage)
            const lower = obj.name.toLowerCase()
            if (
              !lower.includes('vegetation') &&
              !lower.includes('foliage') &&
              !lower.includes('trunk')
            ) {
              const edgesGeo = new THREE.EdgesGeometry(obj.geometry, 32)
              const line = new THREE.LineSegments(edgesGeo, edgeMat)
              line.visible = false
              obj.add(line)
              twinEdgeLines.push(line)
            }
          }
          // Extract exported Blender SCAN_TARGET empties if present
          const matchedIdx = targetCoords.findIndex((t) => t.id === obj.name)
          if (matchedIdx >= 0) {
            const worldPos = new THREE.Vector3()
            obj.updateWorldMatrix(true, false)
            obj.getWorldPosition(worldPos)
            targetCoords[matchedIdx].vec.copy(worldPos)
            markerMeshes[matchedIdx]?.position.copy(worldPos)
            markerRings[matchedIdx]?.position.set(worldPos.x, worldPos.y - 1.2, worldPos.z)
          }
        })

        // Rebuild flight spline using exact GLB target coordinates
        flightCurve = buildFlightPath()
        pathLine.geometry.dispose()
        pathLine.geometry = new THREE.BufferGeometry().setFromPoints(
          flightCurve.getPoints(120),
        )

        // Frame camera dynamically from actual campus bounding box
        const bbox = new THREE.Box3().setFromObject(root)
        if (!bbox.isEmpty()) {
          cameraViews = computeCampusCameraViews(bbox)
          cameraTransitionRef.current = true
        }

        setLoadProgress(100)
        setLoading(false)
      },
      (evt) => {
        if (disposed) return
        if (evt.total > 0) {
          setLoadProgress(Math.min(99, Math.round((evt.loaded / evt.total) * 100)))
        }
      },
      () => {
        if (disposed) return
        setLoading(false)
        setLoadError('Không tải được mô hình 3D Đại học FPT TP.HCM. Vui lòng thử lại.')
      },
    )

    const onContextLost = (e: Event) => {
      e.preventDefault()
      setWebglReady(false)
    }
    const domEl = renderer.domElement
    domEl.addEventListener('webglcontextlost', onContextLost)

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (w > 0 && h > 0) {
              camera.aspect = w / h
              camera.updateProjectionMatrix()
              renderer.setSize(w, h)
            }
          })
        : null
    resizeObserver?.observe(mount)

    let inView = true
    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? true
            },
            { threshold: 0.05 },
          )
        : null
    intersectionObserver?.observe(mount)

    // Pre-allocated scratch vectors (zero per-frame allocations)
    const droneNextPos = new THREE.Vector3()
    const droneLookPos = new THREE.Vector3()
    const desiredCamPos = new THREE.Vector3()
    const desiredCamTarget = new THREE.Vector3()
    const clock = new THREE.Clock()
    let rafId = 0
    let lastUiSync = 0
    let lastAppliedMode: VisualizationMode | null = null

    const applyVisualMode = (mode: VisualizationMode) => {
      const isWire = mode === 'wireframe'
      const isTwin = mode === 'digital-twin'
      const isScan = mode === 'scan'

      campusMeshes.forEach((mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          if ('wireframe' in m) {
            ;(m as THREE.MeshStandardMaterial).wireframe = isWire
          }
        })
      })

      twinEdgeLines.forEach((line) => {
        line.visible = isTwin
      })
      twinGrid.visible = isTwin || isScan || isWire
      pathLine.visible = isScan || isTwin || activePresetIdRef.current === 'topdown' || activePresetIdRef.current === 'drone'
      markersGroup.visible = isScan || isTwin || activePresetIdRef.current !== 'courtyard'
      ;(drone.scanBeam.material as THREE.MeshBasicMaterial).opacity = isScan ? 0.34 : 0.16
      scanRing.visible = isScan || isTwin

      if (isTwin || isWire) {
        ;(scene.background as THREE.Color).copy(twinBg)
        if (scene.fog instanceof THREE.FogExp2) scene.fog.color.copy(twinBg)
        sunLight.intensity = 1.45
      } else {
        ;(scene.background as THREE.Color).copy(daylightBg)
        if (scene.fog instanceof THREE.FogExp2) scene.fog.color.copy(daylightBg)
        sunLight.intensity = 2.2
      }
    }

    const animate = () => {
      rafId = window.requestAnimationFrame(animate)
      if (!inView || document.hidden) return

      const dt = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.elapsedTime
      const mode = visualModeRef.current

      if (mode !== lastAppliedMode) {
        applyVisualMode(mode)
        lastAppliedMode = mode
      }

      // Spin propellers continuously (slow idle when paused)
      const rotorSpeed = pausedRef.current ? 10 : 34 * Math.max(0.7, simSpeedRef.current)
      drone.rotors.forEach((r, idx) => {
        r.rotation.y += dt * (idx % 2 === 0 ? rotorSpeed : -rotorSpeed)
      })

      // Advance synthetic flight along closed campus spline
      if (!pausedRef.current) {
        simProgressRef.current = (simProgressRef.current + dt * 0.024 * simSpeedRef.current) % 1
      }
      const u = simProgressRef.current
      flightCurve.getPointAt(u, droneNextPos)
      droneNextPos.y += Math.sin(elapsed * 2.1) * 0.65
      enforceDroneClearance(droneNextPos)
      drone.group.position.lerp(droneNextPos, 0.12)

      flightCurve.getPointAt((u + 0.02) % 1, droneLookPos)
      drone.group.lookAt(droneLookPos.x, drone.group.position.y, droneLookPos.z)
      drone.gimbal.rotation.y = Math.sin(elapsed * 1.1) * 0.35

      // Scan ring projects below the drone
      const pulse = 1 + Math.sin(elapsed * 2.6) * 0.14
      scanRing.scale.set(pulse, pulse, 1)
      scanRing.position.set(
        drone.group.position.x,
        Math.max(0.5, drone.group.position.y - 16),
        drone.group.position.z,
      )

      // Animate 3 virtual inspection markers & track nearest target
      let nearestIdx = 0
      let nearestDist = Infinity
      markerMeshes.forEach((m, i) => {
        m.rotation.y = elapsed * 1.5 + i
        const ring = markerRings[i]
        if (ring) {
          const rp = 1 + Math.sin(elapsed * 2.4 + i) * 0.18
          ring.scale.set(rp, rp, 1)
        }
        const dist = drone.group.position.distanceTo(targetCoords[i].vec)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIdx = i
        }
      })

      // Throttled React HUD sync (~4 Hz) so there is zero React re-render pressure
      if (elapsed - lastUiSync > 0.25) {
        lastUiSync = elapsed
        setScanProgress(Math.round(u * 100))
        setActiveTargetLabel(targetCoords[nearestIdx].label)
      }

      // Camera preset interpolation or Drone follow-cam
      const presetId = activePresetIdRef.current
      if (presetId === 'drone') {
        desiredCamTarget.copy(drone.group.position)
        desiredCamPos.set(
          drone.group.position.x + 24,
          drone.group.position.y + 12,
          drone.group.position.z + 24,
        )
        camera.position.lerp(desiredCamPos, 0.06)
        controls.target.lerp(desiredCamTarget, 0.08)
      } else if (cameraTransitionRef.current && presetId !== 'free') {
        const view = cameraViews[presetId] ?? cameraViews.overview
        camera.position.lerp(view.pos, 0.07)
        controls.target.lerp(view.target, 0.08)
        if (
          camera.position.distanceTo(view.pos) < 0.35 &&
          controls.target.distanceTo(view.target) < 0.35
        ) {
          cameraTransitionRef.current = false
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    rafId = window.requestAnimationFrame(animate)

    return () => {
      disposed = true
      window.cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      controls.removeEventListener('start', onControlStart)
      controls.dispose()
      domEl.removeEventListener('webglcontextlost', onContextLost)

      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Line ||
          obj instanceof THREE.LineSegments ||
          obj instanceof THREE.Points
        ) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
      renderer.dispose()
      if (domEl.parentNode === mount) {
        mount.removeChild(domEl)
      }
    }
  }, [quality, reloadNonce])

  const activePreset = presets[activeIndex] ?? presets[0]

  return (
    <section
      id="interactive-3d"
      className="lp3-stage3d"
      aria-labelledby="lp3-stage3d-heading"
    >
      <div className="lpx-container">
        <div className="lp3-stage3d-head">
          <div>
            <div className="lpx-section-eyebrow lpx-section-eyebrow--dark">
              {eyebrow}
            </div>
            <h2
              id="lp3-stage3d-heading"
              className="lpx-section-title lpx-section-title--light"
            >
              {heading}
            </h2>
          </div>
          <p className="lp3-stage3d-sub">{subtitle}</p>
        </div>

        {/* Compact aerospace control bar: Visualization Modes + Drone Simulation + Quality */}
        <div className="lp3-stage3d-toolbar" role="toolbar" aria-label="Điều khiển mô hình 3D">
          <div className="lp3-stage3d-mode-group" role="group" aria-label="Chế độ hiển thị">
            {VISUAL_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`lp3-stage3d-chip${visualMode === m.id ? ' is-active' : ''}`}
                aria-pressed={visualMode === m.id}
                onClick={() => setVisualMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="lp3-stage3d-sim-group">
            <button
              type="button"
              className="lp3-stage3d-chip"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? 'Tiếp tục bay' : 'Tạm dừng'}
            </button>
            <button
              type="button"
              className="lp3-stage3d-chip"
              onClick={() => {
                const idx = SPEED_OPTIONS.indexOf(simSpeed as 0.5 | 1 | 2)
                setSimSpeed(SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length])
              }}
              title="Đổi tốc độ mô phỏng"
            >
              Tốc độ {simSpeed}×
            </button>
            <button
              type="button"
              className="lp3-stage3d-chip"
              onClick={() => setResetSimNonce((n) => n + 1)}
            >
              Đặt lại bay
            </button>
            <button
              type="button"
              className="lp3-stage3d-chip"
              onClick={() => {
                setActiveIndex(0)
                setResetViewNonce((n) => n + 1)
              }}
            >
              Đặt lại góc nhìn
            </button>
            <select
              className="lp3-stage3d-quality"
              aria-label="Mức chất lượng đồ họa"
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityLevel)}
            >
              <option value="HIGH">Chất lượng: Cao (Desktop)</option>
              <option value="MEDIUM">Chất lượng: Trung bình</option>
              <option value="LOW">Chất lượng: Nhẹ (Mobile)</option>
            </select>
          </div>
        </div>

        <div className="lp3-stage3d-shell">
          <div className="lp3-stage3d-viewport">
            {webglReady ? (
              <div ref={containerRef} className="lp3-stage3d-canvas" />
            ) : (
              <div className="lp3-stage3d-fallback">
                <img
                  src="/assets/cinematic-drone/living-mission-industrial-v5-poster.webp"
                  alt={fallbackCaption}
                  width={1280}
                  height={720}
                  loading="lazy"
                />
              </div>
            )}

            {webglReady && loading && (
              <div className="lp3-stage3d-overlay" role="status" aria-live="polite">
                <div className="lp3-stage3d-loader-card">
                  <span>Đang tải Digital Twin ĐH FPT TP.HCM…</span>
                  <strong>{loadProgress}%</strong>
                  <div className="lp3-stage3d-loader-bar">
                    <span style={{ width: `${loadProgress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {webglReady && loadError && (
              <div className="lp3-stage3d-overlay" role="alert">
                <div className="lp3-stage3d-loader-card">
                  <span>{loadError}</span>
                  <button
                    type="button"
                    className="lp3-stage3d-chip is-active"
                    onClick={() => setReloadNonce((n) => n + 1)}
                  >
                    Tải lại mô hình
                  </button>
                </div>
              </div>
            )}

            <div className="lp3-stage3d-hud-top" aria-hidden="true">
              <span className="lp3-stage3d-live">
                <span className="lp3-stage3d-live-dot" />
                DIGITAL TWIN 3D · ĐH FPT TP.HCM
              </span>
              <span className="lp3-stage3d-drag">{dragHint}</span>
            </div>

            {activePreset && (
              <div className="lp3-stage3d-hud-bottom">
                <div className="lp3-stage3d-metric">
                  <span>
                    {visualMode === 'scan'
                      ? `TIẾN ĐỘ QUÉT MÔ PHỎNG · ${scanProgress}%`
                      : activePreset.metricLabel}
                  </span>
                  <strong>
                    {visualMode === 'scan'
                      ? activeTargetLabel
                      : activePreset.metricValue}
                  </strong>
                </div>
                <a className="lpx-cta-mint lp3-stage3d-cta" href={ctaHref}>
                  <span>{ctaLabel}</span>
                  <Icon name="arrow-up-right" className="lpx-cta-icon" />
                </a>
              </div>
            )}
          </div>

          <div
            className="lp3-stage3d-presets"
            role="tablist"
            aria-label={heading}
          >
            {presets.map((preset, idx) => {
              const isSelected = idx === activeIndex
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`lp3-stage3d-preset${isSelected ? ' is-active' : ''}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <span className="lp3-stage3d-preset-code">{preset.code}</span>
                  <strong>{preset.label}</strong>
                  <span>{preset.summary}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
