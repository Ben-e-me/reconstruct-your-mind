import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// Ported from ReactBits "Magic Rings" (Three.js WebGL shader), tuned to Beni's
// settings and recoloured to the rust palette.

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform vec2 uResolution;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(p, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`

const P = {
  color: '#d8823f',
  colorTwo: '#b0492b',
  speed: 1.2,
  ringCount: 7,
  attenuation: 12,
  lineThickness: 2,
  baseRadius: 0.26,
  radiusStep: 0.08,
  scaleRate: 0.17,
  opacity: 0.6,
  blur: 8,
  noiseAmount: 0.07,
  rotation: 90,
  ringGap: 1,
  fadeIn: 0.95,
  fadeOut: 0.5,
}

// active = the beat is shown; delay = seconds to wait (until the text finished) before the rings begin
export function MagicRings({ active = true, delay = 0 }: { active?: boolean; delay?: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!active) {
      setStarted(false)
      return
    }
    const t = window.setTimeout(() => setStarted(true), delay * 1000)
    return () => window.clearTimeout(t)
  }, [active, delay])

  useEffect(() => {
    if (!started) return
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true })
    } catch {
      return
    }
    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose()
      return
    }

    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: P.attenuation },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color(P.color) },
      uColorTwo: { value: new THREE.Color(P.colorTwo) },
      uLineThickness: { value: P.lineThickness },
      uBaseRadius: { value: P.baseRadius },
      uRadiusStep: { value: P.radiusStep },
      uScaleRate: { value: P.scaleRate },
      uRingCount: { value: P.ringCount },
      uOpacity: { value: P.opacity },
      uNoiseAmount: { value: P.noiseAmount },
      uRotation: { value: (P.rotation * Math.PI) / 180 },
      uRingGap: { value: P.ringGap },
      uFadeIn: { value: P.fadeIn },
      uFadeOut: { value: P.fadeOut },
    }

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    scene.add(quad)

    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      renderer.setSize(w, h)
      renderer.setPixelRatio(dpr)
      uniforms.uResolution.value.set(w * dpr, h * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let frameId = 0
    const t0 = performance.now()
    const animate = (t: number) => {
      frameId = requestAnimationFrame(animate)
      uniforms.uTime.value = ((t - t0) / 1000) * P.speed
      renderer.render(scene, camera)
    }
    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
      ro.disconnect()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      renderer.dispose()
      material.dispose()
    }
  }, [started])

  return (
    <div
      ref={mountRef}
      className={`magic-rings ${started ? 'appear' : ''}`}
      style={{ filter: `blur(${P.blur}px)` }}
      aria-hidden="true"
    />
  )
}
