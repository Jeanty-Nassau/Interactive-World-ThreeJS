import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvas = document.querySelector('canvas.webgl')
const container = document.querySelector('#canvasContainer')
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scene = new THREE.Scene()

const textureLoader = new THREE.TextureLoader()
const earthTexture = textureLoader.load('/earth.jpeg')
earthTexture.encoding = THREE.sRGBEncoding
earthTexture.anisotropy = 8

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(3.05, 96, 96),
  new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.82,
    metalness: 0.02,
  })
)

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(3.05, 96, 96),
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
        gl_FragColor = vec4(0.12, 0.36, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  })
)
atmosphere.scale.setScalar(1.08)

const globe = new THREE.Group()
globe.add(earth, atmosphere)
globe.rotation.z = THREE.MathUtils.degToRad(-23.4)
scene.add(globe)

const starPositions = new Float32Array(950 * 3)
for (let index = 0; index < 950; index += 1) {
  const radius = 18 + Math.random() * 42
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
    size: 0.045,
    transparent: true,
    opacity: 0.68,
    sizeAttenuation: true,
  })
)
scene.add(stars)

scene.add(new THREE.AmbientLight(0x6f7da8, 0.55))

const keyLight = new THREE.DirectionalLight(0xffffff, 1.9)
keyLight.position.set(6, 4, 7)
scene.add(keyLight)

const rimLight = new THREE.PointLight(0x1847ff, 2.2, 30)
rimLight.position.set(-7, 1.5, 3)
scene.add(rimLight)

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120)
camera.position.set(0.7, 0.25, 10.8)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.055
controls.enablePan = false
controls.enableZoom = true
controls.minDistance = 8.2
controls.maxDistance = 14.5
controls.minPolarAngle = Math.PI * 0.24
controls.maxPolarAngle = Math.PI * 0.76
controls.autoRotate = !prefersReducedMotion
controls.autoRotateSpeed = 0.34
controls.target.set(0, 0, 0)

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

const resetButton = document.querySelector('[data-reset-view]')
resetButton?.addEventListener('click', () => {
  camera.position.set(0.7, 0.25, 10.8)
  controls.target.set(0, 0, 0)
  controls.update()
})

const clock = new THREE.Clock()

function tick() {
  const delta = Math.min(clock.getDelta(), 0.05)

  if (!prefersReducedMotion) {
    earth.rotation.y += delta * 0.055
    stars.rotation.y -= delta * 0.003
  }

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

tick()
