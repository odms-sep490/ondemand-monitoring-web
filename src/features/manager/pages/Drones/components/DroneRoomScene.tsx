import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import type { AvailableDrone } from '../../../../staff/api/droneApi'
import { CORE_DRONE_PADS, getDroneRoomExtent, getExpansionPadPosition } from './droneRoomLayout'
import './droneRoom.scss'

type Props = {
  drones: AvailableDrone[]
  selectedDroneId: string | null
  onSelect: (droneId: string) => void
  label: string
  fallbackMessage: string
  loadingMessage: string
}

type DroneModel = {
  root: THREE.Group
  materials: THREE.Material[]
}

type SceneRuntime = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  template: THREE.Object3D
  pads: Map<number, THREE.Object3D>
  expansionPads: Map<number, THREE.Object3D>
  labels: Map<number, THREE.Sprite>
  models: Map<string, DroneModel>
  selectedRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
  expansionFloor: THREE.Group | null
  layoutCount: number
  viewExtent: number
  render: () => void
  syncDrones: () => void
  detach: () => void
}

const ROOM_ASSET = `${import.meta.env.BASE_URL}models/drone-assignment/drone-assignment-room.glb`

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

function cloneDrone(template: THREE.Object3D, droneId: string, pad: THREE.Object3D): DroneModel {
  const root = new THREE.Group()
  root.name = `drone-slot-${droneId}`
  root.userData.droneId = droneId
  root.scale.setScalar(0.76)

  const anchor = pad.getWorldPosition(new THREE.Vector3())
  root.position.copy(anchor).add(new THREE.Vector3(0, 0.07, 0))

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

  return { root, materials: clonedMaterials }
}

function createRenderer() {
  return new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
    powerPreference: 'low-power',
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
  canvas.width = 192
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = 'rgba(23, 54, 91, 0.94)'
  context.strokeStyle = 'rgba(138, 184, 236, 0.95)'
  context.lineWidth = 5
  context.beginPath()
  context.roundRect(10, 10, 172, 76, 28)
  context.fill()
  context.stroke()
  context.fillStyle = '#ffffff'
  context.font = '700 42px Inter, Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(String(slot).padStart(2, '0'), 96, 49)

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
  label.scale.set(0.68, 0.34, 1)
  label.position.copy(position)
  label.position.y += 0.46
  if (inward) {
    label.position.x += inward.x * 0.95
    label.position.z += inward.y * 0.95
  } else {
    label.position.z += 0.92
  }
  label.renderOrder = 3
  return label
}

function createExpansionFloor(radius: number) {
  const group = new THREE.Group()
  group.name = 'DRONE_ROOM_EXPANSION_FLOOR'
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(8.35, radius, 128),
    new THREE.MeshStandardMaterial({
      color: '#dce9f8',
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0.051
  floor.receiveShadow = true
  group.add(floor)

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 0.06, 0.045, 8, 128),
    new THREE.MeshBasicMaterial({ color: '#7eb2ef', transparent: true, opacity: 0.8 }),
  )
  edge.rotation.x = Math.PI / 2
  edge.position.y = 0.08
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
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<SceneRuntime | null>(null)
  const dronesRef = useRef(drones)
  const selectedDroneIdRef = useRef(selectedDroneId)
  const onSelectRef = useRef(onSelect)
  const [sceneLoading, setSceneLoading] = useState(true)
  const [sceneError, setSceneError] = useState(false)

  dronesRef.current = drones
  selectedDroneIdRef.current = selectedDroneId
  onSelectRef.current = onSelect

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let runtime: SceneRuntime | null = null
    let resizeObserver: ResizeObserver | null = null
    let pointerOrigin: { x: number; y: number } | null = null

    try {
      const renderer = createRenderer()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.setClearColor('#edf5ff', 1)
      renderer.domElement.setAttribute('aria-hidden', 'true')
      renderer.domElement.className = 'mgr-office-drone-canvas'
      host.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#edf5ff')
      const camera = new THREE.OrthographicCamera(-7, 7, 6.3, -6.3, 0.1, 80)
      camera.position.set(4.2, 14, 16)
      camera.lookAt(0, 1, 0)

      scene.add(new THREE.HemisphereLight('#ffffff', '#9fb9d7', 1.65))
      const keyLight = new THREE.DirectionalLight('#ffffff', 2.1)
      keyLight.position.set(-6, 11, 8)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.set(1024, 1024)
      keyLight.shadow.camera.left = -9
      keyLight.shadow.camera.right = 9
      keyLight.shadow.camera.top = 9
      keyLight.shadow.camera.bottom = -9
      keyLight.shadow.bias = -0.0002
      scene.add(keyLight)

      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap

      const selectedRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.42, 0.04, 8, 64),
        new THREE.MeshBasicMaterial({
          color: '#1473e6',
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        }),
      )
      selectedRing.rotation.x = Math.PI / 2
      selectedRing.visible = false
      selectedRing.renderOrder = 2
      scene.add(selectedRing)

      const render = () => {
        if (!disposed) renderer.render(scene, camera)
      }

      runtime = {
        renderer,
        scene,
        camera,
        template: new THREE.Group(),
        pads: new Map(),
        expansionPads: new Map(),
        labels: new Map(),
        models: new Map(),
        selectedRing,
        expansionFloor: null,
        layoutCount: -1,
        viewExtent: 8.4,
        render,
        syncDrones: () => {},
        detach: () => {},
      }
      runtimeRef.current = runtime

      const resize = () => {
        const width = host.clientWidth
        const height = host.clientHeight
        if (width < 1 || height < 1) return
        const aspect = width / height
        const viewHeight = Math.max(12.2, 13.8 / aspect, runtime!.viewExtent * 2 / aspect, runtime!.viewExtent * 1.45)
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
        return typeof object?.userData.droneId === 'string' ? object.userData.droneId as string : null
      }

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return
        pointerOrigin = { x: event.clientX, y: event.clientY }
      }
      const onPointerUp = (event: PointerEvent) => {
        if (!pointerOrigin) return
        const moved = Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y)
        pointerOrigin = null
        if (moved > 8) return
        const droneId = findDroneAt(event)
        if (droneId) onSelectRef.current(droneId)
      }
      const onPointerMove = (event: PointerEvent) => {
        renderer.domElement.style.cursor = findDroneAt(event) ? 'pointer' : 'default'
      }
      renderer.domElement.addEventListener('pointerdown', onPointerDown)
      renderer.domElement.addEventListener('pointerup', onPointerUp)
      renderer.domElement.addEventListener('pointermove', onPointerMove)

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
          const label = createPadLabel(index + 1, anchor)
          if (!label) continue
          scene.add(label)
          runtime.labels.set(index, label)
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

            const shadowExtent = runtime.viewExtent + 2
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

            let label = runtime.labels.get(CORE_DRONE_PADS + extraIndex)
            if (!label) {
              const anchor = pad.getWorldPosition(new THREE.Vector3())
              const inward = new THREE.Vector2(-position.x, -position.z).normalize()
              label = createPadLabel(CORE_DRONE_PADS + extraIndex + 1, anchor, inward) ?? undefined
              if (label) {
                scene.add(label)
                runtime.labels.set(CORE_DRONE_PADS + extraIndex, label)
              }
            }
            if (label) label.visible = true
          }
          for (const [extraIndex, pad] of runtime.expansionPads) {
            if (extraIndex >= extraCount) pad.visible = false
          }
          for (const [slot, label] of runtime.labels) {
            if (slot >= CORE_DRONE_PADS && slot >= wanted.length) label.visible = false
          }

          const wantedIds = new Set(wanted.map((drone) => drone.id))
          for (const [droneId, model] of runtime.models) {
            if (wantedIds.has(droneId)) continue
            runtime.scene.remove(model.root)
            model.materials.forEach((material) => material.dispose())
            runtime.models.delete(droneId)
          }

          wanted.forEach((drone, index) => {
            let model = runtime?.models.get(drone.id)
            const pad = index < CORE_DRONE_PADS
              ? runtime?.pads.get(index)
              : runtime?.expansionPads.get(index - CORE_DRONE_PADS)
            if (!runtime || !pad) return
            if (!model) {
              model = cloneDrone(runtime.template, drone.id, pad)
              runtime.models.set(drone.id, model)
              runtime.scene.add(model.root)
            }
            const anchor = pad.getWorldPosition(new THREE.Vector3())
            model.root.position.copy(anchor).add(new THREE.Vector3(0, 0.07, 0))
          })

          const selectedModel = selectedDroneIdRef.current
            ? runtime.models.get(selectedDroneIdRef.current)
            : undefined
          runtime.selectedRing.visible = Boolean(selectedModel)
          if (selectedModel) {
            runtime.selectedRing.position.copy(selectedModel.root.position)
            runtime.selectedRing.position.y += 0.17
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

      // Keep teardown handles alongside the runtime without recreating the renderer for API updates.
      runtime.detach = () => {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown)
        renderer.domElement.removeEventListener('pointerup', onPointerUp)
        renderer.domElement.removeEventListener('pointermove', onPointerMove)
      }
    } catch {
      setSceneLoading(false)
      setSceneError(true)
    }

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      const active = runtimeRef.current
      if (active) {
        active.detach()
        active.models.forEach((model) => model.materials.forEach((material) => material.dispose()))
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
    const selectedModel = selectedDroneId ? runtime.models.get(selectedDroneId) : undefined
    runtime.selectedRing.visible = Boolean(selectedModel)
    if (selectedModel) {
      runtime.selectedRing.position.copy(selectedModel.root.position)
      runtime.selectedRing.position.y += 0.17
    }
    runtime.render()
  }, [selectedDroneId])

  return (
    <div className="mgr-office-drone-scene-wrap" role="region" aria-label={label}>
      <div ref={hostRef} className="mgr-office-drone-scene" aria-hidden="true" />
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
