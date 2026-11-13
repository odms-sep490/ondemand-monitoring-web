import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

/** Decorative Blender scene. It never represents live flight telemetry. */
export default function OverviewScene() {
  const host = useRef<HTMLDivElement>(null)
  const paused = useRef(false)
  const [playing, setPlaying] = useState(true)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    if (!host.current) return
    const container = host.current
    let disposed = false
    let frame = 0
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) }
    catch { setState('error'); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0xeaf2ef, 1)
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 500)
    camera.position.set(115, 90, 125)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 12, 0)
    controls.enableDamping = true
    controls.enablePan = false
    controls.minDistance = 85
    controls.maxDistance = 240
    controls.maxPolarAngle = Math.PI / 2.1
    scene.add(new THREE.HemisphereLight(0xffffff, 0x859c83, 2.5))
    const sun = new THREE.DirectionalLight(0xfff4de, 3)
    sun.position.set(50, 100, 60); scene.add(sun)
    const addMesh = (geometry: THREE.BufferGeometry, color: number, parent: THREE.Object3D = scene) => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .7 }))
      parent.add(mesh); return mesh
    }
    const ground = addMesh(new THREE.CylinderGeometry(91, 94, 2, 80), 0xcbdac7)
    ground.position.y = -1.5
    const plaza = addMesh(new THREE.CylinderGeometry(59, 60, .3, 80), 0xe4e4d9)
    plaza.position.y = -.2
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2
      const tree = new THREE.Group(); scene.add(tree)
      tree.position.set(Math.cos(a) * 77, 0, Math.sin(a) * 77)
      const trunk = addMesh(new THREE.CylinderGeometry(.4, .5, 4, 6), 0x82634b, tree); trunk.position.y = 2
      const crown = addMesh(new THREE.IcosahedronGeometry(4, 1), i % 2 ? 0x6e9871 : 0x8caa76, tree); crown.position.y = 6
    }
    const routePoints = Array.from({ length: 129 }, (_, i) => {
      const a = i / 128 * Math.PI * 2
      return new THREE.Vector3(Math.cos(a) * 64, 33, Math.sin(a) * 64)
    })
    const route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(routePoints), new THREE.LineBasicMaterial({ color: 0x168bff }))
    scene.add(route)
    for (let i = 0; i < 4; i++) {
      const point = addMesh(new THREE.SphereGeometry(1.8, 16, 12), 0x168bff)
      point.position.copy(routePoints[i * 32])
    }
    const drone = new THREE.Group(); scene.add(drone)
    const body = addMesh(new THREE.BoxGeometry(3, 1, 2), 0xfafafa, drone)
    body.position.y = .3
    for (const x of [-2.5, 2.5]) for (const z of [-2, 2]) {
      const arm = addMesh(new THREE.CylinderGeometry(.15, .15, 3, 8), 0x344355, drone)
      arm.position.set(x / 2, 0, z / 2); arm.rotation.z = Math.PI / 2; arm.rotation.y = -Math.atan2(z, x)
      const rotor = addMesh(new THREE.CylinderGeometry(1.6, 1.6, .08, 20), 0x26394d, drone)
      rotor.position.set(x, .6, z)
    }
    new GLTFLoader().load('/models/overview/culture-house.glb', (gltf) => {
      if (disposed) { gltf.scene.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose() }); return }
      const model = gltf.scene
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.set(-center.x, -box.min.y, -center.z)
      scene.add(model); setState('ready')
    }, undefined, () => { if (!disposed) setState('error') })
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix()
    })
    resize.observe(container)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let angle = 0, previous = performance.now()
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate)
      const dt = Math.min((now - previous) / 1000, .05); previous = now
      if (!document.hidden && !paused.current && !reduced.matches) angle -= dt * .16
      drone.position.set(Math.cos(angle) * 64, 33, Math.sin(angle) * 64)
      drone.lookAt(0, 33, 0)
      controls.update(); renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); controls.dispose()
      scene.traverse((o) => { if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        o.geometry.dispose(); const materials = Array.isArray(o.material) ? o.material : [o.material]
        materials.forEach((m) => { for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose(); m.dispose() })
      } })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])
  return <div className="overview-scene-wrap">
    <div ref={host} className="overview-scene" role="img" aria-label="Mô hình 3D Nhà Văn hóa Sinh viên với drone bay quanh" />
    <span className="overview-scene-label">Sa bàn 3D · Mô phỏng minh họa</span>
    {state === 'loading' && <div className="overview-scene-state" role="status">Đang tải mô hình 3D…</div>}
    {state === 'error' && <div className="overview-scene-state" role="status">Không tải được sa bàn 3D. Bạn vẫn có thể xem đơn hàng bên dưới.</div>}
    <div className="overview-scene-bottom"><div><strong>Nhà Văn hóa Sinh viên</strong><span>Chụp 4 góc · Quay một vòng</span></div><button type="button" aria-pressed={!playing} onClick={() => { paused.current = playing; setPlaying(!playing) }}>{playing ? 'Tạm dừng' : 'Tiếp tục'}</button></div>
    <span className="overview-scene-hint">Kéo để xoay · Cuộn để thu phóng</span>
  </div>
}
