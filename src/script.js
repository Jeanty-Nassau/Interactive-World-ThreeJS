import './style.css'
import * as THREE from 'three'

const canvas=document.querySelector('canvas.webgl')
const container=document.querySelector('#canvasContainer')
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
const scene=new THREE.Scene()
const vertexShader=`varying vec2 vUv;varying vec3 vNormal;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const fragmentShader=`uniform sampler2D globeTexture;varying vec2 vUv;varying vec3 vNormal;void main(){float rim=1.05-max(dot(vNormal,vec3(0.,0.,1.)),0.);vec3 glow=vec3(.3,.6,1.)*pow(rim,1.5);gl_FragColor=vec4(glow+texture2D(globeTexture,vUv).rgb,1.);}`
const atmosphereVertex=`varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const atmosphereFragment=`varying vec3 vNormal;void main(){float i=pow(.65-dot(vNormal,vec3(0.,0.,1.)),2.);gl_FragColor=vec4(.3,.6,1.,1.)*i;}`
const texture=new THREE.TextureLoader().load('/earth.jpeg')
const sphere=new THREE.Mesh(new THREE.SphereGeometry(5,64,64),new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{globeTexture:{value:texture}}}))
const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(5,64,64),new THREE.ShaderMaterial({vertexShader:atmosphereVertex,fragmentShader:atmosphereFragment,blending:THREE.AdditiveBlending,side:THREE.BackSide,transparent:true}))
atmosphere.scale.setScalar(1.08)
const group=new THREE.Group();group.add(sphere,atmosphere);scene.add(group)
const positions=new Float32Array(700*3)
for(let i=0;i<700;i++){const r=30+Math.random()*70,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);positions[i*3]=r*Math.sin(p)*Math.cos(t);positions[i*3+1]=r*Math.sin(p)*Math.sin(t);positions[i*3+2]=r*Math.cos(p)}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3))
const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xffffff,size:.08,transparent:true,opacity:.75}));scene.add(stars)
const camera=new THREE.PerspectiveCamera(52,1,.1,150);camera.position.z=15;scene.add(camera)
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'})
const pointer={x:0,y:0};window.addEventListener('pointermove',e=>{pointer.x=e.clientX/window.innerWidth*2-1;pointer.y=e.clientY/window.innerHeight*2-1},{passive:true})
function resize(){const w=Math.max(container.clientWidth,1),h=Math.max(container.clientHeight,1);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))}window.addEventListener('resize',resize);resize()
const clock=new THREE.Clock();function tick(){const dt=Math.min(clock.getDelta(),.05);if(!reduced){sphere.rotation.y+=dt*.16;stars.rotation.y-=dt*.006;group.rotation.y+=(pointer.x*.32-group.rotation.y)*Math.min(dt*3,1);group.rotation.x+=(-pointer.y*.18-group.rotation.x)*Math.min(dt*3,1)}renderer.render(scene,camera);requestAnimationFrame(tick)}tick()