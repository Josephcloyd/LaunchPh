"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/** Small seeded PRNG (mulberry32): keeps the scene layout pure and stable between renders. */
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pointer position normalised to -1…1, shared by every layer of the scene. */
type PointerRef = React.RefObject<{ x: number; y: number }>;

const waveVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uSize;
  attribute float aSeed;
  varying float vHeight;
  varying float vFade;

  void main() {
    vec3 p = position;
    float t = uTime * 0.32;
    float wave = sin(p.x * 0.32 + t) * 0.55
               + sin(p.y * 0.48 + t * 1.25) * 0.35
               + sin((p.x + p.y) * 0.21 - t * 0.8) * 0.45;
    float d = distance(p.xy, uPointer);
    wave += exp(-d * d * 0.06) * 1.1; // the silk lifts toward the cursor
    p.z += wave;
    vHeight = wave;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aSeed * 0.9) * (10.0 / -mv.z);
    vFade = smoothstep(28.0, 7.0, -mv.z) * smoothstep(19.0, 13.0, abs(p.x));
  }
`;

const waveFragment = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uHigh;
  varying float vHeight;
  varying float vFade;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, r);
    float lift = smoothstep(-0.9, 1.5, vHeight);
    vec3 color = mix(uLow, uHigh, lift);
    gl_FragColor = vec4(color, glow * vFade * (0.4 + 0.9 * lift));
  }
`;

const fireflyVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float rise = mod(p.y + uTime * (0.18 + aSeed * 0.25), 9.0) - 3.5;
    p.y = rise;
    p.x += sin(uTime * 0.4 + aSeed * 12.0) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed) * (10.0 / -mv.z);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed * 40.0);
    vAlpha = smoothstep(-3.5, -1.5, rise) * smoothstep(5.5, 3.0, rise) * twinkle;
  }
`;

const fireflyFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    gl_FragColor = vec4(0.93, 0.96, 0.91, smoothstep(0.5, 0.0, r) * vAlpha * 0.8);
  }
`;

function SilkWave({ pointer, dense }: { pointer: PointerRef; dense: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const follow = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));

  const { positions, seeds } = useMemo(() => {
    const cols = dense ? 150 : 90;
    const rows = dense ? 70 : 46;
    const width = 40;
    const depth = 22;
    const random = createRandom(7);
    const positions = new Float32Array(cols * rows * 3);
    const seeds = new Float32Array(cols * rows);
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions[i * 3] = (c / (cols - 1) - 0.5) * width;
        positions[i * 3 + 1] = (r / (rows - 1) - 0.5) * depth;
        positions[i * 3 + 2] = 0;
        seeds[i] = random();
        i++;
      }
    }
    return { positions, seeds };
  }, [dense]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uSize: { value: dense ? 3.2 : 4 },
    uLow: { value: new THREE.Color("#4f7364") },
    uHigh: { value: new THREE.Color("#eef3ec") },
  }), [dense]);

  useFrame((state, delta) => {
    if (!material.current || !group.current) return;
    const u = material.current.uniforms;
    u.uTime.value += Math.min(delta, 0.05);
    // Map the screen pointer onto the tilted plane, then ease toward it.
    target.current.set(pointer.current.x * 14, -2 + pointer.current.y * 6);
    follow.current.lerp(target.current, 0.05);
    u.uPointer.value.copy(follow.current);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, pointer.current.x * 0.06, 0.04);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, pointer.current.x * 0.8, 0.03);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.6 + pointer.current.y * 0.5, 0.03);
    state.camera.lookAt(0, -0.6, 0);
  });

  return (
    <group ref={group} position={[0, -2.1, -2]} rotation={[-Math.PI * 0.43, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          vertexShader={waveVertex}
          fragmentShader={waveFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Fireflies({ count }: { count: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const random = createRandom(31);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 22;
      positions[i * 3 + 1] = random() * 9;
      positions[i * 3 + 2] = (random() - 0.5) * 8 - 1;
      seeds[i] = random();
    }
    return { positions, seeds };
  }, [count]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: 7 } }), []);

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={fireflyVertex}
        fragmentShader={fireflyFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroScene({ active, onReady }: { active: boolean; onReady: () => void }) {
  const pointer = useRef({ x: 0, y: 0 });
  const dense = useMemo(() => typeof window !== "undefined" && window.innerWidth >= 900, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.6, 9], fov: 45 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      onCreated={onReady}
    >
      <SilkWave pointer={pointer} dense={dense} />
      <Fireflies count={dense ? 70 : 34} />
    </Canvas>
  );
}
