'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

/**
 * Opening scene — "setting out".
 * Gold pen strokes set out a drafting grid and construction lines, then a villa rises
 * line by line: ground floor, cantilevered slab, glass volume, roof. When the frame is
 * complete the rooms light up from within; on exit the camera walks in through the glass.
 *
 * Every line knows the moment it is drawn (aOrder at each end), so a single
 * `progress` uniform animates the whole build with a bright pen tip at the frontier.
 */

type Props = {
  progress: MutableRefObject<number>; // 0 → 1 build
  exit: MutableRefObject<number>; // 0 → 1 fly-in
  /** -1 … 1: the camera turns toward the hovered language door */
  look?: MutableRefObject<number>;
};

type Seg = [THREE.Vector3Tuple, THREE.Vector3Tuple];
type Layer = { segs: Seg[]; from: number; to: number; alpha: number; sort: (s: Seg) => number };

const v = (x: number, y: number, z: number): THREE.Vector3Tuple => [x, y, z];

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Seg[] {
  const b = [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1)];
  const t = [v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1)];
  const s: Seg[] = [];
  for (let i = 0; i < 4; i++) {
    s.push([b[i], b[(i + 1) % 4]]);
    s.push([b[i], t[i]]);
    s.push([t[i], t[(i + 1) % 4]]);
  }
  return s;
}

function buildLayers(): Layer[] {
  const grid: Seg[] = [];
  for (let i = -7; i <= 7; i++) {
    grid.push([v(i, 0, -7), v(i, 0, 7)]);
    grid.push([v(-7, 0, i), v(7, 0, i)]);
  }

  // Construction lines: slab edges extended far beyond the building, like a drafter's setting-out.
  const construction: Seg[] = [
    [v(-9, 0, 1.6), v(9, 0, 1.6)],
    [v(-9, 0, -1.8), v(9, 0, -1.8)],
    [v(-3, 0, -9), v(-3, 0, 9)],
    [v(3.4, 0, -9), v(3.4, 0, 9)],
    [v(-9, 1.4, 1.4), v(9, 1.4, 1.4)],
    [v(-9, 2.7, 1.6), v(9, 2.7, 1.6)],
    [v(0, 0, 0), v(0, 6, 0)],
  ];

  const ground: Seg[] = [
    ...box(-3, 1.6, 0, 1.3, -1.6, 1.2),
    // pool
    [v(-5.6, 0.01, 0.2), v(-3.4, 0.01, 0.2)],
    [v(-3.4, 0.01, 0.2), v(-3.4, 0.01, 2.6)],
    [v(-3.4, 0.01, 2.6), v(-5.6, 0.01, 2.6)],
    [v(-5.6, 0.01, 2.6), v(-5.6, 0.01, 0.2)],
  ];
  // slender columns carrying the cantilever
  for (const [x, z] of [[2.2, 1.4], [3.4, 1.4], [3.4, -1.8], [2.2, -1.8]] as const) ground.push([v(x, 0, z), v(x, 1.3, z)]);
  // ground-floor glazing
  for (let x = -2.6; x < 1.6; x += 0.52) ground.push([v(x, 0, 1.2), v(x, 1.3, 1.2)]);

  const slab = box(-2.2, 3.4, 1.3, 1.42, -1.8, 1.4);

  const upper: Seg[] = [...box(-1.6, 1.8, 1.42, 2.6, -1.3, 1.1)];
  for (let x = -1.2; x < 1.8; x += 0.4) upper.push([v(x, 1.42, 1.1), v(x, 2.6, 1.1)]);
  // balcony rail on the cantilever
  upper.push([v(1.8, 1.72, 1.4), v(3.4, 1.72, 1.4)], [v(3.4, 1.72, 1.4), v(3.4, 1.72, -1.8)]);

  const roof = box(-2.6, 2.4, 2.6, 2.7, -1.7, 1.6);
  // exterior stair from garden to terrace
  const stair: Seg[] = [];
  for (let i = 0; i < 8; i++) {
    const y0 = (i / 8) * 1.3;
    const y1 = ((i + 1) / 8) * 1.3;
    const z = 2.6 - i * 0.16;
    stair.push([v(3.9, y0, z), v(3.9, y1, z)], [v(3.9, y1, z), v(3.9, y1, z - 0.16)]);
  }

  const byRadius = (s: Seg) => Math.hypot((s[0][0] + s[1][0]) / 2, (s[0][2] + s[1][2]) / 2);
  const byHeight = (s: Seg) => Math.min(s[0][1], s[1][1]) * 10 + (s[0][0] + s[1][0]) * 0.05;

  return [
    { segs: grid, from: 0, to: 0.3, alpha: 0.16, sort: byRadius },
    { segs: construction, from: 0.08, to: 0.42, alpha: 0.22, sort: (s) => s[0][1] },
    { segs: ground, from: 0.28, to: 0.58, alpha: 0.95, sort: byHeight },
    { segs: slab, from: 0.5, to: 0.66, alpha: 1, sort: byHeight },
    { segs: upper, from: 0.6, to: 0.84, alpha: 0.95, sort: byHeight },
    { segs: roof, from: 0.78, to: 0.93, alpha: 1, sort: byHeight },
    { segs: stair, from: 0.84, to: 0.98, alpha: 0.8, sort: byHeight },
  ];
}

const lineVert = /* glsl */ `
  attribute float aOrder;
  attribute float aAlpha;
  varying float vOrder;
  varying float vAlpha;
  varying float vDepth;
  void main() {
    vOrder = aOrder;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const lineFrag = /* glsl */ `
  uniform float uProgress;
  uniform float uFade;
  varying float vOrder;
  varying float vAlpha;
  varying float vDepth;
  void main() {
    if (vOrder > uProgress) discard;
    float hot = 1.0 - smoothstep(0.0, 0.035, uProgress - vOrder);
    vec3 gold = vec3(0.831, 0.686, 0.216);
    vec3 col = mix(gold, vec3(1.0, 0.96, 0.84), hot);
    float fog = 1.0 - smoothstep(9.0, 21.0, vDepth);
    gl_FragColor = vec4(col, (vAlpha * 0.7 + hot) * fog * uFade);
  }
`;

function Build({ progress, exit, look }: Props) {
  const { camera, size } = useThree();
  const portrait = size.width < size.height;

  const lines = useMemo(() => {
    const pos: number[] = [];
    const order: number[] = [];
    const alpha: number[] = [];
    for (const layer of buildLayers()) {
      const segs = [...layer.segs].sort((a, b) => layer.sort(a) - layer.sort(b));
      const span = layer.to - layer.from;
      const dur = span * 0.4;
      segs.forEach((s, i) => {
        const start = layer.from + (span - dur) * (segs.length > 1 ? i / (segs.length - 1) : 0);
        pos.push(...s[0], ...s[1]);
        order.push(start, start + dur);
        alpha.push(layer.alpha, layer.alpha);
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aOrder', new THREE.Float32BufferAttribute(order, 1));
    g.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      uniforms: { uProgress: { value: 0 }, uFade: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.LineSegments(g, m);
  }, []);

  // Volumes that appear once the frame is complete: smoked glass and warm interior light.
  const solids = useMemo(() => {
    const group = new THREE.Group();
    const glass = new THREE.MeshBasicMaterial({ color: '#2a2316', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const warm = new THREE.MeshBasicMaterial({ color: '#f1c66a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, p: THREE.Vector3Tuple) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...p);
      group.add(mesh);
    };
    add(new THREE.BoxGeometry(5.6, 0.12, 3.2), glass, [0.6, 1.36, -0.2]);
    add(new THREE.BoxGeometry(5, 0.1, 3.3), glass, [-0.1, 2.65, -0.05]);
    add(new THREE.PlaneGeometry(4.5, 1.25), warm, [-0.7, 0.65, 1.19]);
    add(new THREE.PlaneGeometry(3.3, 1.12), warm, [0.1, 2.01, 1.09]);
    // pool water
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.4), new THREE.MeshBasicMaterial({ color: '#c9a64a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(-4.5, 0.012, 1.4);
    group.add(water);
    return { group, glass, warm, water: water.material as THREE.MeshBasicMaterial };
  }, []);

  // Gold dust hanging in the air.
  const dust = useMemo(() => {
    const n = 520;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * 22;
      p[i * 3 + 1] = Math.random() * 8;
      p[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({ color: '#D4AF37', size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    return new THREE.Points(g, m);
  }, []);

  useEffect(
    () => () => {
      lines.geometry.dispose();
      (lines.material as THREE.Material).dispose();
      dust.geometry.dispose();
      (dust.material as THREE.Material).dispose();
      solids.group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    },
    [lines, dust, solids],
  );

  const target = useMemo(() => new THREE.Vector3(), []);
  const lookSmooth = useRef(0);

  useFrame(({ clock }) => {
    const p = progress.current;
    const e = exit.current;
    const t = clock.elapsedTime;
    const mat = lines.material as THREE.ShaderMaterial;
    mat.uniforms.uProgress.value = p * 1.02;

    const lit = THREE.MathUtils.smoothstep(p, 0.9, 1);
    solids.glass.opacity = lit * 0.55;
    solids.warm.opacity = lit * (0.16 + 0.03 * Math.sin(t * 2.2));
    solids.water.opacity = lit * 0.12;
    dust.rotation.y = t * 0.02;
    dust.position.y = Math.sin(t * 0.3) * 0.1;

    // Camera: a slow low orbit while building, then it walks in through the glass.
    const ease = e * e * (3 - 2 * e);
    lookSmooth.current += ((look?.current ?? 0) - lookSmooth.current) * 0.04;
    const angle = -1.05 + p * 0.85 + t * 0.015 + lookSmooth.current * 0.32;
    const radius = (portrait ? 15 : 11.5) - p * 2.2;
    const height = 5.2 - p * 2.2;
    const orbit = new THREE.Vector3(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    const inside = new THREE.Vector3(0.1, 2.0, 0.4);
    camera.position.lerpVectors(orbit, inside, ease);
    target.set(0, 1.25 + ease * 0.75, 0).lerp(new THREE.Vector3(0.1, 2.0, -3), ease);
    camera.lookAt(target);
    mat.uniforms.uFade.value = 1 - THREE.MathUtils.smoothstep(e, 0.65, 1);
  });

  return (
    <>
      <primitive object={lines} />
      <primitive object={solids.group} />
      <primitive object={dust} />
    </>
  );
}

export default function PreloaderScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 38, near: 0.1, far: 60, position: [-8, 5, 8] }}
      aria-hidden
    >
      <Build {...props} />
    </Canvas>
  );
}
