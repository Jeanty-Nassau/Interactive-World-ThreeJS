import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Objects
const geometry = new THREE.SphereGeometry(5,50,50);
const starGeometry = new THREE.BufferGeometry();

//..shaders for sphere
const MY_VERTEX_SHADER  = `
    varying vec2 vertexUV; 
    varying vec3 vertexNormal;
    void main(){ 
        vertexNormal = normalize(normalMatrix * normal);
        vertexUV = uv; 
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
    }`;
const MY_FRAGMENT_SHADER  = `
    uniform sampler2D globeTexture; 
    varying vec2 vertexUV;
    varying vec3 vertexNormal;
    void main(){ 
        float intensity = 1.05 - dot( vertexNormal, vec3(0.0,0.0,1.0));
        vec3 atmosphere = vec3(0.3,0.6,1.0) * pow(intensity, 1.5);
        gl_FragColor = vec4(atmosphere + texture2D(globeTexture, vertexUV).xyz,1.0);
    }`;
//shaders for atmosphere
const ATMOSPHERE_VERTEX_SHADER =`
    varying vec3 vertexNormal;
    void main(){
        vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.9);
    }
`;
const ATMOSPHERE_FRAGMENT_SHADER =`
    varying vec3 vertexNormal;
    void main(){
        float intensity = pow(0.65 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
`;


// Materials
const material = new THREE.ShaderMaterial({
    // color: 0xFF0000,
    // map: new THREE.TextureLoader().load('/earth.jpeg'),
    vertexShader: MY_VERTEX_SHADER,
    fragmentShader: MY_FRAGMENT_SHADER,
    uniforms:{
        globeTexture: {
            value: new THREE.TextureLoader().load('/earth.jpeg'),
        }
    }
});
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
});

// Mesh
const sphere = new THREE.Mesh(geometry,material);

//atmosphere mesh
const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(5,50,50),
    new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX_SHADER,
        fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
    })
);

//star mesh

const starVertices = [];
for(let i =0;i<800; i++){
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = -Math.random() * 1200;
    starVertices.push(x,y,z);
}
starGeometry.setAttribute('position', 
    new THREE.Float32BufferAttribute(starVertices,3));
const stars = new THREE.Points(starGeometry,starMaterial);
scene.add(stars);

atmosphere.scale.set(1.1,1.1,1.1);
scene.add(atmosphere);
const group = new THREE.Group();
group.add(sphere);
scene.add(group);

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const canvasContainer = document.querySelector('#canvasContainer');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, canvasContainer.offsetWidth / canvasContainer.offsetHeight, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 15
scene.add(camera)

// Controls
const mouse = {
    x:undefined,
    y:undefined
}
addEventListener('mousemove',()=>{
    mouse.x = (event.clientX/innerWidth) * 2 -1 ;
    mouse.y = (event.clientY/innerHeight) * 2 +1;
});
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});
renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y += 0.003;
    // group.rotation.y = mouse.x * 0.5;
    gsap.to(group.rotation, {
        x: -mouse.y * 0.3,
        y: mouse.x * 0.5,
        duration: 2,
    })
    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()