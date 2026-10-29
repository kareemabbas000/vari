'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { mediaUrl } from '@/lib/image-loader';
import type { Tier } from '@/lib/device';

/**
 * The hero environment: a dark colonnade lit by lines of gold — an abstract
 * architectural pavilion that assembles itself on arrival, then lets the scroll
 * dolly the camera through the fins towards a real VARI render hung at the end.
 */

const GOLD = new THREE.Color('#D4AF37');
const STONE = new THREE.Color('#1c1a17');

type Props = {
  progress: MutableRefObject<number>;
  started: boolean;
  tier: Exclude<Tier, 'none'>;
  imageId: string;
  imageAspect: number;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Colonnade({ count, started }: { count: number; started: boolean }) {
  const fins = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.InstancedMesh>(null);
  const t0 = useRef<number | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const spacing = 2.4;
  const total = count * 2;

  const finGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.22, 7, 1.1);
    g.translate(0, 3.5, 0); // pivot at the base so fins grow upward
    return g;
  }, []);
  const lineGeo = useMemo(() => new THREE.BoxGeometry(0.02, 0.02, 1), []);

  useFrame(({ clock }) => {
    if (!fins.current || !lines.current) return;
    if (started && t0.current === null) t0.current = clock.elapsedTime;
    const t = t0.current === null ? 0 : clock.elapsedTime - t0.current;

    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / 2);
      const side = i % 2 === 0 ? -1 : 1;
      const delay = row * 0.07 + (side > 0 ? 0.04 : 0);
      const k = easeOutExpo(clamp01((t - delay) / 1.6));
      const z = -row * spacing;
      dummy.position.set(side * 2.6, 0, z);
      dummy.scale.set(1, Math.max(0.0001, k), 1);
      dummy.updateMatrix();
      fins.current.setMatrixAt(i, dummy.matrix);

      // Gold light strip at the base of each fin, drawn on after the fin rises.
      const l = easeOutExpo(clamp01((t - delay - 0.5) / 1.2));
      dummy.position.set(side * 2.32, 0.02, z);
      dummy.scale.set(1, 1, Math.max(0.0001, l * 1.1));
      dummy.updateMatrix();
      lines.current.setMatrixAt(i, dummy.matrix);
    }
    fins.current.instanceMatrix.needsUpdate = true;
    lines.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={fins} args={[finGeo, undefined, total]} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial color={STONE} roughness={0.78} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={lines} args={[lineGeo, undefined, total]} frustumCulled={false}>
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Canopy({ length, started }: { length: number; started: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (started && t0.current === null) t0.current = clock.elapsedTime;
    const t = t0.current === null ? 0 : clock.elapsedTime - t0.current;
    const k = easeOutExpo(clamp01((t - 1.1) / 2));
    ref.current.position.y = 7.15 + (1 - k) * 6;
    (ref.current.material as THREE.MeshStandardMaterial).opacity = k;
  });
  return (
    <mesh ref={ref} position={[0, 13, -length / 2 + 2]} castShadow>
      <boxGeometry args={[6.2, 0.18, length + 2]} />
      <meshStandardMaterial color="#141210" roughness={0.6} metalness={0.3} transparent opacity={0} />
    </mesh>
  );
}

function Floor({ length }: { length: number }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -length / 2]} receiveShadow>
        <planeGeometry args={[60, length + 60]} />
        <meshStandardMaterial color="#0d0c0b" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Central gold axis line — the drawing's datum */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -length / 2]}>
        <planeGeometry args={[0.015, length + 20]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.45} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Artwork({ z, imageId, aspect, progress }: { z: number; imageId: string; aspect: number; progress: MutableRefObject<number> }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const frame = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const { gl } = useThree();

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      mediaUrl(imageId, 1600, 85),
      (tex) => {
        if (disposed) return tex.dispose();
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        setTexture(tex);
      },
      undefined,
      () => setTexture(null), // CDN/CORS failure: keep the gold frame, no image
    );
    return () => {
      disposed = true;
    };
  }, [imageId, gl]);

  useEffect(() => () => texture?.dispose(), [texture]);

  const h = 3.2;
  const w = h * aspect;

  useFrame(({ clock }) => {
    if (glow.current) glow.current.opacity = 0.25 + Math.sin(clock.elapsedTime * 1.2) * 0.08 + progress.current * 0.4;
    if (frame.current) frame.current.position.y = 3.4 + Math.sin(clock.elapsedTime * 0.6) * 0.06;
  });

  return (
    <group ref={frame} position={[0, 3.4, z]}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[w + 0.12, h + 0.12]} />
        <meshBasicMaterial ref={glow} color={GOLD} transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        {texture ? <meshBasicMaterial map={texture} toneMapped={false} /> : <meshBasicMaterial color="#17150f" />}
      </mesh>
    </group>
  );
}

function Dust({ count, length }: { count: number; length: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 1] = Math.random() * 7;
      arr[i * 3 + 2] = 4 - Math.random() * (length + 6);
    }
    return arr;
  }, [count, length]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.05;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={GOLD} size={0.035} sizeAttenuation transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

function CameraRig({ progress, length, pointer }: { progress: MutableRefObject<number>; length: number; pointer: MutableRefObject<{ x: number; y: number }> }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const eased = useRef(0);

  useFrame((_, dt) => {
    // Critically damped follow of the scroll value → cinematic, never jittery.
    eased.current += (progress.current - eased.current) * Math.min(1, dt * 4);
    const p = easeInOut(eased.current);
    const portrait = size.width < size.height;
    const startZ = portrait ? 16 : 11;
    const endZ = -length + (portrait ? 7.4 : 5.2);
    const z = THREE.MathUtils.lerp(startZ, endZ, p);
    const y = THREE.MathUtils.lerp(portrait ? 2.6 : 2.2, 3.4, p);
    camera.position.set(pointer.current.x * 0.35 * (1 - p), y + pointer.current.y * 0.2 * (1 - p), z);
    look.set(0, THREE.MathUtils.lerp(2.6, 3.4, p), z - 8);
    camera.lookAt(look);
  });
  return null;
}

function Lights({ length, shadows }: { length: number; shadows: boolean }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#f3eee4', '#0c0b0a', 0.25]} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={1.1}
        color="#f1e3b5"
        castShadow={shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-40}
        shadow-camera-far={80}
      />
      <pointLight position={[0, 2.5, -length + 3]} color="#D4AF37" intensity={18} distance={16} decay={2} />
      <pointLight position={[0, 1.5, 2]} color="#E2CF8F" intensity={6} distance={10} decay={2} />
    </>
  );
}

export default function HeroScene({ progress, started, tier, imageId, imageAspect }: Props) {
  const high = tier === 'high';
  const count = high ? 12 : 8;
  const length = count * 2.4;
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!high) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [high]);

  return (
    <Canvas
      shadows={high}
      dpr={high ? [1, 1.75] : [1, 1.25]}
      gl={{ antialias: high, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 42, near: 0.1, far: 90, position: [0, 2.2, 11] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color('#0C0B0A');
        scene.fog = new THREE.Fog('#0C0B0A', 8, length + 6);
      }}
      aria-hidden
    >
      <Lights length={length} shadows={high} />
      <Floor length={length} />
      <Colonnade count={count} started={started} />
      <Canopy length={length} started={started} />
      <Artwork z={-length + 0.6} imageId={imageId} aspect={imageAspect} progress={progress} />
      <Dust count={high ? 900 : 300} length={length} />
      <CameraRig progress={progress} length={length} pointer={pointer} />
    </Canvas>
  );
}
