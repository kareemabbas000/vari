'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import type { Tier } from '@/lib/device';

/**
 * One architectural model, eight states — each service is a different way of
 * looking at (and building) the same pavilion:
 *  0 Product Modeling          – a single crafted object on a plinth
 *  1 Immersive Architecture    – the camera walks inside at eye level
 *  2 Conceptual Interior Design – roof lifted away, looking into the furnished room
 *  3 Design Services           – the complete building, hero three-quarter view
 *  4 Animation & Walk-through  – continuous fly-around along a gold path
 *  5 3D Modeling & BIM         – exploded axonometric, layers separated
 *  6 3D Rendering Services     – night render, glazing glowing
 *  7 2D Drafting               – collapses to the plan: lines on paper
 */

const GOLD = new THREE.Color('#D4AF37');

type PartKey = 'ground' | 'columns' | 'walls' | 'glass' | 'slab' | 'upper' | 'roof' | 'partition' | 'furniture' | 'plan' | 'path';

type PartState = { show: number; lift: number; solid: number };
type State = {
  parts: Partial<Record<PartKey, Partial<PartState>>>;
  cam: [number, number, number];
  look: [number, number, number];
  orbit?: number;
  night?: number;
  flatten?: number;
};

const ALL_ON: Partial<Record<PartKey, Partial<PartState>>> = {
  ground: {}, columns: {}, walls: {}, glass: {}, slab: {}, upper: {}, roof: {}, partition: {}, furniture: {},
};

const STATES: State[] = [
  { parts: { furniture: {}, plan: { show: 0.25 } }, cam: [3.2, 2.2, 4.2], look: [0.8, 0.6, 0.4], orbit: 0.25 },
  { parts: { ...ALL_ON }, cam: [2.6, 1.6, 1.6], look: [-2.5, 1.4, -1.5], orbit: 0.06 },
  { parts: { ...ALL_ON, slab: { show: 0 }, upper: { show: 0 }, roof: { show: 0 }, glass: { show: 0.25 } }, cam: [6, 9, 8], look: [0, 0.5, 0] },
  { parts: { ...ALL_ON }, cam: [11, 6, 12], look: [0, 2.2, 0], orbit: 0.08 },
  { parts: { ...ALL_ON, path: {} }, cam: [12, 5, 10], look: [0, 2, 0], orbit: 0.45 },
  {
    parts: {
      ground: { lift: 0 }, plan: { show: 0.6 }, columns: { lift: 1.6, solid: 0.15 }, walls: { lift: 2.6, solid: 0.15 }, glass: { lift: 2.6, solid: 0.15 },
      partition: { lift: 2.6, solid: 0.15 }, furniture: { lift: 1.2, solid: 0.15 }, slab: { lift: 4.6, solid: 0.15 }, upper: { lift: 6.4, solid: 0.15 }, roof: { lift: 8.4, solid: 0.15 },
    },
    cam: [13, 10, 13], look: [0, 4.5, 0], orbit: 0.1,
  },
  { parts: { ...ALL_ON }, cam: [10, 3.2, 11], look: [0, 2.4, 0], orbit: 0.05, night: 1 },
  { parts: { plan: {}, ground: { solid: 0, show: 0.4 }, walls: { solid: 0 }, columns: { solid: 0 }, partition: { solid: 0 } }, cam: [0.01, 16, 0.4], look: [0, 0, 0], flatten: 1 },
];

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function merge(geos: THREE.BufferGeometry[]) {
  // tiny merge helper (avoids pulling in BufferGeometryUtils)
  const positions: number[] = [];
  const normals: number[] = [];
  geos.forEach((g) => {
    const ng = g.index ? g.toNonIndexed() : g;
    positions.push(...(ng.attributes.position.array as Float32Array));
    normals.push(...(ng.attributes.normal.array as Float32Array));
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return out;
}

function useParts() {
  return useMemo(() => {
    const H = 3; // storey height
    const geos: Record<Exclude<PartKey, 'plan' | 'path'>, THREE.BufferGeometry> = {
      ground: box(10, 0.3, 7, 0, 0.15, 0),
      columns: merge([
        box(0.22, H, 0.22, -4.6, 0.3 + H / 2, 3.2),
        box(0.22, H, 0.22, 4.6, 0.3 + H / 2, 3.2),
        box(0.22, H, 0.22, 4.6, 0.3 + H / 2, -3.2),
        box(0.22, H, 0.22, 0, 0.3 + H / 2, 3.2),
      ]),
      walls: merge([box(9.4, H, 0.2, 0, 0.3 + H / 2, -3.3), box(0.2, H, 6.4, -4.7, 0.3 + H / 2, -0.1), box(0.2, H, 2.4, 4.7, 0.3 + H / 2, -2.1)]),
      glass: merge([box(9, H - 0.1, 0.05, 0, 0.3 + H / 2, 3.25), box(0.05, H - 0.1, 3.8, 4.72, 0.3 + H / 2, 1.2)]),
      partition: merge([box(0.14, H - 0.4, 3.2, 1.2, 0.3 + (H - 0.4) / 2, -1.6), box(2.4, H - 0.4, 0.14, -2.6, 0.3 + (H - 0.4) / 2, -0.4)]),
      furniture: merge([
        box(2.2, 0.4, 0.9, -1.6, 0.5, 1.4), // sofa seat
        box(2.2, 0.55, 0.22, -1.6, 0.85, 0.98), // sofa back
        box(1.1, 0.06, 0.7, -1.6, 0.62, 2.5), // coffee table top
        box(0.08, 0.32, 0.08, -2.05, 0.46, 2.25),
        box(0.08, 0.32, 0.08, -1.15, 0.46, 2.75),
        box(0.06, 1.6, 0.06, 0.4, 1.1, 1.0), // floor lamp
        box(0.5, 0.06, 0.5, 0.4, 1.9, 1.0),
        box(1.6, 0.08, 0.8, 2.9, 1.05, -1.4), // desk
        box(0.08, 0.75, 0.7, 2.2, 0.68, -1.4),
        box(0.08, 0.75, 0.7, 3.6, 0.68, -1.4),
      ]),
      slab: box(10.4, 0.3, 7.4, 0, 0.3 + H + 0.15, 0),
      upper: merge([box(5.6, H - 0.2, 0.2, -1.8, 0.6 + H + (H - 0.2) / 2, -3.2), box(0.2, H - 0.2, 5, -4.6, 0.6 + H + (H - 0.2) / 2, -0.8), box(5.6, H - 0.2, 0.05, -1.8, 0.6 + H + (H - 0.2) / 2, 1.6)]),
      roof: box(6.4, 0.25, 5.8, -1.8, 0.6 + 2 * H, -0.8),
    };
    // plan: wall centre-lines + dimension ticks at ground level
    const planPts = [
      [-4.7, -3.3, 4.7, -3.3], [-4.7, -3.3, -4.7, 3.2], [4.7, -3.3, 4.7, -0.9], [-4.7, 3.2, 4.7, 3.2], [4.7, -0.9, 4.7, 3.2],
      [1.2, -3.2, 1.2, 0], [-3.8, -0.4, -1.4, -0.4], [-5.6, -3.3, -5.6, 3.2], [-5.8, -3.3, -5.4, -3.3], [-5.8, 3.2, -5.4, 3.2],
      [-4.7, 4.1, 4.7, 4.1], [-4.7, 3.9, -4.7, 4.3], [4.7, 3.9, 4.7, 4.3],
    ];
    const planArr: number[] = [];
    planPts.forEach(([x1, z1, x2, z2]) => planArr.push(x1, 0.32, z1, x2, 0.32, z2));
    const plan = new THREE.BufferGeometry();
    plan.setAttribute('position', new THREE.Float32BufferAttribute(planArr, 3));

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8, 0.35, 8), new THREE.Vector3(-8, 0.35, 7), new THREE.Vector3(-8, 0.35, -6), new THREE.Vector3(7, 0.35, -7),
    ], true);
    const path = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160));

    const edges = Object.fromEntries(Object.entries(geos).map(([k, g]) => [k, new THREE.EdgesGeometry(g, 20)])) as Record<keyof typeof geos, THREE.EdgesGeometry>;
    return { geos, edges, plan, path };
  }, []);
}

const SOLID_KEYS = ['ground', 'columns', 'walls', 'glass', 'slab', 'upper', 'roof', 'partition', 'furniture'] as const;

function Model({ active }: { active: MutableRefObject<number> }) {
  const groups = useRef<Record<string, THREE.Group | null>>({});
  const solids = useRef<Record<string, THREE.MeshStandardMaterial | null>>({});
  const lines = useRef<Record<string, THREE.LineBasicMaterial | null>>({});
  const { geos, edges, plan, path } = useParts();
  const pathLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, toneMapped: false });
    lines.current.path = mat;
    return new THREE.Line(path, mat);
  }, [path]);

  const cur = useRef<Record<string, PartState>>({});
  const root = useRef<THREE.Group>(null);
  const camPos = useRef(new THREE.Vector3(11, 6, 12));
  const camLook = useRef(new THREE.Vector3(0, 2, 0));
  const env = useRef({ night: 0, flatten: 0, orbit: 0, angle: 0 });
  const warm = useRef<THREE.PointLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const { camera } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const st = STATES[active.current] ?? STATES[3];
    const k = Math.min(1, dt * 3.2);
    const keys = [...SOLID_KEYS, 'plan', 'path'] as PartKey[];
    keys.forEach((key) => {
      const target = st.parts[key];
      const goal: PartState = { show: target ? target.show ?? 1 : 0, lift: target?.lift ?? 0, solid: target?.solid ?? 1 };
      const c = (cur.current[key] ??= { show: 0, lift: 0, solid: 1 });
      c.show += (goal.show - c.show) * k;
      c.lift += (goal.lift - c.lift) * k;
      c.solid += (goal.solid - c.solid) * k;
      const g = groups.current[key];
      if (g) {
        g.position.y = c.lift;
        g.visible = c.show > 0.01;
      }
      const sm = solids.current[key];
      if (sm) {
        const glass = key === 'glass';
        sm.opacity = c.show * c.solid * (glass ? 0.35 : 1);
        sm.emissiveIntensity = glass ? env.current.night * 1.6 : 0;
      }
      const lm = lines.current[key];
      if (lm) lm.opacity = c.show * (0.35 + 0.65 * (1 - c.solid * 0.6));
    });

    const e = env.current;
    e.night += ((st.night ?? 0) - e.night) * k;
    e.flatten += ((st.flatten ?? 0) - e.flatten) * k;
    e.orbit += ((st.orbit ?? 0) - e.orbit) * k;
    e.angle += e.orbit * dt;
    if (root.current) {
      root.current.rotation.y = e.angle;
      root.current.scale.y = 1 - e.flatten * 0.92;
    }
    if (warm.current) warm.current.intensity = 2 + e.night * 40;
    if (sun.current) sun.current.intensity = 1.4 * (1 - e.night * 0.8);
    if (amb.current) amb.current.intensity = 0.35 - e.night * 0.22;

    camPos.current.lerp(tmp.set(...st.cam), k * 0.8);
    camLook.current.lerp(tmp.set(...st.look), k * 0.8);
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
  });

  const set = (key: string) => (g: THREE.Group | null) => (groups.current[key] = g);

  return (
    <>
      <ambientLight ref={amb} intensity={0.35} />
      <hemisphereLight args={['#f3eee4', '#1a1712', 0.35]} />
      <directionalLight ref={sun} position={[8, 14, 6]} intensity={1.4} color="#f1e3b5" />
      <pointLight ref={warm} position={[0, 2.2, 1]} color="#E2CF8F" intensity={2} distance={14} decay={2} />

      <group ref={root}>
        {SOLID_KEYS.map((key) => (
          <group key={key} ref={set(key)}>
            <mesh geometry={geos[key]}>
              <meshStandardMaterial
                ref={(m) => {
                  solids.current[key] = m;
                }}
                color={key === 'glass' ? '#cfd8d6' : key === 'furniture' ? '#3a2f22' : '#e9e3d8'}
                emissive={key === 'glass' ? '#E2CF8F' : '#000000'}
                roughness={key === 'glass' ? 0.1 : 0.85}
                metalness={key === 'glass' ? 0.2 : 0}
                transparent
                depthWrite={key !== 'glass'}
                polygonOffset
                polygonOffsetFactor={1}
              />
            </mesh>
            <lineSegments geometry={edges[key]}>
              <lineBasicMaterial
                ref={(m) => {
                  lines.current[key] = m;
                }}
                color={GOLD}
                transparent
                toneMapped={false}
              />
            </lineSegments>
          </group>
        ))}
        <group ref={set('plan')}>
          <lineSegments geometry={plan}>
            <lineBasicMaterial ref={(m) => { lines.current.plan = m; }} color={GOLD} transparent toneMapped={false} />
          </lineSegments>
        </group>
        <group ref={set('path')}>
          <primitive object={pathLine} />
        </group>
      </group>
      <gridHelper args={[60, 60, '#2a2418', '#1a1712']} position={[0, 0, 0]} />
    </>
  );
}

export default function ServicesModel({ active, tier }: { active: MutableRefObject<number>; tier: Exclude<Tier, 'none'> }) {
  return (
    <Canvas
      dpr={tier === 'high' ? [1, 1.75] : [1, 1.3]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 32, near: 0.1, far: 120, position: [11, 6, 12] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      aria-hidden
    >
      <fog attach="fog" args={['#0C0B0A', 18, 46]} />
      <Model active={active} />
    </Canvas>
  );
}
