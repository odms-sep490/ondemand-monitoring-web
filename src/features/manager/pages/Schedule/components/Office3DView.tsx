import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  HomeOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  TeamOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  AimOutlined,
  CompressOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Alert, Button, Empty, Select, Skeleton, Tag, Tooltip } from 'antd'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import type { MissionCalendarItem } from '../../../types/missions'
import type { MissionStatus } from '../../../../../shared/types/domain'
import './office3d.scss'

type OfficePerson = {
  id: string
  name: string
  email: string | null
  roles: string[]
  isManager: boolean
  missions: Array<{
    id: string
    code: string
    title: string | null
    device: string | null
    status: MissionStatus
  }>
}

type ManagerIdentity = Pick<AvailableOperator, 'id' | 'fullName' | 'email'>

type Room = {
  id: string
  vi: string
  en: string
  x: number
  z: number
  rotationY: number
  kind: 'meeting' | 'dispatch' | 'pantry' | 'planning' | 'lounge' | 'studio' | 'technical' | 'inspection' | 'storage'
}

type OfficeAvatar = {
  personId: string
  root: THREE.Group
  mixer: THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  seat: THREE.Vector3
  sitHipOffset: THREE.Vector3
  room: Room
  state: 'sitting' | 'waiting-for-break' | 'standing' | 'walking-to-break' | 'on-break' | 'standing-from-break' | 'returning'
  stateTime: number
  waitTime: number
  path: THREE.Vector3[]
  pathIndex: number
  color: string
  halo: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  label: THREE.Sprite | null
  currentAction: THREE.AnimationAction | null
  animationKeys: { idle?: string; walk?: string; sit?: string; stand?: string }
}

type SceneHandle = {
  renderer: THREE.WebGLRenderer
  camera: THREE.OrthographicCamera
  controls: OrbitControls
  scene: THREE.Scene
  roomFloors: Map<string, THREE.Mesh>
  staffAnchors: Map<string, THREE.Vector3>
  avatarRoots: Map<string, THREE.Group>
  render: () => void
  reset: () => void
  focusPerson: (personId: string | null) => void
  focusRoom: (roomId: string | null) => void
  setFollowPerson: (personId: string | null) => void
  setAnimationsPaused: (paused: boolean) => void
  dispose: () => void
}

const ROOMS: Room[] = [
  { id: 'meeting', vi: 'Phòng họp', en: 'Meeting room', x: -5.5, z: -4.7, rotationY: 0, kind: 'meeting' },
  { id: 'dispatch', vi: 'Điều phối bay', en: 'Flight dispatch', x: 0, z: -4.7, rotationY: 0, kind: 'dispatch' },
  { id: 'pantry', vi: 'Khu pantry', en: 'Pantry', x: 5.5, z: -4.7, rotationY: 0, kind: 'pantry' },
  { id: 'planning', vi: 'Văn phòng quản lý', en: 'Manager office', x: -5.5, z: 0, rotationY: Math.PI / 2, kind: 'planning' },
  { id: 'lounge', vi: 'Sảnh trung tâm', en: 'Central lounge', x: 0, z: 0, rotationY: 0, kind: 'lounge' },
  { id: 'studio', vi: 'Phòng thiết kế', en: 'Design studio', x: 5.5, z: 0, rotationY: -Math.PI / 2, kind: 'studio' },
  { id: 'technical', vi: 'Kỹ thuật', en: 'Engineering', x: -5.5, z: 4.7, rotationY: Math.PI, kind: 'technical' },
  { id: 'inspection', vi: 'Kiểm tra thiết bị', en: 'Device inspection', x: 0, z: 4.7, rotationY: Math.PI, kind: 'inspection' },
  { id: 'storage', vi: 'Kho thiết bị', en: 'Equipment storage', x: 5.5, z: 4.7, rotationY: Math.PI, kind: 'storage' },
]

const PERSON_COLORS = ['#3978eb', '#16a085', '#9b59b6', '#e18c35', '#1f9b71', '#de6a64', '#3e91b8', '#8b73c7']
const ROOM_SIZE = { width: 3.48, depth: 2.92 }
const ROOM_SCALE = 1.25
const CORRIDOR_X = [-2.8, 2.8] as const
const CORRIDOR_Z = [-2.4, 2.4] as const

let characterModelsPromise: Promise<[THREE.Group, THREE.Group]> | null = null

function loadOfficeCharacters() {
  if (!characterModelsPromise) {
    const loader = new FBXLoader()
    characterModelsPromise = Promise.all([
      loader.loadAsync(`${import.meta.env.BASE_URL}assets/office/casual-male.fbx`),
      loader.loadAsync(`${import.meta.env.BASE_URL}assets/office/casual-female.fbx`),
    ])
  }
  return characterModelsPromise
}

function roomWorldPosition(room: Room, x: number, z: number) {
  const local = new THREE.Vector3(x * ROOM_SCALE, 0, z * ROOM_SCALE)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), room.rotationY)
  return new THREE.Vector3(room.x + local.x, 0, room.z + local.z)
}

function fitOfficeCamera(camera: THREE.OrthographicCamera, aspect: number, target: THREE.Vector3) {
  const forward = camera.getWorldDirection(new THREE.Vector3()).normalize()
  const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize()
  const up = right.clone().cross(forward).normalize()
  const min = new THREE.Vector3(-8.65, -0.36, -7.4)
  const max = new THREE.Vector3(8.65, 2.8, 7.4)
  let halfWidth = 0
  let halfHeight = 0
  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) {
        const offset = new THREE.Vector3(x, y, z).sub(target)
        halfWidth = Math.max(halfWidth, Math.abs(offset.dot(right)))
        halfHeight = Math.max(halfHeight, Math.abs(offset.dot(up)))
      }
    }
  }
  const paddedHalfHeight = Math.max(halfHeight, halfWidth / aspect) / 0.91
  camera.left = -paddedHalfHeight * aspect
  camera.right = paddedHalfHeight * aspect
  camera.top = paddedHalfHeight
  camera.bottom = -paddedHalfHeight
  camera.updateProjectionMatrix()
}

function colorForPerson(id: string) {
  return PERSON_COLORS[stablePersonOffset(id, PERSON_COLORS.length)]
}

function stablePersonOffset(id: string, range: number) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash) % range
}

function createLabel(text: string, background: string, foreground = '#19314f') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 144
  const context = canvas.getContext('2d')
  if (!context) return null

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = background
  context.beginPath()
  context.roundRect(8, 18, 496, 108, 32)
  context.fill()
  context.fillStyle = foreground
  context.font = '600 46px Inter, Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const clipped = text.length > 20 ? `${text.slice(0, 19)}…` : text
  context.fillText(clipped, 256, 72, 440)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.55, 0.44, 1)
  return sprite
}

function makeOfficeScene(
  host: HTMLDivElement,
  people: OfficePerson[],
  lang: string,
  onRoomClick: (roomId: string) => void,
  onPersonClick: (personId: string) => void,
): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.className = 'office3d-canvas'
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute(
    'aria-label',
    lang === 'en'
      ? 'Interactive 3D operations office. Use the camera buttons or drag to explore; choose a room or assigned staff member to see details.'
      : 'Văn phòng điều phối 3D tương tác. Dùng nút điều khiển hoặc kéo để quan sát; chọn phòng hoặc nhân sự để xem thông tin.',
  )
  renderer.domElement.tabIndex = 0
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#eaf3fc')
  const camera = new THREE.OrthographicCamera(-9, 9, 9, -9, 0.1, 100)
  const initialPosition = new THREE.Vector3(18, 21, 24)
  const initialTarget = new THREE.Vector3(0, 0.75, 0)
  camera.position.copy(initialPosition)
  camera.lookAt(initialTarget)
  camera.updateMatrixWorld()
  fitOfficeCamera(camera, Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1), initialTarget)
  camera.zoom = 1
  camera.updateProjectionMatrix()

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.copy(initialTarget)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = true
  controls.enableRotate = true
  controls.minPolarAngle = 0.66
  controls.maxPolarAngle = 1.28
  controls.minAzimuthAngle = -Math.PI * 0.78
  controls.maxAzimuthAngle = Math.PI * 0.78
  controls.minZoom = 0.74
  controls.maxZoom = 4.2
  controls.screenSpacePanning = true

  scene.add(new THREE.HemisphereLight('#ffffff', '#b7c6d7', 2.35))
  const keyLight = new THREE.DirectionalLight('#fff4dc', 3.3)
  keyLight.position.set(-8, 15, 10)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  keyLight.shadow.camera.left = -12
  keyLight.shadow.camera.right = 12
  keyLight.shadow.camera.top = 12
  keyLight.shadow.camera.bottom = -12
  keyLight.shadow.bias = -0.0002
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight('#cce1ff', 1.3)
  fillLight.position.set(9, 7, -8)
  scene.add(fillLight)

  const mats = {
    platform: new THREE.MeshStandardMaterial({ color: '#263b55', roughness: 0.74 }),
    floor: new THREE.MeshStandardMaterial({ color: '#f5f7f8', roughness: 0.9 }),
    floorAlt: new THREE.MeshStandardMaterial({ color: '#e9f1f5', roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: '#fcfdff', roughness: 0.82 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#b7d9ef', roughness: 0.28, metalness: 0.08, transparent: true, opacity: 0.32, depthWrite: false }),
    frame: new THREE.MeshStandardMaterial({ color: '#93adc4', metalness: 0.62, roughness: 0.36 }),
    trim: new THREE.MeshStandardMaterial({ color: '#d9e6f1', metalness: 0.24, roughness: 0.5 }),
    wood: new THREE.MeshStandardMaterial({ color: '#c28a5a', roughness: 0.66 }),
    woodLight: new THREE.MeshStandardMaterial({ color: '#dfb98d', roughness: 0.65 }),
    navy: new THREE.MeshStandardMaterial({ color: '#34516f', roughness: 0.68 }),
    chair: new THREE.MeshStandardMaterial({ color: '#527ca4', roughness: 0.6 }),
    screen: new THREE.MeshStandardMaterial({ color: '#273f56', metalness: 0.1, roughness: 0.28, emissive: '#225873', emissiveIntensity: 0.35 }),
    plant: new THREE.MeshStandardMaterial({ color: '#3a9b75', roughness: 0.8 }),
    plantLight: new THREE.MeshStandardMaterial({ color: '#77bd8f', roughness: 0.8 }),
    pot: new THREE.MeshStandardMaterial({ color: '#e4b38f', roughness: 0.8 }),
    stone: new THREE.MeshStandardMaterial({ color: '#d6e0e8', roughness: 0.86 }),
    accentBlue: new THREE.MeshStandardMaterial({ color: '#3980eb', roughness: 0.62 }),
    white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.76 }),
  }

  const geometries: THREE.BufferGeometry[] = []
  const ownedMaterials = new Set<THREE.Material>(Object.values(mats))
  const roomFloors = new Map<string, THREE.Mesh>()
  const staffAnchors = new Map<string, THREE.Vector3>()
  const avatarRoots = new Map<string, THREE.Group>()
  const avatars = new Map<string, OfficeAvatar>()
  const clickables: THREE.Object3D[] = []
  let disposed = false
  let animationFrame = 0
  let wakeTimer = 0
  let previousFrameTime = 0
  let animationsPaused = false
  let followPersonId: string | null = null
  let pendingFocusPersonId: string | null = null
  let cameraTween: {
    fromPosition: THREE.Vector3
    toPosition: THREE.Vector3
    fromTarget: THREE.Vector3
    toTarget: THREE.Vector3
    fromZoom: number
    toZoom: number
    elapsed: number
    duration: number
  } | null = null

  const addBox = (
    parent: THREE.Object3D,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    options: { cast?: boolean; receive?: boolean; clickData?: Record<string, string> } = {},
  ) => {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = options.cast ?? true
    mesh.receiveShadow = options.receive ?? true
    if (options.clickData) {
      Object.assign(mesh.userData, options.clickData)
      clickables.push(mesh)
    }
    parent.add(mesh)
    return mesh
  }

  const addCylinder = (
    parent: THREE.Object3D,
    topRadius: number,
    bottomRadius: number,
    height: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    segments = 12,
  ) => {
    const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments)
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  const addSphere = (parent: THREE.Object3D, radius: number, x: number, y: number, z: number, material: THREE.Material) => {
    const geometry = new THREE.SphereGeometry(radius, 14, 10)
    geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }

  // A two-layer plinth makes the open-top office read as one architectural model.
  addBox(scene, 17.1, 0.28, 14.6, 0, -0.18, 0, mats.platform)
  addBox(scene, 16.94, 0.12, 14.42, 0, 0.02, 0, mats.floor)
  addBox(scene, 16.62, 0.035, 14.08, 0, 0.092, 0, mats.floorAlt, { cast: false })
  // Thin brass-blue edge detail around the floor slab.
  addBox(scene, 17.06, 0.045, 0.04, 0, 0.18, 7.22, mats.trim, { cast: false })
  addBox(scene, 17.06, 0.045, 0.04, 0, 0.18, -7.22, mats.trim, { cast: false })
  addBox(scene, 0.04, 0.045, 14.45, 8.52, 0.18, 0, mats.trim, { cast: false })
  addBox(scene, 0.04, 0.045, 14.45, -8.52, 0.18, 0, mats.trim, { cast: false })

  // A quiet inlay marks the clear circulation cross between the room entrances.
  addBox(scene, 0.08, 0.018, 9.65, -2.8, 0.126, 0, mats.trim, { cast: false })
  addBox(scene, 0.08, 0.018, 9.65, 2.8, 0.126, 0, mats.trim, { cast: false })
  addBox(scene, 11.1, 0.018, 0.08, 0, 0.126, -2.4, mats.trim, { cast: false })
  addBox(scene, 11.1, 0.018, 0.08, 0, 0.126, 2.4, mats.trim, { cast: false })

  const addPlant = (parent: THREE.Object3D, x: number, z: number, scale = 1) => {
    addCylinder(parent, 0.17 * scale, 0.21 * scale, 0.31 * scale, x, 0.28 * scale, z, mats.pot, 12)
    addCylinder(parent, 0.2 * scale, 0.2 * scale, 0.035 * scale, x, 0.44 * scale, z, mats.woodLight, 12)
    addCylinder(parent, 0.025 * scale, 0.035 * scale, 0.36 * scale, x, 0.61 * scale, z, mats.plant, 7)
    for (const [dx, dz, height] of [[0.12, 0, 0.64], [-0.1, 0.04, 0.72], [0.03, -0.12, 0.69], [-0.07, -0.09, 0.61]] as const) {
      const leaf = addSphere(parent, 0.15 * scale, x + dx * scale, height * scale, z + dz * scale, mats.plantLight)
      leaf.scale.set(0.78, 1.18, 0.72)
    }
  }

  const addDesk = (parent: THREE.Object3D, x: number, z: number, width = 1.45, depth = 0.72) => {
    addBox(parent, width, 0.11, depth, x, 0.79, z, mats.wood)
    for (const dx of [-width / 2 + 0.1, width / 2 - 0.1]) {
      for (const dz of [-depth / 2 + 0.09, depth / 2 - 0.09]) {
        addBox(parent, 0.075, 0.73, 0.075, x + dx, 0.4, z + dz, mats.navy)
      }
    }
    addBox(parent, 0.65, 0.39, 0.055, x, 1.06, z - depth * 0.23, mats.navy)
    addBox(parent, 0.6, 0.32, 0.025, x, 1.065, z - depth * 0.23 - 0.02, mats.screen, { cast: false })
    addBox(parent, 0.12, 0.12, 0.12, x, 0.88, z - depth * 0.23, mats.frame)
    addBox(parent, 0.26, 0.035, 0.18, x + width * 0.3, 0.865, z + depth * 0.2, mats.white, { cast: false })
  }

  const addChair = (parent: THREE.Object3D, x: number, z: number, material = mats.chair, seatTop = 0.55) => {
    const seatThickness = 0.14
    const postHeight = seatTop - 0.13
    addCylinder(parent, 0.28, 0.29, seatThickness, x, seatTop - seatThickness / 2, z, material)
    addBox(parent, 0.53, 0.54, 0.12, x, seatTop + 0.21, z + 0.2, material)
    addCylinder(parent, 0.055, 0.07, postHeight, x, postHeight / 2 + 0.01, z, mats.frame, 8)
    for (const [dx, dz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]] as const) {
      addCylinder(parent, 0.035, 0.04, 0.04, x + dx, 0.035, z + dz, mats.navy, 8)
    }
  }

  const roomTitle = (room: Room) => (lang === 'en' ? room.en : room.vi)

  for (const [index, room] of ROOMS.entries()) {
    const group = new THREE.Group()
    group.position.set(room.x, 0, room.z)
    group.rotation.y = room.rotationY
    group.scale.set(ROOM_SCALE, 1, ROOM_SCALE)
    group.userData.roomId = room.id
    scene.add(group)

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: index % 2 === 0 ? '#f6f7f5' : '#eff4f6',
      roughness: 0.89,
    })
    ownedMaterials.add(floorMaterial)
    const floor = addBox(group, ROOM_SIZE.width, 0.1, ROOM_SIZE.depth, 0, 0.16, 0, floorMaterial, {
      clickData: { roomId: room.id },
    })
    roomFloors.set(room.id, floor)

    // Glass partitions with open doorways keep room boundaries visible without hiding the furniture.
    addBox(group, ROOM_SIZE.width, 2.02, 0.075, 0, 1.19, -ROOM_SIZE.depth / 2, mats.glass)
    addBox(group, 0.075, 2.02, ROOM_SIZE.depth, -ROOM_SIZE.width / 2, 1.19, 0, mats.glass)
    addBox(group, ROOM_SIZE.width, 0.075, 0.075, 0, 2.23, -ROOM_SIZE.depth / 2, mats.frame)
    addBox(group, 0.075, 0.075, ROOM_SIZE.depth, -ROOM_SIZE.width / 2, 2.23, 0, mats.frame)
    for (const dx of [-1.05, 0, 1.05]) {
      addBox(group, 0.045, 2, 0.06, dx, 1.19, -ROOM_SIZE.depth / 2, mats.frame)
    }
    addBox(group, 0.06, 2, 0.045, -ROOM_SIZE.width / 2, 1.19, -0.36, mats.frame)
    // Low front divider and threshold: the open side faces the viewer.
    addBox(group, 1.2, 0.66, 0.06, -1.14, 0.53, ROOM_SIZE.depth / 2, mats.glass)
    addBox(group, 1.2, 0.66, 0.06, 1.14, 0.53, ROOM_SIZE.depth / 2, mats.glass)
    addBox(group, 0.065, 0.69, 0.08, -1.75, 0.54, ROOM_SIZE.depth / 2, mats.frame)
    addBox(group, 0.065, 0.69, 0.08, 1.75, 0.54, ROOM_SIZE.depth / 2, mats.frame)

    const plaque = createLabel(roomTitle(room), '#ffffffeb')
    if (plaque) {
      plaque.position.set(0, 1.84, -ROOM_SIZE.depth / 2 + 0.15)
      group.add(plaque)
    }

    if (room.kind === 'meeting') {
      addBox(group, 1.78, 0.12, 0.82, 0, 0.72, -0.08, mats.woodLight)
      for (const x of [-0.55, 0.55]) {
        addBox(group, 0.07, 0.64, 0.07, x, 0.4, -0.08, mats.navy)
      }
      for (const [x, z] of [[-0.75, -1.05], [0, -1.05], [0.75, -1.05], [-0.75, 0.9], [0, 0.9], [0.75, 0.9]] as const) {
        addChair(group, x, z)
      }
      addBox(group, 1.04, 0.48, 0.055, 0, 1.08, -1.38, mats.white)
      addBox(group, 0.84, 0.06, 0.025, 0, 1.14, -1.35, mats.accentBlue)
    } else if (room.kind === 'pantry') {
      addBox(group, 1.9, 0.72, 0.42, 0, 0.54, -1.1, mats.woodLight)
      addBox(group, 2.05, 0.1, 0.53, 0, 0.96, -1.06, mats.white)
      addBox(group, 0.53, 1.38, 0.58, 1.22, 0.87, -1.02, mats.white)
      addBox(group, 1.65, 0.1, 0.62, 0.05, 0.82, 0.36, mats.wood)
      for (const x of [-0.55, 0.1, 0.75]) {
        addCylinder(group, 0.2, 0.23, 0.12, x, 0.26, 0.77, mats.chair, 12)
        addCylinder(group, 0.04, 0.05, 0.2, x, 0.16, 0.77, mats.frame, 8)
      }
      addPlant(group, -1.2, 0.96, 0.8)
    } else if (room.kind === 'lounge') {
      addBox(group, 1.7, 0.15, 0.58, 0, 0.45, 0.88, mats.plant)
      for (const [x, z] of [[-0.5, 0.7], [0, 1], [0.55, 0.69], [-0.15, 0.55]] as const) {
        addSphere(group, 0.32, x, 0.69, z, mats.plantLight)
      }
      addBox(group, 1.3, 0.28, 0.45, -0.88, 0.48, -0.08, mats.chair)
      addBox(group, 0.26, 0.52, 0.45, -1.42, 0.6, -0.08, mats.navy)
      addBox(group, 0.26, 0.52, 0.45, -0.34, 0.6, -0.08, mats.navy)
      addCylinder(group, 0.35, 0.35, 0.1, 0.92, 0.48, -0.2, mats.woodLight, 24)
      addCylinder(group, 0.07, 0.08, 0.55, 0.92, 0.22, -0.2, mats.navy, 10)
      addPlant(group, 1.28, -1.02, 0.88)
    } else if (room.kind === 'storage') {
      for (const x of [-1.2, 0, 1.2]) {
        addBox(group, 0.76, 1.48, 0.37, x, 0.91, -1.05, mats.woodLight)
        for (const y of [0.55, 0.94, 1.33]) {
          addBox(group, 0.77, 0.055, 0.4, x, y, -0.83, mats.frame)
        }
        for (const y of [0.74, 1.12, 1.52]) {
          addBox(group, 0.42, 0.22, 0.22, x, y, -0.75, y > 1 ? mats.accentBlue : mats.white)
        }
      }
      addBox(group, 1.75, 0.09, 0.78, 0, 0.74, 0.5, mats.wood)
      for (const x of [-0.7, 0.7]) addBox(group, 0.08, 0.65, 0.08, x, 0.38, 0.5, mats.navy)
    } else {
      const doubleDesk = room.kind === 'technical' || room.kind === 'inspection' || room.kind === 'studio'
      addDesk(group, doubleDesk ? -0.72 : 0.08, -0.42, doubleDesk ? 1.15 : 1.55)
      if (doubleDesk) addDesk(group, 0.82, -0.42, 1.15)
      addChair(group, doubleDesk ? -0.68 : 0.08, 0.73, mats.chair, 0.32)
      if (doubleDesk) addChair(group, 0.82, 0.73, mats.chair, 0.32)
      if (room.kind === 'inspection') {
        addBox(group, 1.85, 0.1, 0.48, 0, 0.66, -1.06, mats.navy)
        addBox(group, 0.75, 0.52, 0.38, 0.18, 0.98, -1.04, mats.accentBlue)
        addCylinder(group, 0.26, 0.26, 0.1, -0.83, 0.78, -1.02, mats.woodLight, 16)
      }
      if (room.kind === 'technical') {
        addBox(group, 0.86, 0.92, 0.45, 1.22, 0.66, -1.02, mats.white)
        for (const y of [0.4, 0.68, 0.96]) addBox(group, 0.88, 0.045, 0.5, 1.22, y, -0.76, mats.frame)
      }
      if (room.kind === 'studio') {
        addBox(group, 0.9, 0.7, 0.055, 1.18, 1.05, -1.36, mats.white)
        addBox(group, 0.65, 0.31, 0.02, 1.18, 1.06, -1.32, mats.accentBlue, { cast: false })
      }
      if (room.kind === 'dispatch') {
        addDesk(group, -0.93, 0.56, 1.08, 0.58)
        addChair(group, -0.93, 1.23, mats.chair, 0.32)
        addBox(group, 0.72, 0.44, 0.055, 0.9, 1.14, -1.36, mats.white)
        addBox(group, 0.42, 0.24, 0.025, 0.9, 1.15, -1.32, mats.accentBlue, { cast: false })
      }
      addPlant(group, -1.27, 0.94, 0.78)
    }

    // A light floor inset and corner lights help the room grid read at small sizes.
    addBox(group, 1.5, 0.035, 0.025, 0, 0.225, ROOM_SIZE.depth / 2 - 0.13, mats.trim, { cast: false })
    addSphere(group, 0.085, -1.45, 2.12, -1.24, mats.white)
    addSphere(group, 0.055, -1.45, 2.12, -1.24, mats.accentBlue)
  }

  // Small outdoor planters soften the platform corners and ground the miniature office.
  for (const [x, z] of [[-8, -6.8], [8, -6.8], [-8, 6.8], [8, 6.8]] as const) {
    addPlant(scene, x, z, 0.76)
  }

  const workstations: Array<{ roomId: string; x: number; z: number }> = [
    { roomId: 'planning', x: 0.08, z: 0.76 },
    { roomId: 'dispatch', x: -0.93, z: 1.23 },
    { roomId: 'dispatch', x: 0.08, z: 0.73 },
    { roomId: 'technical', x: -0.68, z: 0.73 },
    { roomId: 'inspection', x: 0.82, z: 0.73 },
    { roomId: 'studio', x: -0.68, z: 0.73 },
    { roomId: 'technical', x: 0.82, z: 0.73 },
    { roomId: 'inspection', x: -0.68, z: 0.73 },
  ]
  const assignedWorkstations = new Set<number>()
  const roomById = new Map(ROOMS.map((room) => [room.id, room]))
  const workstationFor = (person: OfficePerson, index: number) => {
    const preferredRoom = person.isManager
      ? 'planning'
      : person.roles.includes('PILOT') || person.roles.includes('OPERATOR')
        ? 'dispatch'
        : person.roles.includes('MAINTAINER')
          ? 'technical'
          : person.roles.includes('INSPECTOR')
            ? 'inspection'
            : null
    const preferredIndex = preferredRoom
      ? workstations.findIndex((station, stationIndex) => station.roomId === preferredRoom && !assignedWorkstations.has(stationIndex))
      : -1
    let stationIndex = preferredIndex
    if (stationIndex < 0) {
      stationIndex = Array.from({ length: workstations.length }, (_, offset) => (index + offset) % workstations.length)
        .find((candidate) => !assignedWorkstations.has(candidate)) ?? -1
    }
    if (stationIndex < 0) {
      const room = roomById.get(preferredRoom ?? 'dispatch') ?? ROOMS[1]
      const overflow = Math.max(index - workstations.length + 1, 1)
      return { room, x: ((overflow - 1) % 2 ? 0.85 : -0.85), z: 0.85 + Math.floor((overflow - 1) / 2) * 0.22 }
    }
    assignedWorkstations.add(stationIndex)
    const station = workstations[stationIndex]
    return { room: roomById.get(station.roomId) ?? ROOMS[1], x: station.x, z: station.z }
  }

  const corridorNodes = [
    { id: 'north-west', x: CORRIDOR_X[0], z: CORRIDOR_Z[0], edges: ['north-east', 'south-west'] },
    { id: 'north-east', x: CORRIDOR_X[1], z: CORRIDOR_Z[0], edges: ['north-west', 'south-east'] },
    { id: 'south-west', x: CORRIDOR_X[0], z: CORRIDOR_Z[1], edges: ['north-west', 'south-east'] },
    { id: 'south-east', x: CORRIDOR_X[1], z: CORRIDOR_Z[1], edges: ['north-east', 'south-west'] },
  ] as const
  const corridorNode = (room: Room) => {
    const laneX = room.x < -0.1 ? CORRIDOR_X[0] : CORRIDOR_X[1]
    const laneZ = room.z <= 0 ? CORRIDOR_Z[0] : CORRIDOR_Z[1]
    const id = `${laneZ < 0 ? 'north' : 'south'}-${laneX < 0 ? 'west' : 'east'}`
    return corridorNodes.find((node) => node.id === id) ?? corridorNodes[0]
  }
  const roomDoor = (room: Room) => roomWorldPosition(room, 0, ROOM_SIZE.depth / 2 + 0.38)
  const makeCorridorPath = (from: Room, to: Room, start: THREE.Vector3, end: THREE.Vector3) => {
    const fromNode = corridorNode(from)
    const toNode = corridorNode(to)
    const previous = new Map<string, string | null>([[fromNode.id, null]])
    const queue = [fromNode.id]
    while (queue.length && !previous.has(toNode.id)) {
      const currentId = queue.shift()!
      const current = corridorNodes.find((node) => node.id === currentId)
      if (!current) continue
      for (const next of current.edges) {
        if (previous.has(next)) continue
        previous.set(next, currentId)
        queue.push(next)
      }
    }
    const routeIds: string[] = []
    let cursor: string | null = toNode.id
    while (cursor) {
      routeIds.unshift(cursor)
      cursor = previous.get(cursor) ?? null
    }
    const fromDoor = roomDoor(from)
    const toDoor = roomDoor(to)
    const pantryEntry = (room: Room) => roomWorldPosition(room, -0.95, ROOM_SIZE.depth / 2 - 0.15)
    const lanePoint = (room: Room, door: THREE.Vector3) => room.z !== 0
      ? new THREE.Vector3(door.x, 0, corridorNode(room).z)
      : new THREE.Vector3(corridorNode(room).x, 0, door.z)
    const fromLane = lanePoint(from, fromDoor)
    const toLane = lanePoint(to, toDoor)
    const graphPoints = routeIds.map((id) => {
      const node = corridorNodes.find((item) => item.id === id) ?? corridorNodes[0]
      return new THREE.Vector3(node.x, 0, node.z)
    })
    return [
      start.clone(),
      ...(from.kind === 'pantry' ? [pantryEntry(from)] : []),
      fromDoor,
      from.z !== 0 ? new THREE.Vector3(fromDoor.x, 0, fromLane.z) : new THREE.Vector3(fromLane.x, 0, fromDoor.z),
      fromLane,
      ...graphPoints.slice(1),
      toLane,
      to.z !== 0 ? new THREE.Vector3(toDoor.x, 0, toLane.z) : new THREE.Vector3(toLane.x, 0, toDoor.z),
      toDoor,
      ...(to.kind === 'pantry' ? [pantryEntry(to)] : []),
      end.clone(),
    ].filter((point, pointIndex, path) => pointIndex === 0 || point.distanceTo(path[pointIndex - 1]) > 0.06)
  }

  const preferredAnimation = (clips: THREE.AnimationClip[], hints: string[]) => {
    for (const hint of hints) {
      const clip = clips.find((item) => item.name.toLowerCase().split('|').at(-1)?.replace(/\.\d+$/, '') === hint)
      if (clip) return clip
    }
    return undefined
  }

  void loadOfficeCharacters().then(([maleModel, femaleModel]) => {
    if (disposed) return
    people.forEach((person, index) => {
      // Keep the illustrative character stable when people are filtered or re-ordered.
      const source = stablePersonOffset(person.id, 2) === 0 ? maleModel : femaleModel
      const model = SkeletonUtils.clone(source) as THREE.Group
      const workstation = workstationFor(person, index)
      const chairSeat = roomWorldPosition(workstation.room, workstation.x, workstation.z)
      const root = new THREE.Group()
      root.position.copy(chairSeat)
      // FBXLoader converts the Z-up character to Y-up, leaving its front along +Z.
      // Workstation screens are on the room's -Z side, so staff face the desk.
      root.rotation.y = workstation.room.rotationY + Math.PI
      root.userData.staffId = person.id
      scene.add(root)

      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.castShadow = true
        object.receiveShadow = false
        const recolor = (material: THREE.Material) => {
          const clone = material.clone()
          const colored = clone as THREE.Material & { color?: THREE.Color }
          const materialName = material.name.toLowerCase()
          if (colored.color && (materialName.includes('shirt') || materialName.includes('material'))) {
            colored.color.set(colorForPerson(person.id))
          } else if (colored.color && materialName.includes('hair')) {
            colored.color.set(person.isManager ? '#39485c' : '#354052')
          }
          ownedMaterials.add(clone)
          return clone
        }
        object.material = Array.isArray(object.material)
          ? object.material.map(recolor)
          : recolor(object.material)
      })

      const bounds = new THREE.Box3().setFromObject(model)
      const height = Math.max(bounds.max.y - bounds.min.y, 0.01)
      const scale = 1.55 / height
      const center = bounds.getCenter(new THREE.Vector3())
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
      root.add(model)

      const haloGeometry = new THREE.RingGeometry(0.35, 0.42, 40)
      geometries.push(haloGeometry)
      const haloMaterial = new THREE.MeshBasicMaterial({ color: colorForPerson(person.id), transparent: true, opacity: 0.18, side: THREE.DoubleSide })
      ownedMaterials.add(haloMaterial)
      const halo = new THREE.Mesh(haloGeometry, haloMaterial)
      halo.name = 'staff-selection-halo'
      halo.rotation.x = -Math.PI / 2
      halo.position.y = 0.035
      root.add(halo)

      const initials = person.name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()
      const label = createLabel(`${initials} · ${person.name}`, '#ffffffef', '#19314f')
      if (label) {
        label.position.set(0, 1.78, 0)
        label.scale.set(1.72, 0.48, 1)
        root.add(label)
      }

      const mixer = new THREE.AnimationMixer(model)
      const clips = source.animations
      const selectedClips = {
        idle: preferredAnimation(clips, ['idle']),
        walk: preferredAnimation(clips, ['walk']),
        sit: preferredAnimation(clips, ['sitdown', 'sit']),
        stand: preferredAnimation(clips, ['standup', 'stand']),
      }
      const actions = new Map<string, THREE.AnimationAction>()
      for (const [key, clip] of Object.entries(selectedClips)) {
        if (clip) actions.set(key, mixer.clipAction(clip))
      }
      const sitting = actions.get('sit')
      const sitHipOffset = new THREE.Vector3()
      if (sitting) {
        sitting.setLoop(THREE.LoopOnce, 1)
        sitting.clampWhenFinished = true
        sitting.reset().play()
        mixer.update(sitting.getClip().duration)
        root.updateMatrixWorld(true)
        const hips = model.getObjectByName('Hips')
        if (hips) {
          sitHipOffset.copy(root.worldToLocal(hips.getWorldPosition(new THREE.Vector3())))
          const worldHipOffset = sitHipOffset
            .clone()
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y)
          // Anchor the seated hips to the chair center. The animation moves the
          // skeleton pelvis away from its origin, so the model root needs a small
          // per-model X/Z correction while keeping the feet on the floor.
          root.position.x = chairSeat.x - worldHipOffset.x
          root.position.z = chairSeat.z - worldHipOffset.z
        }
        // Load directly into the completed seated pose. Playing the clip from
        // its first frame while already using the final-pose seat correction
        // makes the character visibly miss the chair during initial rendering.
        sitting.reset().play()
        sitting.time = sitting.getClip().duration
        sitting.paused = true
        mixer.update(0)
      }
      const seat = root.position.clone()
      const avatar: OfficeAvatar = {
        personId: person.id,
        root,
        mixer,
        actions,
        seat,
        sitHipOffset,
        room: workstation.room,
        state: 'sitting',
        stateTime: 0,
        // Start breaks at staggered times, then keep each work stretch around 2–3 minutes.
        waitTime: 35 + stablePersonOffset(person.id, 55),
        path: [],
        pathIndex: 0,
        color: colorForPerson(person.id),
        halo,
        label,
        currentAction: null,
        animationKeys: {
          idle: selectedClips.idle ? 'idle' : undefined,
          walk: selectedClips.walk ? 'walk' : undefined,
          sit: selectedClips.sit ? 'sit' : undefined,
          stand: selectedClips.stand ? 'stand' : undefined,
        },
      }
      avatars.set(person.id, avatar)
      avatarRoots.set(person.id, root)
      staffAnchors.set(person.id, root.position.clone())
      clickables.push(root)
      if (sitting) {
        avatar.currentAction = sitting
        avatar.stateTime = 0
      } else {
        const idle = actions.get('idle')
        if (idle) {
          idle.play()
          avatar.currentAction = idle
        }
      }
    })
    render()
    if (pendingFocusPersonId) focusPerson(pendingFocusPersonId)
    if (!animationsPaused) scheduleAnimationFrame()
  }).catch((error: unknown) => {
    if (!disposed) console.warn('Office character assets could not be loaded.', error)
  })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const render = () => renderer.render(scene, camera)
  const startAnimation = (avatar: OfficeAvatar, key: string, oneShot = false) => {
    const next = avatar.actions.get(key)
    if (!next) return 0
    const previous = avatar.currentAction
    next.reset()
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity)
    next.clampWhenFinished = oneShot
    next.fadeIn(0.22).play()
    if (previous && previous !== next) previous.fadeOut(0.22)
    avatar.currentAction = next
    return next.getClip().duration
  }

  const pathBetweenRooms = (
    from: Room,
    to: Room,
    start: THREE.Vector3,
    end: THREE.Vector3,
  ) => makeCorridorPath(from, to, start, end)

  const moveAvatar = (avatar: OfficeAvatar, delta: number) => {
    let remaining = delta * 1.15
    while (remaining > 0 && avatar.pathIndex < avatar.path.length) {
      const target = avatar.path[avatar.pathIndex]
      const direction = target.clone().sub(avatar.root.position)
      const distance = direction.length()
      if (distance < 0.04) {
        avatar.root.position.copy(target)
        avatar.pathIndex += 1
        continue
      }
      direction.normalize()
      const step = Math.min(distance, remaining)
      avatar.root.position.addScaledVector(direction, step)
      // Character forward is +Z. Use the shortest angular path to avoid turning
      // the long way around when crossing the -PI / PI boundary.
      const desiredYaw = Math.atan2(direction.x, direction.z)
      const yawDelta = THREE.MathUtils.euclideanModulo(
        desiredYaw - avatar.root.rotation.y + Math.PI,
        Math.PI * 2,
      ) - Math.PI
      avatar.root.rotation.y += yawDelta * (1 - Math.exp(-9 * delta))
      remaining -= step
      if (step === distance) avatar.pathIndex += 1
    }
    return avatar.pathIndex >= avatar.path.length
  }

  const pantry = roomById.get('pantry') ?? ROOMS[2]
  // Use one of the stools beside the shared pantry table for a short seated break.
  const pantryStoolPositions = [-0.55, 0.1, 0.75] as const
  const pantryRestPointFor = (avatar: OfficeAvatar) => {
    const stool = roomWorldPosition(
      pantry,
      pantryStoolPositions[stablePersonOffset(avatar.personId, pantryStoolPositions.length)],
      0.77,
    )
    const hipOffset = avatar.sitHipOffset
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), pantry.rotationY + Math.PI)
    stool.x -= hipOffset.x
    stool.z -= hipOffset.z
    return stool
  }
  let breakTravelerId: string | null = null
  const requestBreakTurn = (avatar: OfficeAvatar) => {
    if (breakTravelerId !== null && breakTravelerId !== avatar.personId) {
      avatar.state = 'waiting-for-break'
      return false
    }
    breakTravelerId = avatar.personId
    avatar.state = 'standing'
    avatar.stateTime = startAnimation(avatar, avatar.animationKeys.stand ?? '', true)
    return true
  }
  const startBreakRoute = (avatar: OfficeAvatar) => {
    avatar.path = pathBetweenRooms(
      avatar.room,
      pantry,
      avatar.root.position,
      pantryRestPointFor(avatar),
    )
    avatar.pathIndex = 1
    avatar.state = 'walking-to-break'
    avatar.stateTime = 0
    startAnimation(avatar, avatar.animationKeys.walk ?? '', false)
  }
  const startReturnRoute = (avatar: OfficeAvatar) => {
    avatar.path = pathBetweenRooms(pantry, avatar.room, avatar.root.position, avatar.seat)
    avatar.pathIndex = 1
    avatar.state = 'returning'
    avatar.stateTime = 0
    startAnimation(avatar, avatar.animationKeys.walk ?? '', false)
  }

  const updateAvatar = (avatar: OfficeAvatar, elapsed: number, delta: number, frustum: THREE.Frustum) => {
    const visible = frustum.containsPoint(avatar.root.position.clone().add(new THREE.Vector3(0, 0.8, 0)))
    if (avatar.state === 'sitting') {
      if (avatar.stateTime > 0) {
        avatar.stateTime = Math.max(0, avatar.stateTime - delta)
        if (visible) avatar.mixer.update(delta)
        return true
      }
      avatar.waitTime -= elapsed
      if (avatar.waitTime <= 0) {
        requestBreakTurn(avatar)
        return true
      }
      return false
    }
    if (avatar.state === 'waiting-for-break') {
      if (breakTravelerId === null) requestBreakTurn(avatar)
      return breakTravelerId === avatar.personId
    }
    if (avatar.state === 'standing') {
      avatar.stateTime = Math.max(0, avatar.stateTime - delta)
      if (visible) avatar.mixer.update(delta)
      if (avatar.stateTime === 0) startBreakRoute(avatar)
      return true
    }
    if (avatar.state === 'walking-to-break' || avatar.state === 'returning') {
      const reached = moveAvatar(avatar, delta)
      if (visible) avatar.mixer.update(delta)
      if (!reached) return true
      if (avatar.state === 'walking-to-break') {
        avatar.state = 'on-break'
        avatar.root.rotation.y = pantry.rotationY + Math.PI
        avatar.waitTime = 14 + stablePersonOffset(avatar.personId, 7)
        avatar.stateTime = startAnimation(avatar, avatar.animationKeys.sit ?? '', true)
      } else {
        avatar.root.rotation.y = avatar.room.rotationY + Math.PI
        avatar.state = 'sitting'
        avatar.stateTime = startAnimation(avatar, avatar.animationKeys.sit ?? '', true)
        avatar.waitTime = 100 + stablePersonOffset(avatar.personId, 80)
        if (breakTravelerId === avatar.personId) breakTravelerId = null
      }
      return true
    }
    if (avatar.state === 'on-break') {
      if (avatar.stateTime > 0) {
        avatar.stateTime = Math.max(0, avatar.stateTime - delta)
        if (visible) avatar.mixer.update(delta)
        return true
      }
      avatar.waitTime -= elapsed
      if (avatar.waitTime <= 0) {
        avatar.state = 'standing-from-break'
        avatar.stateTime = startAnimation(avatar, avatar.animationKeys.stand ?? '', true)
        return true
      }
      return false
    }
    if (avatar.state === 'standing-from-break') {
      avatar.stateTime = Math.max(0, avatar.stateTime - delta)
      if (visible) avatar.mixer.update(delta)
      if (avatar.stateTime === 0) startReturnRoute(avatar)
      return true
    }
    avatar.waitTime -= elapsed
    if (avatar.animationKeys.idle && visible) avatar.mixer.update(delta)
    if (avatar.waitTime <= 0) {
      startReturnRoute(avatar)
      return true
    }
    return Boolean(avatar.animationKeys.idle && visible)
  }

  const scheduleAnimationFrame = () => {
    if (disposed || animationFrame || document.hidden) return
    if (wakeTimer) {
      window.clearTimeout(wakeTimer)
      wakeTimer = 0
    }
    animationFrame = window.requestAnimationFrame(animate)
  }

  const animate = (timestamp: number) => {
    animationFrame = 0
    if (disposed || document.hidden) return
    const elapsed = previousFrameTime ? Math.max((timestamp - previousFrameTime) / 1000, 0) : 0
    previousFrameTime = timestamp
    const delta = Math.min(elapsed, 0.05)
    const controlsChanged = controls.update()
    let changed = controlsChanged

    if (cameraTween) {
      cameraTween.elapsed += delta
      const progress = Math.min(cameraTween.elapsed / cameraTween.duration, 1)
      const eased = 1 - (1 - progress) ** 3
      camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased)
      controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased)
      camera.zoom = THREE.MathUtils.lerp(cameraTween.fromZoom, cameraTween.toZoom, eased)
      camera.updateProjectionMatrix()
      controls.update()
      changed = true
      if (progress === 1) cameraTween = null
    }

    let actorMotion = false
    if (!animationsPaused && avatars.size) {
      const viewProjection = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      const frustum = new THREE.Frustum().setFromProjectionMatrix(viewProjection)
      for (const avatar of avatars.values()) {
        if (updateAvatar(avatar, elapsed, delta, frustum)) actorMotion = true
      }
      changed ||= actorMotion
    }

    if (!animationsPaused && followPersonId) {
      const targetRoot = avatarRoots.get(followPersonId)
      if (targetRoot && actorMotion) {
        const nextTarget = targetRoot.position.clone().add(new THREE.Vector3(0, 0.92, 0))
        const shift = nextTarget.sub(controls.target).multiplyScalar(1 - Math.exp(-delta * 5))
        if (shift.lengthSq() > 0.000001) {
          controls.target.add(shift)
          camera.position.add(shift)
          changed = true
        }
      }
    }

    if (changed) render()
    if (cameraTween || actorMotion || controlsChanged) {
      scheduleAnimationFrame()
      return
    }
    if (!animationsPaused && avatars.size) {
      const nextWake = Math.min(...[...avatars.values()].map((avatar) =>
        (avatar.state === 'sitting' || avatar.state === 'on-break') && avatar.stateTime <= 0
          ? avatar.waitTime
          : Infinity,
      ))
      if (Number.isFinite(nextWake)) {
        wakeTimer = window.setTimeout(scheduleAnimationFrame, Math.max(24, nextWake * 1000))
      }
    }
  }

  const focusAt = (target: THREE.Vector3, zoom: number) => {
    const shift = target.clone().sub(controls.target)
    cameraTween = {
      fromPosition: camera.position.clone(),
      toPosition: camera.position.clone().add(shift),
      fromTarget: controls.target.clone(),
      toTarget: target.clone(),
      fromZoom: camera.zoom,
      toZoom: THREE.MathUtils.clamp(zoom, controls.minZoom, controls.maxZoom),
      elapsed: 0,
      duration: 0.62,
    }
    scheduleAnimationFrame()
  }

  const onControlsChange = () => {
    render()
    scheduleAnimationFrame()
  }
  controls.addEventListener('change', onControlsChange)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('click', onCanvasClick)
  renderer.domElement.addEventListener('keydown', onCanvasKeyDown)
  const onVisibilityChange = () => {
    previousFrameTime = 0
    if (!document.hidden && !animationsPaused) scheduleAnimationFrame()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  function onPointerMove(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(clickables, true)
    const hasTarget = hits.some((hit) => findTarget(hit.object))
    renderer.domElement.style.cursor = hasTarget ? 'pointer' : 'grab'
  }

  function findTarget(object: THREE.Object3D): { roomId?: string; staffId?: string } | null {
    let current: THREE.Object3D | null = object
    while (current) {
      if (current.userData.roomId || current.userData.staffId) {
        return {
          roomId: current.userData.roomId as string | undefined,
          staffId: current.userData.staffId as string | undefined,
        }
      }
      current = current.parent
    }
    return null
  }

  function onCanvasClick(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const target = raycaster.intersectObjects(clickables, true)
      .map((hit) => findTarget(hit.object))
      .find((value) => value !== null)
    if (target?.staffId) onPersonClick(target.staffId)
    else if (target?.roomId) onRoomClick(target.roomId)
  }

  function onCanvasKeyDown(event: KeyboardEvent) {
    if (event.key === '+' || event.key === '=') {
      camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.14)
    } else if (event.key === '-' || event.key === '_') {
      camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.14)
    } else if (event.key.toLowerCase() === 'r' || event.key === 'Home') {
      reset()
      event.preventDefault()
      return
    } else {
      return
    }
    event.preventDefault()
    camera.updateProjectionMatrix()
    controls.update()
    render()
    scheduleAnimationFrame()
  }

  function reset() {
    cameraTween = null
    followPersonId = null
    camera.position.copy(initialPosition)
    camera.zoom = 1
    controls.target.copy(initialTarget)
    camera.lookAt(initialTarget)
    camera.updateMatrixWorld()
    fitOfficeCamera(camera, Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1), initialTarget)
    camera.updateProjectionMatrix()
    controls.update()
    render()
  }

  const focusPerson = (personId: string | null) => {
    if (!personId) return
    const avatar = avatars.get(personId)
    if (!avatar) {
      pendingFocusPersonId = personId
      return
    }
    pendingFocusPersonId = null
    const target = avatar?.root.position.clone().add(new THREE.Vector3(0, 0.72, 0))
    if (target) focusAt(target, 2.35)
  }

  const focusRoom = (roomId: string | null) => {
    if (!roomId) return
    const target = roomFloors.get(roomId)?.getWorldPosition(new THREE.Vector3())
    if (target) focusAt(target.add(new THREE.Vector3(0, 0.7, 0)), 1.75)
  }

  const setFollowPerson = (personId: string | null) => {
    followPersonId = personId
    if (personId) focusPerson(personId)
    else scheduleAnimationFrame()
  }

  const setAnimationsPaused = (paused: boolean) => {
    animationsPaused = paused
    if (paused && wakeTimer) {
      window.clearTimeout(wakeTimer)
      wakeTimer = 0
    }
    if (paused && animationFrame && !cameraTween) {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
      render()
    } else if (!paused) {
      previousFrameTime = 0
      scheduleAnimationFrame()
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    const width = Math.max(host.clientWidth, 1)
    const height = Math.max(host.clientHeight, 1)
    camera.updateMatrixWorld()
    fitOfficeCamera(camera, width / height, controls.target)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    render()
    scheduleAnimationFrame()
  })
  resizeObserver.observe(host)
  const rect = host.getBoundingClientRect()
  renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false)
  render()

  return {
    renderer,
    camera,
    controls,
    scene,
    roomFloors,
    staffAnchors,
    avatarRoots,
    render,
    reset,
    focusPerson,
    focusRoom,
    setFollowPerson,
    setAnimationsPaused,
    dispose: () => {
      disposed = true
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      if (wakeTimer) window.clearTimeout(wakeTimer)
      resizeObserver.disconnect()
      controls.removeEventListener('change', onControlsChange)
      controls.dispose()
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('click', onCanvasClick)
      renderer.domElement.removeEventListener('keydown', onCanvasKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      for (const avatar of avatars.values()) avatar.mixer.stopAllAction()
      scene.traverse((object) => {
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose()
          object.material.dispose()
        }
      })
      for (const geometry of geometries) geometry.dispose()
      for (const material of ownedMaterials) material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

const ACTIVE_WORK_STATUSES = new Set<MissionStatus>([
  'READY',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'IN_PROGRESS',
  'IN_FLIGHT',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'AWAITING_REVIEW',
  'PENDING_REVIEW',
])

function collectPeople(
  staff: AvailableOperator[],
  missions: MissionCalendarItem[],
  manager: ManagerIdentity | null,
): OfficePerson[] {
  const people = new Map<string, OfficePerson>()

  for (const member of staff) {
    people.set(member.id, {
      id: member.id,
      name: member.fullName,
      email: member.email,
      roles: ['STAFF'],
      isManager: false,
      missions: [],
    })
  }

  if (manager) {
    people.set(manager.id, {
      id: manager.id,
      name: manager.fullName,
      email: manager.email,
      roles: ['MANAGER'],
      isManager: true,
      missions: [],
    })
  }

  for (const mission of missions) {
    if (!ACTIVE_WORK_STATUSES.has(mission.status)) continue
    const mainDevice =
      mission.deviceAssignments?.find((item) => item.deviceRole === 'MAIN') ??
      mission.deviceAssignments?.[0]
    const device =
      mainDevice?.deviceName ??
      mainDevice?.deviceCode ??
      mission.droneName ??
      mission.droneCode ??
      null
    const assignments = mission.staffAssignments?.filter(
      (item) => item.isCurrent !== false,
    ) ?? []
    const hasPilot = assignments.some(
      (assignment) => assignment.assignedRole === 'PILOT',
    )

    for (const assignment of assignments) {
      if (!assignment.staffId || !assignment.staffName?.trim()) continue
      const person = people.get(assignment.staffId) ?? {
        id: assignment.staffId,
        name: assignment.staffName.trim(),
        email: assignment.staffEmail ?? null,
        roles: [],
        isManager: false,
        missions: [],
      }
      if (!person.roles.includes(assignment.assignedRole)) {
        person.roles.push(assignment.assignedRole)
      }
      if (!person.missions.some((item) => item.id === mission.id)) {
        person.missions.push({
          id: mission.id,
          code: mission.missionCode,
          title: mission.serviceLabel || mission.addressText || null,
          device,
          status: mission.status,
        })
      }
      people.set(person.id, person)
    }

    if (mission.operatorId && mission.operatorName && !hasPilot) {
      const person = people.get(mission.operatorId) ?? {
        id: mission.operatorId,
        name: mission.operatorName,
        email: null,
        roles: [],
        isManager: false,
        missions: [],
      }
      if (!person.roles.includes('PILOT')) person.roles.push('PILOT')
      if (!person.missions.some((item) => item.id === mission.id)) {
        person.missions.push({
          id: mission.id,
          code: mission.missionCode,
          title: mission.serviceLabel || mission.addressText || null,
          device,
          status: mission.status,
        })
      }
      people.set(person.id, person)
    }
  }

  return [...people.values()].sort((a, b) => {
    if (a.isManager !== b.isManager) return a.isManager ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function roleLabel(role: string, isEnglish: boolean) {
  const labels: Record<string, { vi: string; en: string }> = {
    MANAGER: { vi: 'Quản lý', en: 'Manager' },
    STAFF: { vi: 'Nhân sự', en: 'Staff' },
    PILOT: { vi: 'Phi công', en: 'Pilot' },
    OPERATOR: { vi: 'Vận hành', en: 'Operator' },
    MAINTAINER: { vi: 'Bảo trì', en: 'Maintenance' },
    INSPECTOR: { vi: 'Nghiệm thu', en: 'Inspector' },
  }
  const label = labels[role]
  return label ? (isEnglish ? label.en : label.vi) : role
}

function activityFor(
  person: OfficePerson,
  isEnglish: boolean,
  lang: 'vi' | 'en',
) {
  if (person.isManager) {
    return {
      label: isEnglish ? 'Manager' : 'Quản lý',
      detail: isEnglish ? 'You · team office' : 'Bạn · văn phòng đội ngũ',
      tone: 'manager',
    }
  }

  const inFlight = person.missions.find((mission) =>
    ['IN_PROGRESS', 'IN_FLIGHT', 'RETURNING'].includes(mission.status),
  )
  const mission = inFlight ?? person.missions[0]
  if (!mission) {
    return {
      label: isEnglish ? 'No active work' : 'Chưa có việc đang xử lý',
      detail: isEnglish
        ? 'No active mission is assigned'
        : 'Chưa được gán vào nhiệm vụ đang hoạt động',
      tone: 'neutral',
    }
  }

  const currentlyWorking = ['IN_PROGRESS', 'IN_FLIGHT', 'RETURNING'].includes(
    mission.status,
  )
  return {
    label: getMissionStatusLabel(mission.status, lang),
    detail: mission.code + (mission.title ? ' · ' + mission.title : ''),
    tone: currentlyWorking ? 'active' : 'preparing',
  }
}

export function Office3DView({
  staff,
  missions,
  manager,
  loading,
  lang,
}: {
  staff: AvailableOperator[]
  missions: MissionCalendarItem[]
  manager: ManagerIdentity | null
  loading: boolean
  lang: string
}) {
  const isEnglish = lang === 'en'
  const locale = isEnglish ? 'en' : 'vi'
  const hostRef = useRef<HTMLDivElement>(null)
  const stageCardRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<SceneHandle | null>(null)
  const selectedRoomRef = useRef<string | null>(null)
  const selectedPersonRef = useRef<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [sceneError, setSceneError] = useState(false)
  const [followPersonId, setFollowPersonId] = useState<string | null>(null)
  const [animationsPaused, setAnimationsPaused] = useState(false)
  const [teamRailVisible, setTeamRailVisible] = useState(true)
  const [department, setDepartment] = useState<'all' | 'flight' | 'technical' | 'management'>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const animationsPausedRef = useRef(animationsPaused)
  const followPersonIdRef = useRef(followPersonId)

  const activeMissions = useMemo(
    () => missions.filter((mission) => ACTIVE_WORK_STATUSES.has(mission.status)),
    [missions],
  )
  const people = useMemo(
    () => collectPeople(staff, activeMissions, manager),
    [staff, activeMissions, manager],
  )
  const visiblePeople = useMemo(() => people.filter((item) => {
    if (department === 'all') return true
    if (department === 'management') return item.isManager
    if (department === 'flight') return item.roles.some((role) => ['PILOT', 'OPERATOR'].includes(role))
    if (department === 'technical') return item.roles.some((role) => ['MAINTAINER', 'INSPECTOR'].includes(role))
    return true
  }), [people, department])
  const devices = useMemo(() => {
    const ids = new Set<string>()
    for (const mission of activeMissions) {
      for (const device of mission.deviceAssignments ?? []) {
        ids.add(device.deviceId || device.deviceCode || device.id)
      }
      if (!mission.deviceAssignments?.length && (mission.droneId || mission.droneCode)) {
        ids.add(mission.droneId || mission.droneCode || mission.id)
      }
    }
    return ids.size
  }, [activeMissions])

  const room = ROOMS.find((item) => item.id === selectedRoom)
  const person = people.find((item) => item.id === selectedPerson)
  const onRoomClick = useCallback((id: string) => {
    setSelectedRoom(id)
    setSelectedPerson(null)
    setFollowPersonId(null)
    setTeamRailVisible(true)
  }, [])
  const onPersonClick = useCallback((id: string) => {
    setSelectedPerson(id)
    setSelectedRoom(null)
    setFollowPersonId(null)
    setTeamRailVisible(true)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let handle: SceneHandle
    try {
      handle = makeOfficeScene(host, visiblePeople, lang, onRoomClick, onPersonClick)
      sceneRef.current = handle
      handle.setAnimationsPaused(animationsPausedRef.current)
      const currentRoom = selectedRoomRef.current
      for (const [roomId, floor] of handle.roomFloors) {
        if (roomId === currentRoom) {
          (floor.material as THREE.MeshStandardMaterial).color.set('#d5e8ff')
        }
      }
      if (currentRoom) handle.focusRoom(currentRoom)
      if (selectedPersonRef.current) handle.focusPerson(selectedPersonRef.current)
      if (followPersonIdRef.current) handle.setFollowPerson(followPersonIdRef.current)
      handle.render()
      setSceneError(false)
    } catch {
      sceneRef.current?.dispose()
      sceneRef.current = null
      setSceneError(true)
      return
    }
    return () => {
      handle.dispose()
      if (sceneRef.current === handle) sceneRef.current = null
    }
    // The scene is rebuilt when the team data or display language changes.
  }, [visiblePeople, lang, onRoomClick, onPersonClick])

  useEffect(() => {
    selectedRoomRef.current = selectedRoom
    const handle = sceneRef.current
    if (!handle) return
    for (const [roomId, floor] of handle.roomFloors) {
      const material = floor.material as THREE.MeshStandardMaterial
      const index = ROOMS.findIndex((item) => item.id === roomId)
      const base = index % 2 === 0 ? '#f6f7f5' : '#eff4f6'
      material.color.set(roomId === selectedRoom ? '#d5e8ff' : base)
    }
    if (selectedRoom) handle.focusRoom(selectedRoom)
    handle.render()
  }, [selectedRoom])

  useEffect(() => {
    selectedPersonRef.current = selectedPerson
    const handle = sceneRef.current
    if (!handle) return
    for (const [staffId, root] of handle.avatarRoots) {
      const halo = root.getObjectByName('staff-selection-halo')
      if (halo instanceof THREE.Mesh && halo.material instanceof THREE.MeshBasicMaterial) {
        halo.material.opacity = staffId === selectedPerson ? 0.9 : 0.18
      }
    }
    if (selectedPerson) handle.focusPerson(selectedPerson)
    else handle.setFollowPerson(null)
    handle.render()
  }, [selectedPerson, people])

  useEffect(() => {
    animationsPausedRef.current = animationsPaused
    sceneRef.current?.setAnimationsPaused(animationsPaused)
  }, [animationsPaused])

  useEffect(() => {
    followPersonIdRef.current = followPersonId
    sceneRef.current?.setFollowPerson(followPersonId)
  }, [followPersonId])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) setAnimationsPaused(true)
    const onPreferenceChange = (event: MediaQueryListEvent) => setAnimationsPaused(event.matches)
    preference.addEventListener('change', onPreferenceChange)
    return () => preference.removeEventListener('change', onPreferenceChange)
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === stageCardRef.current)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    const stage = stageCardRef.current
    if (!stage) return
    try {
      if (document.fullscreenElement === stage) await document.exitFullscreen()
      else if (stage.requestFullscreen) await stage.requestFullscreen()
    } catch {
      // Fullscreen is optional; keep the office usable if the browser denies it.
    }
  }

  const zoom = (factor: number) => {
    const handle = sceneRef.current
    if (!handle) return
    handle.camera.zoom = THREE.MathUtils.clamp(
      handle.camera.zoom * factor,
      handle.controls.minZoom,
      handle.controls.maxZoom,
    )
    handle.camera.updateProjectionMatrix()
    handle.controls.update()
    handle.render()
  }

  const copy = isEnglish
    ? {
        title: 'Team and active work',
        people: 'Team',
        manager: 'You · Manager',
        activePeople: 'With active work',
        activeMissions: 'Active tasks',
        devices: 'Assigned devices',
        workspace: 'Office workspace',
        controls: 'Drag to explore · scroll to zoom · select a person or room',
        keyboard: 'Keyboard: + / − to zoom, R or Home to reset.',
        note: 'Illustrative office layout · staff and work status come from the system.',
        reset: 'Reset view',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        selectedRoom: 'Selected room',
        currentWork: 'Current work',
        noCurrentWork: 'No active work is assigned.',
        teamEmpty: 'No staff accounts are available.',
        missionTitle: 'Work in progress',
        missionEmpty: 'There are no active mission tasks right now.',
        device: 'Device',
        fallback: '3D is unavailable in this browser. Use the team and work panels to review current information.',
        detail: 'Team member details',
        rooms: 'Office areas',
        loading: 'Loading team information…',
        pauseMotion: 'Pause staff movement',
        resumeMotion: 'Resume staff movement',
        follow: 'Follow selected staff',
        stopFollowing: 'Stop following',
        expand: 'Expand office view',
        collapse: 'Exit full screen',
        showTeam: 'Show team panel',
        hideTeam: 'Hide team panel',
        department: 'Department',
        allDepartments: 'All departments',
        flightDepartment: 'Flight operations',
        technicalDepartment: 'Technical & inspection',
        managementDepartment: 'Management',
        motionDisclosure: 'Staff movement is illustrative; assignments and mission status come from the system.',
      }
    : {
        title: 'Đội ngũ và công việc',
        people: 'Đội ngũ',
        manager: 'Bạn · Quản lý',
        activePeople: 'Đang có công việc',
        activeMissions: 'Nhiệm vụ hoạt động',
        devices: 'Thiết bị được phân công',
        workspace: 'Không gian làm việc',
        controls: 'Kéo để quan sát · cuộn để thu phóng · chọn nhân sự hoặc khu vực',
        keyboard: 'Bàn phím: + / − để thu phóng, R hoặc Home để đặt lại góc nhìn.',
        note: 'Bố trí văn phòng mang tính minh họa · nhân sự và trạng thái công việc lấy từ hệ thống.',
        reset: 'Đặt lại góc nhìn',
        zoomIn: 'Phóng to',
        zoomOut: 'Thu nhỏ',
        selectedRoom: 'Khu vực đang chọn',
        currentWork: 'Công việc hiện tại',
        noCurrentWork: 'Chưa có công việc đang được giao.',
        teamEmpty: 'Chưa có tài khoản nhân sự đang hoạt động.',
        missionTitle: 'Công việc đang xử lý',
        missionEmpty: 'Hiện chưa có nhiệm vụ nào đang hoạt động.',
        device: 'Thiết bị',
        fallback: 'Trình duyệt chưa hỗ trợ chế độ 3D. Danh sách đội ngũ và công việc vẫn hiển thị bên cạnh.',
        detail: 'Thông tin nhân sự',
        rooms: 'Khu vực văn phòng',
        loading: 'Đang tải thông tin đội ngũ…',
        pauseMotion: 'Tạm dừng chuyển động',
        resumeMotion: 'Tiếp tục chuyển động',
        follow: 'Theo dõi nhân sự đã chọn',
        stopFollowing: 'Dừng theo dõi',
        expand: 'Mở rộng không gian 3D',
        collapse: 'Thoát toàn màn hình',
        showTeam: 'Hiện bảng đội ngũ',
        hideTeam: 'Ẩn bảng đội ngũ',
        department: 'Phòng ban',
        allDepartments: 'Tất cả phòng ban',
        flightDepartment: 'Điều hành bay',
        technicalDepartment: 'Kỹ thuật & nghiệm thu',
        managementDepartment: 'Quản lý',
        motionDisclosure: 'Chuyển động nhân sự chỉ mang tính minh họa; nhiệm vụ và trạng thái lấy từ hệ thống.',
      }

  const activePeopleCount = people.filter(
    (item) => !item.isManager && item.missions.length > 0,
  ).length

  const renderMission = (mission: OfficePerson['missions'][number]) => (
    <article className="mgr-office-work-item" key={mission.id}>
      <div className="mgr-office-work-item-top">
        <strong>{mission.code}</strong>
        <span className={'mgr-office-status is-' + (
          ['IN_PROGRESS', 'IN_FLIGHT', 'RETURNING'].includes(mission.status)
            ? 'active'
            : 'preparing'
        )}>
          {getMissionStatusLabel(mission.status, locale)}
        </span>
      </div>
      <span className="mgr-office-work-title">
        {mission.title || (isEnglish ? 'Mission task' : 'Nhiệm vụ')}
      </span>
      {mission.device && <small>{copy.device}: {mission.device}</small>}
    </article>
  )

  return (
    <section className="mgr-office" aria-label={copy.title}>
      <header className="mgr-office-heading">
        <div>
          <div className="mgr-office-eyebrow">
            <span className="mgr-office-live-dot" />
            {isEnglish ? 'TEAM OVERVIEW' : 'TỔNG QUAN ĐỘI NGŨ'}
          </div>
          <h2>{copy.title}</h2>
          <p>
            {isEnglish
              ? 'See who is assigned to active work across the team.'
              : 'Xem nhân sự và nhiệm vụ đang được xử lý trong toàn đội.'}
          </p>
        </div>
        <div className="mgr-office-stats" aria-label={copy.people}>
          <div className="mgr-office-stat">
            <TeamOutlined />
            <span><strong>{people.length}</strong>{copy.people}</span>
          </div>
          <div className="mgr-office-stat">
            <CheckCircleOutlined />
            <span><strong>{activePeopleCount}</strong>{copy.activePeople}</span>
          </div>
          <div className="mgr-office-stat">
            <SendOutlined />
            <span><strong>{activeMissions.length}</strong>{copy.activeMissions}</span>
          </div>
          <div className="mgr-office-stat">
            <HomeOutlined />
            <span><strong>{devices}</strong>{copy.devices}</span>
          </div>
        </div>
      </header>

      {loading && (
        <div className="mgr-office-loading" role="status" aria-live="polite">
          <Skeleton active title={false} paragraph={{ rows: 1, width: '45%' }} />
          <span>{copy.loading}</span>
        </div>
      )}

      <div className={'mgr-office-grid' + (teamRailVisible ? '' : ' is-expanded')}>
        <section
          ref={stageCardRef}
          className="mgr-office-stage-card"
          aria-label={copy.workspace}
        >
          <div className="mgr-office-stage-head">
            <div className="mgr-office-stage-title">
              <strong>{room ? (isEnglish ? room.en : room.vi) : copy.workspace}</strong>
              <span>{person ? person.name : copy.controls}</span>
            </div>
            <div className="mgr-office-camera-controls" aria-label={isEnglish ? 'Office controls' : 'Điều khiển văn phòng'}>
              <Select
                className="mgr-office-department-select"
                aria-label={copy.department}
                value={department}
                onChange={(value) => {
                  setDepartment(value)
                  setSelectedPerson(null)
                  setFollowPersonId(null)
                }}
                options={[
                  { value: 'all', label: copy.allDepartments },
                  { value: 'flight', label: copy.flightDepartment },
                  { value: 'technical', label: copy.technicalDepartment },
                  { value: 'management', label: copy.managementDepartment },
                ]}
              />
              <Tooltip title={animationsPaused ? copy.resumeMotion : copy.pauseMotion}>
                <Button
                  aria-label={animationsPaused ? copy.resumeMotion : copy.pauseMotion}
                  aria-pressed={!animationsPaused}
                  icon={animationsPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={() => setAnimationsPaused((paused) => !paused)}
                />
              </Tooltip>
              <Tooltip title={followPersonId ? copy.stopFollowing : copy.follow}>
                <Button
                  aria-label={followPersonId ? copy.stopFollowing : copy.follow}
                  aria-pressed={Boolean(followPersonId)}
                  disabled={!selectedPerson || !visiblePeople.some((item) => item.id === selectedPerson)}
                  icon={<AimOutlined />}
                  onClick={() => setFollowPersonId((current) => current ? null : selectedPerson)}
                />
              </Tooltip>
              <Tooltip title={teamRailVisible ? copy.hideTeam : copy.showTeam}>
                <Button
                  aria-label={teamRailVisible ? copy.hideTeam : copy.showTeam}
                  aria-pressed={teamRailVisible}
                  icon={<TeamOutlined />}
                  onClick={() => setTeamRailVisible((visible) => !visible)}
                />
              </Tooltip>
              <Tooltip title={copy.zoomIn}>
                <Button aria-label={copy.zoomIn} icon={<ZoomInOutlined />} onClick={() => zoom(1.18)} />
              </Tooltip>
              <Tooltip title={copy.zoomOut}>
                <Button aria-label={copy.zoomOut} icon={<ZoomOutOutlined />} onClick={() => zoom(1 / 1.18)} />
              </Tooltip>
              <Tooltip title={copy.reset}>
                <Button
                  aria-label={copy.reset}
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    sceneRef.current?.reset()
                    setSelectedPerson(null)
                    setSelectedRoom(null)
                    setFollowPersonId(null)
                  }}
                />
              </Tooltip>
              <Tooltip title={isFullscreen ? copy.collapse : copy.expand}>
                <Button
                  aria-label={isFullscreen ? copy.collapse : copy.expand}
                  icon={isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />}
                  onClick={() => void toggleFullscreen()}
                />
              </Tooltip>
            </div>
          </div>
          <div className="mgr-office-canvas-wrap">
            <div ref={hostRef} className="mgr-office-canvas-host" />
            <div className="mgr-office-canvas-overlay">
              <span><i className="is-active" />{visiblePeople.length} {copy.people.toLocaleLowerCase(locale)}</span>
              <span>{ROOMS.length} {copy.rooms.toLocaleLowerCase(locale)}</span>
            </div>
            <div className="mgr-office-canvas-caption">
              <span><i />{isEnglish ? 'System assignment data' : 'Dữ liệu phân công từ hệ thống'}</span>
              <span>{isEnglish ? 'Illustrative layout' : 'Sơ đồ minh họa'}</span>
            </div>
            {sceneError && (
              <div className="mgr-office-fallback">
                <Alert type="info" showIcon message={copy.fallback} />
                <div className="mgr-office-fallback-grid">
                  {ROOMS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={item.id === selectedRoom ? 'is-selected' : ''}
                      onClick={() => onRoomClick(item.id)}
                    >
                      {isEnglish ? item.en : item.vi}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mgr-office-hint-row">
            <span><ClockCircleOutlined /> {copy.keyboard}</span>
            <span>{copy.motionDisclosure}</span>
          </div>
        </section>

        {teamRailVisible && <aside className="mgr-office-rail" aria-label={copy.people}>
          {person ? (
            <section className="mgr-office-rail-card mgr-office-person-detail">
              <div className="mgr-office-rail-title">
                <div>
                  <span className="mgr-office-title-icon"><TeamOutlined /></span>
                  <h3>{copy.detail}</h3>
                </div>
                <Button
                  type="text"
                  onClick={() => setSelectedPerson(null)}
                  aria-label={isEnglish ? 'Close staff details' : 'Đóng thông tin nhân sự'}
                >
                  ×
                </Button>
              </div>
              <div className="mgr-office-profile">
                <span
                  className={'mgr-office-avatar' + (person.isManager ? ' is-manager' : '')}
                  style={{ '--person-color': colorForPerson(person.id) } as CSSProperties}
                >
                  {person.name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()}
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <div className="mgr-office-role-list">
                    {person.roles.map((role) => <Tag key={role}>{roleLabel(role, isEnglish)}</Tag>)}
                  </div>
                </div>
              </div>
              {person.email && (
                <div className="mgr-office-email">
                  <MailOutlined />
                  <a href={'mailto:' + person.email}>{person.email}</a>
                </div>
              )}
              <div className="mgr-office-detail-section is-column">
                <span>{copy.currentWork}</span>
                {person.missions.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noCurrentWork} />
                ) : (
                  person.missions.map(renderMission)
                )}
              </div>
            </section>
          ) : room ? (
            <section className="mgr-office-rail-card mgr-office-room-detail">
              <div className="mgr-office-rail-title">
                <div>
                  <span className="mgr-office-title-icon"><HomeOutlined /></span>
                  <h3>{copy.selectedRoom}</h3>
                </div>
                <Button
                  type="text"
                  onClick={() => setSelectedRoom(null)}
                  aria-label={isEnglish ? 'Close room details' : 'Đóng thông tin khu vực'}
                >
                  ×
                </Button>
              </div>
              <strong>{isEnglish ? room.en : room.vi}</strong>
              <p>{copy.note}</p>
            </section>
          ) : (
            <section className="mgr-office-rail-card">
              <div className="mgr-office-rail-title">
                <div>
                  <span className="mgr-office-title-icon"><TeamOutlined /></span>
                  <h3>{copy.people}</h3>
                </div>
                <Tag>{people.length}</Tag>
              </div>
              {people.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={copy.teamEmpty}
                />
              ) : (
                <div className="mgr-office-people-list">
                  {people.map((item) => {
                    const activity = activityFor(item, isEnglish, locale)
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={'mgr-office-person-row' +
                          (selectedPerson === item.id ? ' is-selected' : '') +
                          (item.isManager ? ' is-manager' : '')}
                        onClick={() => onPersonClick(item.id)}
                      >
                        <span
                          className={'mgr-office-avatar' + (item.isManager ? ' is-manager' : '')}
                          style={{ '--person-color': colorForPerson(item.id) } as CSSProperties}
                        >
                          {item.name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()}
                        </span>
                        <span className="mgr-office-person-copy">
                          <strong>{item.name}</strong>
                          <small>{item.isManager ? copy.manager : item.roles.filter((role) => role !== 'STAFF').map((role) => roleLabel(role, isEnglish)).join(' · ') || roleLabel('STAFF', isEnglish)}</small>
                          <small className="mgr-office-person-activity">{activity.detail}</small>
                        </span>
                        <span className={'mgr-office-status is-' + activity.tone}>{activity.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          <section className="mgr-office-rail-card mgr-office-work-card">
            <div className="mgr-office-rail-title">
              <div>
                <span className="mgr-office-title-icon is-blue"><SendOutlined /></span>
                <h3>{copy.missionTitle}</h3>
              </div>
              <Tag>{activeMissions.length}</Tag>
            </div>
            {activeMissions.length === 0 ? (
              <p className="mgr-office-empty-missions">{copy.missionEmpty}</p>
            ) : (
              <div className="mgr-office-mission-list">
                {activeMissions.map((mission) => {
                  const device = mission.deviceAssignments?.find((item) => item.deviceRole === 'MAIN')
                    ?? mission.deviceAssignments?.[0]
                  const work: OfficePerson['missions'][number] = {
                    id: mission.id,
                    code: mission.missionCode,
                    title: mission.serviceLabel || mission.addressText || null,
                    device: device?.deviceName ?? device?.deviceCode ?? mission.droneName ?? mission.droneCode ?? null,
                    status: mission.status,
                  }
                  return renderMission(work)
                })}
              </div>
            )}
          </section>
        </aside>}
      </div>
    </section>
  )
}
