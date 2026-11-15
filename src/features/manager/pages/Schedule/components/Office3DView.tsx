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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import type { MissionCalendarItem } from '../../../types/missions'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { managerHref } from '../../../routes'
import { getVisibleMissionStaffAssignments } from '../../../lib/missionStaffAssignments'
import { StaffMissionActivity } from './StaffMissionActivity'
import { OfficeMissionAssignmentPanel } from './OfficeMissionAssignmentPanel'
import { resolveOfficeArea } from './officeBusiness'
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
  kind: 'meeting' | 'dispatch' | 'pantry' | 'planning' | 'lounge' | 'shared' | 'technical' | 'inspection' | 'storage'
}

type OfficeAvatar = {
  personId: string
  personName: string
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
  isWorking: boolean
  workingIndicator: THREE.Mesh | null
  workingGeometry: THREE.RingGeometry | null
  workingMaterial: THREE.MeshBasicMaterial | null
  workLabel: THREE.Sprite | null
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
  updatePeople: (people: OfficePerson[]) => void
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
  { id: 'planning', vi: 'Văn phòng quản lý', en: 'Manager office', x: 0, z: -4.7, rotationY: 0, kind: 'planning' },
  { id: 'pantry', vi: 'Khu pantry', en: 'Pantry', x: 5.5, z: -4.7, rotationY: 0, kind: 'pantry' },
  { id: 'lounge', vi: 'Lập kế hoạch nhiệm vụ', en: 'Mission planning', x: -5.5, z: 0, rotationY: Math.PI / 2, kind: 'lounge' },
  { id: 'dispatch', vi: 'Trung tâm điều phối bay', en: 'Flight operations center', x: 0, z: 0, rotationY: 0, kind: 'dispatch' },
  { id: 'inspection', vi: 'Kiểm tra & nghiệm thu', en: 'QA / Inspection', x: 5.5, z: 0, rotationY: -Math.PI / 2, kind: 'inspection' },
  { id: 'shared', vi: 'Khu làm việc chung', en: 'Shared workspace', x: -5.5, z: 4.7, rotationY: Math.PI, kind: 'shared' },
  { id: 'technical', vi: 'Khu kỹ thuật & bảo trì', en: 'Technical & maintenance', x: 0, z: 4.7, rotationY: Math.PI, kind: 'technical' },
  { id: 'storage', vi: 'Kho thiết bị', en: 'Equipment storage', x: 5.5, z: 4.7, rotationY: Math.PI, kind: 'storage' },
]

const ROOM_FLOOR_COLORS: Record<Room['kind'], string> = {
  meeting: '#f3f7ff',
  dispatch: '#e5f0ff',
  pantry: '#edf5ff',
  planning: '#f2f7ff',
  lounge: '#eef5ff',
  shared: '#f7faff',
  technical: '#e7f1fb',
  inspection: '#edf6ff',
  storage: '#e8f2fb',
}

const ROOM_BUSINESS_INFO: Record<Room['id'], { vi: string; en: string; roles?: string[] }> = {
  meeting: {
    vi: 'Không gian họp chung. Hệ thống hiện không cung cấp lịch hoặc người tham dự trực tiếp.',
    en: 'Shared meeting space. The system does not provide a live meeting schedule or attendee list.',
  },
  dispatch: {
    vi: 'Khu điều hành bay, gắn với vai trò Phi công và Vận hành từ phân công mission.',
    en: 'Flight operations, mapped to Pilot and Operator roles on mission assignments.',
    roles: ['PILOT', 'OPERATOR'],
  },
  pantry: {
    vi: 'Khu sinh hoạt chung. Chuyển động nghỉ giải lao chỉ là mô phỏng hình ảnh.',
    en: 'Shared break area. Break movement is visual simulation only.',
  },
  planning: {
    vi: 'Khu làm việc của quản lý; nhân sự hiển thị là tài khoản quản lý hiện tại.',
    en: 'Manager work area; the displayed person is the current manager account.',
    roles: ['MANAGER'],
  },
  lounge: {
    vi: 'Khu lập kế hoạch minh họa; dữ liệu trên bảng không đại diện cho nhiệm vụ trực tiếp.',
    en: 'Illustrative planning area; its boards do not represent live mission data.',
  },
  shared: {
    vi: 'Bàn làm việc chung cho nhân sự chưa có vai trò nghiệp vụ được xác nhận trong dữ liệu đang tải.',
    en: 'Shared desks for staff without a verified operational role in the loaded data.',
    roles: ['STAFF'],
  },
  technical: {
    vi: 'Khu bảo trì, gắn với vai trò Bảo trì trên các phân công mission đang hoạt động.',
    en: 'Maintenance area, mapped to Maintainer on active mission assignments.',
    roles: ['MAINTAINER'],
  },
  inspection: {
    vi: 'Khu kiểm tra thiết bị, gắn với vai trò Nghiệm thu trên phân công mission.',
    en: 'Equipment inspection area, mapped to Inspector on mission assignments.',
    roles: ['INSPECTOR'],
  },
  storage: {
    vi: 'Kho minh họa. Tình trạng thiết bị và tồn kho không được cung cấp tại màn hình này.',
    en: 'Illustrative storage. Equipment condition and inventory are not provided on this screen.',
  },
}

const PERSON_COLORS = ['#3978eb', '#16a085', '#9b59b6', '#e18c35', '#1f9b71', '#de6a64', '#3e91b8', '#8b73c7']
const AVATAR_SHIRT_COLORS = ['#6c9fe8', '#61b49c', '#a48bd0', '#d99a61', '#72b58a', '#d78380', '#64a2bf', '#9885cf']
const AVATAR_SKIN_TONES = ['#d7a17f', '#c99270', '#e0ad8a', '#c48b69', '#d5a58c', '#bd8464', '#d8a07a', '#cc9878']
const AVATAR_HAIR_TONES = ['#55443b', '#454047', '#625247', '#414750', '#59483f', '#4b4140', '#5e5047', '#47434a']
const WORKING_MISSION_STATUSES = new Set<MissionStatus>(['IN_PROGRESS', 'IN_FLIGHT', 'RETURNING'])
const ROOM_SIZE = { width: 3.48, depth: 2.92 }
const ROOM_SCALE = 1.25
const CORRIDOR_X = [-2.8, 2.8] as const
const CORRIDOR_Z = [-2.4, 2.4] as const

let characterModelsPromise: Promise<[THREE.Group, THREE.Group]> | null = null
let officeEnvironmentPromise: Promise<THREE.Group> | null = null

function loadOfficeEnvironment() {
  if (!officeEnvironmentPromise) {
    const loader = new GLTFLoader()
    officeEnvironmentPromise = loader
      .loadAsync(`${import.meta.env.BASE_URL}models/office/office_environment.glb`)
      .then((gltf) => {
        const names = new Set<string>()
        gltf.scene.traverse((object) => names.add(object.name))
        const missingRooms = ROOMS.filter((room) => !names.has(`ROOM_FLOOR__${room.id}`))
        const missingWorkstations = ['planning__0', 'dispatch__0', 'inspection__0', 'technical__0', 'shared__0']
          .filter((anchor) => !names.has(`WORKSTATION__${anchor}`))
        if (missingRooms.length || missingWorkstations.length) {
          throw new Error('The office environment asset is missing required room or workstation anchors.')
        }
        return gltf.scene
      })
      .catch((error: unknown) => {
        officeEnvironmentPromise = null
        throw error
      })
  }
  return officeEnvironmentPromise
}

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

function createRoomLabel(primary: string, secondary: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 168
  const context = canvas.getContext('2d')
  if (!context) return null

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#172f46f2'
  context.beginPath()
  context.roundRect(10, 10, 620, 148, 34)
  context.fill()
  context.fillStyle = '#ffffff'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '700 40px Inter, Arial, sans-serif'
  context.fillText(primary, 320, 63, 570)
  context.fillStyle = '#d9e8f4'
  context.font = '500 25px Inter, Arial, sans-serif'
  context.fillText(secondary, 320, 112, 570)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.78, 0.47, 1)
  sprite.renderOrder = 4
  return sprite
}

function makeOfficeScene(
  host: HTMLDivElement,
  people: OfficePerson[],
  lang: string,
  onRoomClick: (roomId: string) => void,
  onPersonClick: (personId: string) => void,
  sourceEnvironment: THREE.Group,
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
  scene.background = new THREE.Color('#f5f9ff')
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

  scene.add(new THREE.HemisphereLight('#ffffff', '#a5bfdb', 1.5))
  const keyLight = new THREE.DirectionalLight('#f7fbff', 2.65)
  keyLight.position.set(-8, 15, 10)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  keyLight.shadow.camera.left = -12
  keyLight.shadow.camera.right = 12
  keyLight.shadow.camera.top = 12
  keyLight.shadow.camera.bottom = -12
  keyLight.shadow.bias = -0.0002
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight('#c9ddf5', 1.12)
  fillLight.position.set(9, 7, -8)
  scene.add(fillLight)

  const geometries = new Set<THREE.BufferGeometry>()
  const ownedMaterials = new Set<THREE.Material>()
  const roomFloors = new Map<string, THREE.Mesh>()
  const staffAnchors = new Map<string, THREE.Vector3>()
  const avatarRoots = new Map<string, THREE.Group>()
  const avatars = new Map<string, OfficeAvatar>()
  let currentPeople = new Map<string, OfficePerson>(
    people.map((person) => [person.id, person] as const),
  )
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

  const roomById = new Map(ROOMS.map((room) => [room.id, room]))

  const disposeSprite = (sprite: THREE.Sprite) => {
    sprite.material.map?.dispose()
    sprite.material.dispose()
  }

  const updateAvatarLabel = (avatar: OfficeAvatar, name: string) => {
    if (avatar.personName === name) return
    if (avatar.label) {
      avatar.root.remove(avatar.label)
      disposeSprite(avatar.label)
    }
    const initials = name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()
    const label = createLabel(`${initials} · ${name}`, '#ffffffef', '#19314f')
    if (label) {
      label.position.set(0, 1.78, 0)
      label.scale.set(1.72, 0.48, 1)
      avatar.root.add(label)
    }
    avatar.label = label
    avatar.personName = name
  }

  const updateAvatarWorkingStatus = (avatar: OfficeAvatar, isWorking: boolean) => {
    if (avatar.isWorking === isWorking) return
    if (isWorking) {
      const geometry = new THREE.RingGeometry(0.46, 0.54, 40)
      const material = new THREE.MeshBasicMaterial({
        color: '#16a765',
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const indicator = new THREE.Mesh(geometry, material)
      indicator.name = 'staff-working-indicator'
      indicator.rotation.x = -Math.PI / 2
      indicator.position.y = 0.045
      avatar.root.add(indicator)
      geometries.add(geometry)
      ownedMaterials.add(material)

      const workLabel = createLabel(lang === 'en' ? '● WORKING' : '● ĐANG LÀM', '#dcfce8', '#087a45')
      if (workLabel) {
        workLabel.position.set(0, 2.2, 0)
        workLabel.scale.set(1.12, 0.31, 1)
        workLabel.renderOrder = 6
        avatar.root.add(workLabel)
      }
      avatar.workingGeometry = geometry
      avatar.workingMaterial = material
      avatar.workingIndicator = indicator
      avatar.workLabel = workLabel
      avatar.isWorking = true
      return
    }

    if (avatar.workingIndicator) avatar.root.remove(avatar.workingIndicator)
    if (avatar.workingGeometry) {
      geometries.delete(avatar.workingGeometry)
      avatar.workingGeometry.dispose()
    }
    if (avatar.workingMaterial) {
      ownedMaterials.delete(avatar.workingMaterial)
      avatar.workingMaterial.dispose()
    }
    if (avatar.workLabel) {
      avatar.root.remove(avatar.workLabel)
      disposeSprite(avatar.workLabel)
    }
    avatar.workingGeometry = null
    avatar.workingMaterial = null
    avatar.workingIndicator = null
    avatar.workLabel = null
    avatar.isWorking = false
  }

  const updatePeople = (nextPeople: OfficePerson[]) => {
    currentPeople = new Map<string, OfficePerson>(
      nextPeople.map((person) => [person.id, person] as const),
    )
    for (const person of nextPeople) {
      const avatar = avatars.get(person.id)
      if (!avatar) continue
      updateAvatarLabel(avatar, person.name)
      updateAvatarWorkingStatus(
        avatar,
        person.missions.some((mission) => WORKING_MISSION_STATUSES.has(mission.status)),
      )
    }
    render()
    scheduleAnimationFrame()
  }

  const environmentRoot = sourceEnvironment.clone(true)
  environmentRoot.name = 'office-environment'
  const workstationAnchors = new Map<string, Array<{ index: number; position: THREE.Vector3 }>>()
  const roomSignPositions = new Map<string, THREE.Vector3>()

  environmentRoot.updateMatrixWorld(true)
  environmentRoot.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const firstMaterial = Array.isArray(object.material) ? object.material[0] : object.material
      const isTransparent = Boolean(firstMaterial?.transparent)
      object.castShadow = !isTransparent
      object.receiveShadow = true

      const floorMatch = /^ROOM_FLOOR__(.+)$/.exec(object.name)
      if (floorMatch) {
        const room = roomById.get(floorMatch[1])
        if (room) {
          const floor = object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
          const material = floor.material.clone()
          const baseColor = ROOM_FLOOR_COLORS[room.kind]
          material.color.set(baseColor)
          material.roughness = Math.max(material.roughness, 0.72)
          floor.material = material
          floor.userData.roomId = room.id
          floor.userData.baseColor = baseColor
          roomFloors.set(room.id, floor)
          ownedMaterials.add(material)
          clickables.push(floor)
        }
      }
    }

    const workstationMatch = /^WORKSTATION__([^_]+)__(\d+)$/.exec(object.name)
    if (workstationMatch) {
      const [, roomId, indexText] = workstationMatch
      const position = object.getWorldPosition(new THREE.Vector3())
      const anchors = workstationAnchors.get(roomId) ?? []
      anchors.push({ index: Number(indexText), position })
      workstationAnchors.set(roomId, anchors)
    }

    const signMatch = /^ROOM_SIGN__(.+)$/.exec(object.name)
    if (signMatch) {
      roomSignPositions.set(signMatch[1], object.getWorldPosition(new THREE.Vector3()))
    }
  })

  scene.add(environmentRoot)
  for (const room of ROOMS) {
    const position = roomSignPositions.get(room.id)
    if (!position) continue
    const primary = lang === 'en' ? room.en : room.vi
    const secondary = lang === 'en' ? room.vi : room.en
    const sign = createRoomLabel(primary, secondary)
    if (sign) {
      sign.position.copy(position)
      scene.add(sign)
    }
  }

  const workstations: Array<{ roomId: string; index: number; position: THREE.Vector3 }> = []
  for (const [roomId, anchors] of workstationAnchors) {
    anchors.sort((a, b) => a.index - b.index)
    workstations.push(...anchors.map(({ index, position }) => ({ roomId, index, position })))
  }

  const assignedWorkstations = new Set<number>()
  const workstationFor = (person: OfficePerson, index: number) => {
    const preferredRoom = resolveOfficeArea(person.isManager, person.roles)
    const preferredIndex = preferredRoom
      ? workstations.findIndex((station, stationIndex) => station.roomId === preferredRoom && !assignedWorkstations.has(stationIndex))
      : -1
    let stationIndex = preferredIndex
    if (stationIndex < 0) {
      stationIndex = Array.from({ length: workstations.length }, (_, offset) => (index + offset) % workstations.length)
        .find((candidate) => !assignedWorkstations.has(candidate)) ?? -1
    }
    if (stationIndex < 0) {
      const room = roomById.get(preferredRoom) ?? roomById.get('dispatch')!
      const overflow = Math.max(index - workstations.length + 1, 1)
      const x = (overflow - 1) % 2 ? 0.85 : -0.85
      const z = 0.85 + Math.floor((overflow - 1) / 2) * 0.22
      return { room, x, z, position: roomWorldPosition(room, x, z) }
    }
    assignedWorkstations.add(stationIndex)
    const station = workstations[stationIndex]
    const room = roomById.get(station.roomId) ?? roomById.get('dispatch')!
    return { room, x: 0, z: 0, position: station.position.clone() }
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
    const roomThreshold = (room: Room) => roomWorldPosition(room, 0, ROOM_SIZE.depth / 2 - 0.28)
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
      roomThreshold(from),
      fromDoor,
      from.z !== 0 ? new THREE.Vector3(fromDoor.x, 0, fromLane.z) : new THREE.Vector3(fromLane.x, 0, fromDoor.z),
      fromLane,
      // Keep the first corridor node: skipping it creates a diagonal shortcut
      // from the doorway that cuts across room partitions.
      ...graphPoints,
      toLane,
      to.z !== 0 ? new THREE.Vector3(toDoor.x, 0, toLane.z) : new THREE.Vector3(toLane.x, 0, toDoor.z),
      toDoor,
      roomThreshold(to),
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
    ;[...currentPeople.values()].forEach((person, index) => {
      // Keep the illustrative character stable when people are filtered or re-ordered.
      const source = stablePersonOffset(person.id, 2) === 0 ? maleModel : femaleModel
      const model = SkeletonUtils.clone(source) as THREE.Group
      const workstation = workstationFor(person, index)
      const chairSeat = workstation.position.clone()
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
          if (colored.color) {
            const paletteIndex = stablePersonOffset(person.id, AVATAR_SKIN_TONES.length)
            if (materialName.includes('skin')) {
              colored.color.set(AVATAR_SKIN_TONES[paletteIndex])
            } else if (materialName.includes('face')) {
              colored.color.set(AVATAR_SKIN_TONES[paletteIndex]).lerp(new THREE.Color('#fff0df'), 0.14)
            } else if (materialName.includes('shirt') || materialName.includes('material')) {
              colored.color.set(AVATAR_SHIRT_COLORS[paletteIndex])
            } else if (materialName.includes('hair')) {
              colored.color.set(AVATAR_HAIR_TONES[paletteIndex])
            } else if (materialName.includes('pants')) {
              colored.color.set('#526176')
            } else if (materialName.includes('belt')) {
              colored.color.set('#75604d')
            }
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
      geometries.add(haloGeometry)
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
        personName: person.name,
        root,
        mixer,
        actions,
        seat,
        sitHipOffset,
        room: workstation.room,
        state: 'sitting',
        stateTime: 0,
        // Start the team queue as soon as the scene loads; only one person travels at a time.
        waitTime: 0,
        path: [],
        pathIndex: 0,
        color: colorForPerson(person.id),
        halo,
        label,
        isWorking: false,
        workingIndicator: null,
        workingGeometry: null,
        workingMaterial: null,
        workLabel: null,
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
      updateAvatarWorkingStatus(
        avatar,
        person.missions.some((mission) => WORKING_MISSION_STATUSES.has(mission.status)),
      )
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
      if (breakTravelerId === avatar.personId) breakTravelerId = null
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
        avatar.waitTime = 4 + stablePersonOffset(avatar.personId, 5)
        avatar.stateTime = startAnimation(avatar, avatar.animationKeys.sit ?? '', true)
      } else {
        avatar.root.rotation.y = avatar.room.rotationY + Math.PI
        avatar.state = 'sitting'
        avatar.stateTime = startAnimation(avatar, avatar.animationKeys.sit ?? '', true)
        avatar.waitTime = 2 + stablePersonOffset(avatar.personId, 3)
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
        ((avatar.state === 'sitting' || avatar.state === 'on-break') && avatar.stateTime <= 0)
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
  renderer.domElement.addEventListener('pointerleave', onPointerLeave)
  renderer.domElement.addEventListener('click', onCanvasClick)
  renderer.domElement.addEventListener('dblclick', onCanvasDoubleClick)
  renderer.domElement.addEventListener('keydown', onCanvasKeyDown)
  const onVisibilityChange = () => {
    previousFrameTime = 0
    if (!document.hidden && !animationsPaused) scheduleAnimationFrame()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  let hoveredRoomId: string | null = null
  let hoveredStaffId: string | null = null

  function targetAt(clientX: number, clientY: number) {
    const rect = renderer.domElement.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    return raycaster.intersectObjects(clickables, true)
      .map((hit) => findTarget(hit.object))
      .find((value) => value !== null) ?? null
  }

  function setStaffHalo(staffId: string | null, opacity: number) {
    if (!staffId) return
    const halo = avatarRoots.get(staffId)?.getObjectByName('staff-selection-halo')
    if (halo instanceof THREE.Mesh && halo.material instanceof THREE.MeshBasicMaterial) {
      halo.material.opacity = opacity
    }
  }

  function setHoveredTarget(target: { roomId?: string; staffId?: string } | null) {
    const nextRoomId = target?.roomId ?? null
    const nextStaffId = target?.staffId ?? null
    if (nextRoomId === hoveredRoomId && nextStaffId === hoveredStaffId) return

    const selectedStaffId = host.dataset.selectedStaffId ?? null
    if (hoveredRoomId && hoveredRoomId !== nextRoomId) {
      const material = roomFloors.get(hoveredRoomId)?.material as THREE.MeshStandardMaterial | undefined
      material?.emissive.set('#000000')
      if (material) material.emissiveIntensity = 0
    }
    if (nextRoomId) {
      const material = roomFloors.get(nextRoomId)?.material as THREE.MeshStandardMaterial | undefined
      material?.emissive.set('#77a8e8')
      if (material) material.emissiveIntensity = 0.16
    }
    if (hoveredStaffId && hoveredStaffId !== nextStaffId) {
      setStaffHalo(hoveredStaffId, hoveredStaffId === selectedStaffId ? 0.9 : 0.18)
    }
    if (nextStaffId) setStaffHalo(nextStaffId, nextStaffId === selectedStaffId ? 0.9 : 0.52)

    hoveredRoomId = nextRoomId
    hoveredStaffId = nextStaffId
    host.dataset.hoveredStaffId = nextStaffId ?? ''
    if (nextStaffId) {
      const person = currentPeople.get(nextStaffId)
      renderer.domElement.title = person
        ? `${person.name} · ${person.roles.filter((role) => role !== 'STAFF').map((role) => roleLabel(role, lang === 'en')).join(' · ') || (lang === 'en' ? 'Staff' : 'Nhân sự')}`
        : ''
    } else if (nextRoomId) {
      const room = roomById.get(nextRoomId)
      renderer.domElement.title = room ? (lang === 'en' ? room.en : room.vi) : ''
    } else {
      renderer.domElement.title = ''
    }
    render()
  }

  function onPointerMove(event: PointerEvent) {
    const target = targetAt(event.clientX, event.clientY)
    renderer.domElement.style.cursor = target ? 'pointer' : 'grab'
    setHoveredTarget(target)
  }

  function onPointerLeave() {
    renderer.domElement.style.cursor = 'grab'
    setHoveredTarget(null)
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
    const target = targetAt(event.clientX, event.clientY)
    if (target?.staffId) onPersonClick(target.staffId)
    else if (target?.roomId) onRoomClick(target.roomId)
  }

  function onCanvasDoubleClick(event: MouseEvent) {
    const target = targetAt(event.clientX, event.clientY)
    if (target?.staffId) {
      onPersonClick(target.staffId)
      focusPerson(target.staffId)
    } else if (target?.roomId) {
      onRoomClick(target.roomId)
      focusRoom(target.roomId)
    }
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
    const room = roomById.get(roomId)
    const target = room
      ? new THREE.Vector3(room.x, 0, room.z)
      : roomFloors.get(roomId)?.getWorldPosition(new THREE.Vector3())
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
    updatePeople,
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
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      renderer.domElement.removeEventListener('click', onCanvasClick)
      renderer.domElement.removeEventListener('dblclick', onCanvasDoubleClick)
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
  'WAITING_OPERATOR_ACCEPTANCE',
  'READY',
  'SCHEDULED',
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
  includeMissionId?: string,
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
    if (!ACTIVE_WORK_STATUSES.has(mission.status) && mission.id !== includeMissionId) continue
    const mainDevice =
      mission.deviceAssignments?.find((item) => item.deviceRole === 'MAIN') ??
      mission.deviceAssignments?.[0]
    const device =
      mainDevice?.deviceName ??
      mainDevice?.deviceCode ??
      mission.droneName ??
      mission.droneCode ??
      null
    const assignments = getVisibleMissionStaffAssignments(
      mission.status,
      mission.staffAssignments,
    )
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
    WORKING_MISSION_STATUSES.has(mission.status),
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

  const currentlyWorking = WORKING_MISSION_STATUSES.has(mission.status)
  return {
    label: getMissionStatusLabel(mission.status, lang),
    detail: mission.code + (mission.title ? ' · ' + mission.title : ''),
    tone: currentlyWorking ? 'active' : 'preparing',
  }
}

export function Office3DView({
  staff,
  missions,
  assignmentMissionId,
  assignmentCanEdit,
  assignmentReplaceStaffId,
  assignmentReturnOrderId,
  assignmentMission,
  assignmentCandidates,
  assignmentLoading,
  onAssignmentChanged,
  manager,
  loading,
  lang,
}: {
  staff: AvailableOperator[]
  missions: MissionCalendarItem[]
  assignmentMissionId?: string
  assignmentCanEdit: boolean
  assignmentReplaceStaffId?: string
  assignmentReturnOrderId?: string
  assignmentMission: MissionCalendarItem | null
  assignmentCandidates: AvailableOperator[]
  assignmentLoading: boolean
  onAssignmentChanged: (mission?: MissionCalendarItem) => void
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
  const [assignmentSelectedStaffId, setAssignmentSelectedStaffId] = useState<string | null>(null)
  const [sceneLoading, setSceneLoading] = useState(true)
  const [sceneError, setSceneError] = useState(false)
  const [followPersonId, setFollowPersonId] = useState<string | null>(null)
  const [animationsPaused, setAnimationsPaused] = useState(false)
  const [teamRailVisible, setTeamRailVisible] = useState(true)
  const [department, setDepartment] = useState<'all' | 'flight' | 'technical' | 'management' | 'shared'>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const animationsPausedRef = useRef(animationsPaused)
  const followPersonIdRef = useRef(followPersonId)

  const activeMissions = useMemo(
    () => missions.filter((mission) => ACTIVE_WORK_STATUSES.has(mission.status)),
    [missions],
  )
  const peopleMissions = useMemo(() => {
    if (!assignmentMission) return activeMissions
    return [
      ...activeMissions.filter((mission) => mission.id !== assignmentMission.id),
      assignmentMission,
    ]
  }, [activeMissions, assignmentMission])
  const people = useMemo(
    () => collectPeople(staff, peopleMissions, manager, assignmentMissionId),
    [staff, peopleMissions, manager, assignmentMissionId],
  )
  const visiblePeople = useMemo(() => people.filter((item) => {
    if (department === 'all') return true
    if (department === 'management') return item.isManager
    const area = resolveOfficeArea(item.isManager, item.roles)
    if (department === 'flight') return area === 'dispatch'
    if (department === 'technical') return area === 'technical' || area === 'inspection'
    if (department === 'shared') return area === 'shared'
    return false
  }), [people, department])
  const visiblePeopleKey = visiblePeople.map((item) => item.id).sort().join('\u0000')
  const visiblePeopleRef = useRef(visiblePeople)
  visiblePeopleRef.current = visiblePeople
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
  const roomInfo = room ? ROOM_BUSINESS_INFO[room.id] : null
  const roomPeople = room
    ? people.filter((item) => resolveOfficeArea(item.isManager, item.roles) === room.id)
    : []
  const onRoomClick = useCallback((id: string) => {
    setSelectedRoom(id)
    setSelectedPerson(null)
    setAssignmentSelectedStaffId(null)
    setFollowPersonId(null)
    setTeamRailVisible(true)
  }, [])
  const onPersonClick = useCallback((id: string) => {
    setSelectedPerson(id)
    setAssignmentSelectedStaffId(id)
    setSelectedRoom(null)
    setFollowPersonId(null)
    setTeamRailVisible(true)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false
    let handle: SceneHandle | null = null
    setSceneLoading(true)
    setSceneError(false)

    // The 3D canvas is exercised in a real browser; jsdom has no WebGL context.
    if (import.meta.env.MODE === 'test') {
      setSceneLoading(false)
      setSceneError(true)
      return () => {
        cancelled = true
      }
    }

    void loadOfficeEnvironment()
      .then((environment) => {
        if (cancelled) return
        try {
          handle = makeOfficeScene(host, visiblePeopleRef.current, lang, onRoomClick, onPersonClick, environment)
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
          setSceneLoading(false)
        } catch (error) {
          console.warn('The office scene could not be created.', error)
          setSceneError(true)
          setSceneLoading(false)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.warn('The office environment could not be loaded.', error)
        setSceneError(true)
        setSceneLoading(false)
      })

    return () => {
      cancelled = true
      handle?.dispose()
      if (sceneRef.current === handle) sceneRef.current = null
    }
    // Keep the expensive 3D scene stable when assignments only change staff details.
    // Rebuild only when the visible roster or display language changes.
  }, [visiblePeopleKey, lang, onRoomClick, onPersonClick])

  useEffect(() => {
    sceneRef.current?.updatePeople(visiblePeople)
  }, [visiblePeople])

  useEffect(() => {
    selectedRoomRef.current = selectedRoom
    const handle = sceneRef.current
    if (!handle) return
    for (const [roomId, floor] of handle.roomFloors) {
      const material = floor.material as THREE.MeshStandardMaterial
      const base = floor.userData.baseColor as string
      material.color.set(roomId === selectedRoom ? '#d5e8ff' : base)
    }
    if (selectedRoom) handle.focusRoom(selectedRoom)
    handle.render()
  }, [selectedRoom])

  useEffect(() => {
    selectedPersonRef.current = selectedPerson
    if (hostRef.current) hostRef.current.dataset.selectedStaffId = selectedPerson ?? ''
    const handle = sceneRef.current
    if (!handle) return
    for (const [staffId, root] of handle.avatarRoots) {
      const halo = root.getObjectByName('staff-selection-halo')
      if (halo instanceof THREE.Mesh && halo.material instanceof THREE.MeshBasicMaterial) {
        const isHovered = hostRef.current?.dataset.hoveredStaffId === staffId
        halo.material.opacity = staffId === selectedPerson ? 0.9 : isHovered ? 0.52 : 0.18
      }
    }
    if (selectedPerson) handle.focusPerson(selectedPerson)
    else handle.setFollowPerson(null)
    handle.render()
  }, [selectedPerson])

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
        keyboard: 'Click to select · double-click to focus · + / − to zoom · R to reset.',
        note: 'Illustrative office layout · staff and work status come from the system.',
        reset: 'Reset view',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        selectedRoom: 'Selected room',
        chooseArea: 'Choose an area to inspect',
        focusArea: 'Focus an area',
        associatedStaff: 'Staff mapped by role',
        noMappedStaff: 'No matching staff in the current data.',
        roleScope: 'Business mapping',
        currentWork: 'Current work',
        noCurrentWork: 'No active work is assigned.',
        teamEmpty: 'No staff accounts are available.',
        missionTitle: 'Work in progress',
        missionEmpty: 'There are no active mission tasks right now.',
        device: 'Device',
        fallback: 'The office model could not be loaded. Use the team and office area panels to review current information.',
        detail: 'Team member details',
        rooms: 'Office areas',
        loading: 'Loading team information…',
        sceneLoading: 'Preparing the 3D office…',
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
        sharedDepartment: 'Shared workspace',
        motionDisclosure: 'People, roles and mission statuses come from the system; positions and movement are illustrative.',
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
        keyboard: 'Nhấn để chọn · nhấn đúp để tập trung · + / − để thu phóng · R để đặt lại.',
        note: 'Bố trí văn phòng mang tính minh họa · nhân sự và trạng thái công việc lấy từ hệ thống.',
        reset: 'Đặt lại góc nhìn',
        zoomIn: 'Phóng to',
        zoomOut: 'Thu nhỏ',
        selectedRoom: 'Khu vực đang chọn',
        chooseArea: 'Chọn khu vực cần xem',
        focusArea: 'Tập trung khu vực',
        associatedStaff: 'Nhân sự theo vai trò',
        noMappedStaff: 'Không có nhân sự phù hợp trong dữ liệu hiện tại.',
        roleScope: 'Phân khu theo nghiệp vụ',
        currentWork: 'Công việc hiện tại',
        noCurrentWork: 'Chưa có công việc đang được giao.',
        teamEmpty: 'Chưa có tài khoản nhân sự đang hoạt động.',
        missionTitle: 'Công việc đang xử lý',
        missionEmpty: 'Hiện chưa có nhiệm vụ nào đang hoạt động.',
        device: 'Thiết bị',
        fallback: 'Chưa tải được mô hình văn phòng 3D. Bạn vẫn có thể xem đội ngũ và chọn khu vực từ các bảng bên cạnh.',
        detail: 'Thông tin nhân sự',
        rooms: 'Khu vực văn phòng',
        loading: 'Đang tải thông tin đội ngũ…',
        sceneLoading: 'Đang dựng không gian văn phòng 3D…',
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
        sharedDepartment: 'Khu làm việc chung',
        motionDisclosure: 'Nhân sự, vai trò và trạng thái mission lấy từ hệ thống; vị trí và chuyển động chỉ mang tính minh họa.',
      }

  const activePeopleCount = people.filter(
    (item) =>
      !item.isManager &&
      item.missions.some((mission) => ACTIVE_WORK_STATUSES.has(mission.status)),
  ).length

  const renderMission = (mission: OfficePerson['missions'][number]) => (
    <article className="mgr-office-work-item" key={mission.id}>
      <div className="mgr-office-work-item-top">
        <strong>{mission.code}</strong>
        <span className={'mgr-office-status is-' + (
          WORKING_MISSION_STATUSES.has(mission.status)
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
                className="mgr-office-room-select"
                aria-label={copy.chooseArea}
                placeholder={copy.focusArea}
                value={selectedRoom ?? undefined}
                allowClear
                onChange={(value: string | undefined) => value ? onRoomClick(value) : setSelectedRoom(null)}
                options={ROOMS.map((item) => ({ value: item.id, label: isEnglish ? item.en : item.vi }))}
              />
              <Select
                className="mgr-office-department-select"
                aria-label={copy.department}
                value={department}
                onChange={(value) => {
                  setDepartment(value)
                  setSelectedPerson(null)
                  setSelectedRoom(null)
                  setFollowPersonId(null)
                }}
                options={[
                  { value: 'all', label: copy.allDepartments },
                  { value: 'flight', label: copy.flightDepartment },
                  { value: 'technical', label: copy.technicalDepartment },
                  { value: 'management', label: copy.managementDepartment },
                  { value: 'shared', label: copy.sharedDepartment },
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
                    setAssignmentSelectedStaffId(null)
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
            {sceneLoading && !sceneError && (
              <div className="mgr-office-model-loading" role="status" aria-live="polite">
                <span className="mgr-office-model-loading-spinner" aria-hidden="true" />
                <span>{copy.sceneLoading}</span>
              </div>
            )}
            <div className="mgr-office-canvas-overlay">
              <span><i className="is-active" />{visiblePeople.length} {copy.people.toLocaleLowerCase(locale)}</span>
              <span>{ROOMS.length} {copy.rooms.toLocaleLowerCase(locale)}</span>
            </div>
            <div className="mgr-office-canvas-caption">
              <span><i />{isEnglish ? 'Roles and missions from system data' : 'Vai trò và mission từ dữ liệu hệ thống'}</span>
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
          {assignmentMissionId && (
            <OfficeMissionAssignmentPanel
              mission={assignmentMission}
              candidates={assignmentCandidates}
              loading={assignmentLoading}
              canEdit={assignmentCanEdit}
              replacementStaffId={assignmentReplaceStaffId}
              returnToHref={
                assignmentReturnOrderId
                  ? managerHref({
                      screen: 'orderReview',
                      orderId: assignmentReturnOrderId,
                    })
                  : assignmentMissionId
                    ? managerHref({
                        screen: 'missionDetail',
                        missionId: assignmentMissionId,
                      })
                    : undefined
              }
              lang={lang}
              selectedStaffId={assignmentSelectedStaffId}
              onSelectedStaffChange={setAssignmentSelectedStaffId}
              onAssignmentChanged={onAssignmentChanged}
              onStaffFocus={onPersonClick}
            />
          )}
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
                  person.missions.map((mission) => (
                    <StaffMissionActivity
                      key={mission.id}
                      mission={mission}
                      lang={locale}
                    />
                  ))
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
              <p>{isEnglish ? roomInfo?.en : roomInfo?.vi}</p>
              {roomInfo?.roles && (
                <div className="mgr-office-room-role-scope">
                  <span>{copy.roleScope}</span>
                  <div className="mgr-office-role-list">
                    {roomInfo.roles.map((role) => <Tag key={role}>{roleLabel(role, isEnglish)}</Tag>)}
                  </div>
                </div>
              )}
              <div className="mgr-office-detail-section is-column mgr-office-room-staff">
                <span>{copy.associatedStaff}</span>
                {roomPeople.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noMappedStaff} />
                ) : (
                  <div className="mgr-office-room-people-list">
                    {roomPeople.map((item) => {
                      const activity = activityFor(item, isEnglish, locale)
                      const roleText = item.isManager
                        ? copy.manager
                        : item.roles.filter((role) => role !== 'STAFF').map((role) => roleLabel(role, isEnglish)).join(' · ') || roleLabel('STAFF', isEnglish)
                      return (
                        <button type="button" key={item.id} onClick={() => onPersonClick(item.id)}>
                          <span className="mgr-office-room-person-copy">
                            <strong>{item.name}</strong>
                            <small>{roleText}</small>
                          </span>
                          <span className={'mgr-office-status is-' + activity.tone}>{activity.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
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

          {!person && (
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
          )}
        </aside>}
      </div>
    </section>
  )
}
