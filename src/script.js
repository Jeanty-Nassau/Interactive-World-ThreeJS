import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvas = document.querySelector('canvas.webgl')
const container = document.querySelector('#canvasContainer')
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x05070b)

const textureLoader = new THREE.TextureLoader()
const nightTexture = textureLoader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
const topologyTexture = textureLoader.load('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')

nightTexture.encoding = THREE.sRGBEncoding
nightTexture.anisotropy = 8
topologyTexture.anisotropy = 8

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(2.08, 128, 128),
  new THREE.MeshStandardMaterial({
    map: nightTexture,
    bumpMap: topologyTexture,
    bumpScale: 0.11,
    color: 0x91a7ff,
    emissive: 0xff6a00,
    emissiveMap: nightTexture,
    emissiveIntensity: 0.72,
    roughness: 0.68,
    metalness: 0.08,
  })
)

const wire = new THREE.Mesh(
  new THREE.SphereGeometry(2.11, 52, 52),
  new THREE.MeshBasicMaterial({
    color: 0x91a7ff,
    wireframe: true,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
  })
)

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.28, 72, 72),
  new THREE.MeshBasicMaterial({
    color: 0x1847ff,
    transparent: true,
    opacity: 0.13,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
)

const globe = new THREE.Group()
globe.rotation.z = THREE.MathUtils.degToRad(-23.4)
globe.add(earth, wire, atmosphere)
scene.add(globe)

const orbitRig = new THREE.Group()
scene.add(orbitRig)

function addOrbit(radius, rotation, color, opacity, thickness = 0.008) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, thickness, 8, 240),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
    })
  )
  ring.rotation.set(...rotation)
  orbitRig.add(ring)
}

addOrbit(2.82, [Math.PI / 2.2, 0.12, 0.18], 0xff991c, 0.82, 0.014)
addOrbit(3.28, [1.02, 0.52, 0.78], 0x91a7ff, 0.42, 0.007)
addOrbit(3.72, [0.28, 1.1, 0.36], 0xff991c, 0.24, 0.004)

const signals = [
  { position: [2.68, 0.86, 0], color: 0xff991c, size: 0.075 },
  { position: [-2.45, -1.18, 0.38], color: 0x91a7ff, size: 0.05 },
  { position: [0.35, 2.95, -0.45], color: 0xf7f7f2, size: 0.045 },
]

signals.forEach(({ position, color, size }) => {
  const signal = new THREE.Mesh(
    new THREE.SphereGeometry(size, 18, 18),
    new THREE.MeshBasicMaterial({ color })
  )
  signal.position.set(...position)
  orbitRig.add(signal)
})

const starPositions = new Float32Array(1100 * 3)
for (let index = 0; index < 1100; index += 1) {
  const radius = 14 + Math.random() * 36
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)

  starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
  starPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
  starPositions[index * 3 + 2] = radius * Math.cos(phi)
}

const starGeometry = new THREE.BufferGeometry()
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xf7f7f2,
    size: 0.035,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true,
  })
)
scene.add(stars)

scene.add(new THREE.AmbientLight(0xffffff, 0.22))

const keyLight = new THREE.DirectionalLight(0xffffff, 1.35)
keyLight.position.set(6, 4, 7)
scene.add(keyLight)

const cobaltLight = new THREE.PointLight(0x1847ff, 2.2, 30)
cobaltLight.position.set(-5, 1.5, 4)
scene.add(cobaltLight)

const orangeLight = new THREE.PointLight(0xff991c, 1.2, 24)
orangeLight.position.set(4, -2, 2)
scene.add(orangeLight)

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120)
camera.position.set(0, 0, 6.5)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.055
controls.enablePan = false
controls.enableZoom = true
controls.minDistance = 5.2
controls.maxDistance = 10
controls.minPolarAngle = Math.PI * 0.18
controls.maxPolarAngle = Math.PI * 0.82
controls.target.set(0, 0, 0)

document.querySelector('[data-reset-view]')?.addEventListener('click', () => {
  camera.position.set(0, 0, 6.5)
  controls.target.set(0, 0, 0)
  controls.update()
})

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
})
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor(0x05070b, 1)

function resize() {
  const width = Math.max(container.clientWidth, 1)
  const height = Math.max(container.clientHeight, 1)

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', resize)
resize()

const clock = new THREE.Clock()

function tick() {
  const delta = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.elapsedTime

  if (!prefersReducedMotion) {
    earth.rotation.y += delta * 0.045
    stars.rotation.y -= delta * 0.004
    orbitRig.rotation.y += delta * 0.12
    orbitRig.rotation.z = Math.sin(elapsed * 0.18) * 0.08
  }

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()
