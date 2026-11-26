import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Icon } from '../../../shared/components/Icon'

export type Stage3DPreset = {
  id: string
  code: string
  label: string
  summary: string
  metricLabel: string
  metricValue: string
}

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

type CameraRig = {
  pos: [number, number, number]
  target: [number, number, number]
  scanColor: number
  droneY: number
}

const CAMERA_RIGS: readonly CameraRig[] = [
  {
    pos: [5.4, 3.3, 6.2],
    target: [0, 0.9, 0],
    scanColor: 0x65dfba,
    droneY: 2.05,
  },
  {
    pos: [0.4, 6.4, 5.8],
    target: [0, 0.2, 0],
    scanColor: 0x38bdf8,
    droneY: 2.35,
  },
  {
    pos: [-6.2, 2.7, 5.2],
    target: [0.4, 0.7, -0.3],
    scanColor: 0x65dfba,
    droneY: 1.9,
  },
  {
    pos: [2.5, 2.45, 2.8],
    target: [0, 1.95, 0],
    scanColor: 0xf59e0b,
    droneY: 2.0,
  },
]

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

  // Main chassis core + sculpted top shell
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

  // Landing skids
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

  // 4 carbon arms, motors, spinning blades & aviation LEDs
  const armAngles = [
    Math.PI * 0.25,
    Math.PI * 0.75,
    -Math.PI * 0.75,
    -Math.PI * 0.25,
  ]
  const blurDiscMat = new THREE.MeshBasicMaterial({
    color: 0x6ee7b7,
    transparent: true,
    opacity: 0.26,
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
    const blurDisc = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.47, 28), blurDiscMat)
    blurDisc.rotation.x = -Math.PI / 2
    rotorHub.add(bladeA, bladeB, blurDisc)
    group.add(rotorHub)
    rotors.push(rotorHub)

    // Front arms mint-green LED, rear arms amber-red LED
    const isFront = idx === 0 || idx === 3
    const ledMat = new THREE.MeshBasicMaterial({
      color: isFront ? 0x65dfba : 0xf97316,
    })
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), ledMat)
    led.position.set(tipX, 0.02, tipZ)
    group.add(led)
    navLeds.push(led)
  })

  // Under-belly optical gimbal + glowing lens
  const gimbal = new THREE.Group()
  gimbal.position.set(0, -0.22, 0.34)
  const housing = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 18, 18),
    darkMetalMat,
  )
  const lensRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.12, 18),
    accentMat,
  )
  lensRing.rotation.x = Math.PI / 2
  lensRing.position.set(0, -0.02, 0.12)
  gimbal.add(housing, lensRing)
  group.add(gimbal)

  // Volumetric LiDAR scan cone beneath gimbal
  const beamGeo = new THREE.ConeGeometry(1.75, 2.35, 32, 1, true)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const scanBeam = new THREE.Mesh(beamGeo, beamMat)
  scanBeam.position.set(0, -1.35, 0.34)
  group.add(scanBeam)

  return { group, rotors, gimbal, scanBeam, navLeds }
}

function buildTerrainAndSite(): {
  group: THREE.Group
  scanRing: THREE.Mesh
  waypoints: THREE.Mesh[]
  flightCurve: THREE.CatmullRomCurve3
} {
  const group = new THREE.Group()

  // Procedural topographic grid mesh
  const planeGeo = new THREE.PlaneGeometry(16, 16, 44, 44)
  planeGeo.rotateX(-Math.PI / 2)
  const pos = planeGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const dist = Math.hypot(x, z)
    const ridge =
      Math.sin(x * 0.45) * Math.cos(z * 0.45) * 0.35 +
      Math.max(0, (dist - 3.6) * 0.16)
    pos.setY(i, ridge - 0.15)
  }
  planeGeo.computeVertexNormals()

  const terrainWire = new THREE.Mesh(
    planeGeo,
    new THREE.MeshBasicMaterial({
      color: 0x52b788,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    }),
  )
  group.add(terrainWire)

  const terrainSolid = new THREE.Mesh(
    planeGeo,
    new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.82,
      metalness: 0.04,
    }),
  )
  terrainSolid.position.y = -0.02
  group.add(terrainSolid)

  // Architectural industrial structures (bright concrete + amber roof edge + vivid sapphire solar arrays)
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0xdbe4ee,
    roughness: 0.44,
    metalness: 0.1,
  })
  const buildingEdgeMat = new THREE.LineBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.75,
  })
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    emissive: 0x2563eb,
    emissiveIntensity: 0.48,
    roughness: 0.2,
    metalness: 0.22,
  })

  const blocks: [number, number, number, number, number, number][] = [
    [-1.4, 0.24, -0.8, 2.2, 0.55, 1.4],
    [1.35, 0.18, -0.4, 1.8, 0.42, 1.6],
    [-0.1, 0.15, 1.45, 2.5, 0.36, 1.05],
  ]

  for (const [x, y, z, w, h, d] of blocks) {
    const boxGeo = new THREE.BoxGeometry(w, h, d)
    const b = new THREE.Mesh(boxGeo, buildingMat)
    b.position.set(x, y, z)
    group.add(b)

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeo),
      buildingEdgeMat,
    )
    edges.position.set(x, y, z)
    group.add(edges)

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.82, 0.03, d * 0.72),
      solarMat,
    )
    panel.position.set(x, y + h / 2 + 0.025, z)
    group.add(panel)
  }

  // Glowing ground lidar scan ring
  const scanRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.35, 48),
    new THREE.MeshBasicMaterial({
      color: 0x65dfba,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  scanRing.rotation.x = -Math.PI / 2
  scanRing.position.y = 0.08
  group.add(scanRing)

  // Glowing 3D flight spline path + inspection waypoint beacons
  const flightCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-2.6, 2.0, -1.6),
      new THREE.Vector3(0.1, 2.25, -2.0),
      new THREE.Vector3(2.4, 1.95, -0.2),
      new THREE.Vector3(1.5, 2.15, 2.1),
      new THREE.Vector3(-1.8, 2.0, 1.8),
    ],
    true,
  )
  const curvePoints = flightCurve.getPoints(96)
  const pathGeo = new THREE.BufferGeometry().setFromPoints(curvePoints)
  const pathLine = new THREE.Line(
    pathGeo,
    new THREE.LineBasicMaterial({
      color: 0x7de7c7,
      transparent: true,
      opacity: 0.85,
    }),
  )
  group.add(pathLine)

  const waypoints: THREE.Mesh[] = []
  const wpPositions: [number, number, number][] = [
    [-1.4, 0.75, -0.8],
    [1.35, 0.62, -0.4],
    [-0.1, 0.56, 1.45],
  ]
  const wpMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
  for (const [x, y, z] of wpPositions) {
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), wpMat)
    beacon.position.set(x, y, z)
    group.add(beacon)
    waypoints.push(beacon)
  }

  return { group, scanRing, waypoints, flightCurve }
}

/**
 * Interactive WebGL Three.js 3D Drone Inspection Diorama.
 * Features pointer-driven 3D camera orbit, 4 animated mission viewpoints,
 * a sculpted quadcopter with spinning rotors & volumetric LiDAR scan cone,
 * offscreen auto-pause, reduced-motion safety, and complete resource disposal.
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
  const [webglReady, setWebglReady] = useState(true)
  const activeIndexRef = useRef(0)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

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
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setWebglReady(false)
      return
    }

    const width = mount.clientWidth || 720
    const height = mount.clientHeight || 480
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x1e4560, 0.014)

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60)
    camera.position.set(...CAMERA_RIGS[0].pos)

    // Balanced daylight-studio 3-point lighting (clear shading, no blow-out)
    const ambient = new THREE.AmbientLight(0xdbeafe, 0.75)
    const hemi = new THREE.HemisphereLight(0xf0f9ff, 0x1e3a4c, 1.15)
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.9)
    keyLight.position.set(6, 10, 6)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9)
    fillLight.position.set(-7, 6, 4)
    const rimLight = new THREE.PointLight(0x34d399, 5, 18)
    rimLight.position.set(-4, 4.5, -3)
    scene.add(ambient, hemi, keyLight, fillLight, rimLight)

    const drone = buildIndustrialDrone()
    drone.group.position.set(0, 2.05, 0)
    scene.add(drone.group)

    const terrain = buildTerrainAndSite()
    scene.add(terrain.group)

    // Floating atmospheric dust/telemetry particles
    const particleCount = 120
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 14
      particlePositions[i * 3 + 1] = Math.random() * 5.2 + 0.3
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3),
    )
    const particleMat = new THREE.PointsMaterial({
      color: 0x65dfba,
      size: 0.045,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Pointer orbit offset (smoothly damped)
    let pointerX = 0
    let pointerY = 0
    let dragYaw = 0
    let dragPitch = 0
    let isDragging = false
    let lastClientX = 0
    let lastClientY = 0

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      lastClientX = e.clientX
      lastClientY = e.clientY
    }
    const onPointerMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
        pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      }
      if (isDragging) {
        dragYaw += (e.clientX - lastClientX) * 0.0055
        dragPitch = Math.max(
          -0.45,
          Math.min(0.45, dragPitch + (e.clientY - lastClientY) * 0.004),
        )
        lastClientX = e.clientX
        lastClientY = e.clientY
      }
    }
    const onPointerUp = () => {
      isDragging = false
    }

    const domEl = renderer.domElement
    domEl.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)

    const onContextLost = (e: Event) => {
      e.preventDefault()
      setWebglReady(false)
    }
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

    const desiredPos = new THREE.Vector3()
    const currentTarget = new THREE.Vector3(...CAMERA_RIGS[0].target)
    const desiredTarget = new THREE.Vector3()
    const targetColor = new THREE.Color()
    const clock = new THREE.Clock()
    let rafId = 0

    const animate = () => {
      rafId = window.requestAnimationFrame(animate)
      if (!inView || document.hidden) return

      const dt = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.elapsedTime
      const rig = CAMERA_RIGS[activeIndexRef.current] ?? CAMERA_RIGS[0]

      // Spin all 4 rotors smoothly
      drone.rotors.forEach((r, idx) => {
        r.rotation.y += dt * (idx % 2 === 0 ? 34 : -34)
      })

      // Gentle flight hover + subtle roll/pitch along inspection corridor
      const hoverX = Math.sin(elapsed * 0.55) * 0.42
      const hoverZ = Math.cos(elapsed * 0.42) * 0.36
      const hoverY = rig.droneY + Math.sin(elapsed * 1.6) * 0.08
      drone.group.position.x += (hoverX - drone.group.position.x) * 0.06
      drone.group.position.z += (hoverZ - drone.group.position.z) * 0.06
      drone.group.position.y += (hoverY - drone.group.position.y) * 0.06
      drone.group.rotation.z = -hoverX * 0.14
      drone.group.rotation.x = hoverZ * 0.12
      drone.group.rotation.y = Math.sin(elapsed * 0.35) * 0.25

      // Gimbal keeps scanning below
      drone.gimbal.rotation.y = Math.sin(elapsed * 0.9) * 0.35

      // Pulse ground lidar ring & color shift per mode
      const pulse = 1 + Math.sin(elapsed * 2.2) * 0.14
      terrain.scanRing.scale.set(pulse, pulse, 1)
      terrain.scanRing.position.x = drone.group.position.x
      terrain.scanRing.position.z = drone.group.position.z + 0.34

      targetColor.setHex(rig.scanColor)
      ;(drone.scanBeam.material as THREE.MeshBasicMaterial).color.lerp(
        targetColor,
        0.08,
      )
      ;(terrain.scanRing.material as THREE.MeshBasicMaterial).color.lerp(
        targetColor,
        0.08,
      )

      // Rotate inspection waypoint beacons
      terrain.waypoints.forEach((wp, i) => {
        wp.rotation.y = elapsed * 1.4 + i
        wp.position.y += Math.sin(elapsed * 2.4 + i) * 0.0012
      })

      particles.rotation.y = elapsed * 0.03

      // Smoothly interpolate camera rig + pointer parallax + user drag orbit
      const basePos = new THREE.Vector3(...rig.pos)
      const radius = Math.hypot(basePos.x, basePos.z)
      const baseAngle = Math.atan2(basePos.x, basePos.z)
      const orbitAngle = baseAngle + dragYaw + pointerX * 0.22
      desiredPos.set(
        Math.sin(orbitAngle) * radius,
        Math.max(1.1, basePos.y - pointerY * 0.45 + dragPitch * 2.2),
        Math.cos(orbitAngle) * radius,
      )
      camera.position.lerp(desiredPos, 0.055)

      desiredTarget.set(...rig.target)
      currentTarget.lerp(desiredTarget, 0.07)
      camera.lookAt(currentTarget)

      renderer.render(scene, camera)
    }

    rafId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      domEl.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      domEl.removeEventListener('webglcontextlost', onContextLost)

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
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
  }, [])

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

            <div className="lp3-stage3d-hud-top" aria-hidden="true">
              <span className="lp3-stage3d-live">
                <span className="lp3-stage3d-live-dot" />
                THREE.JS · INTERACTIVE 3D
              </span>
              <span className="lp3-stage3d-drag">{dragHint}</span>
            </div>

            {activePreset && (
              <div className="lp3-stage3d-hud-bottom">
                <div className="lp3-stage3d-metric">
                  <span>{activePreset.metricLabel}</span>
                  <strong>{activePreset.metricValue}</strong>
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
