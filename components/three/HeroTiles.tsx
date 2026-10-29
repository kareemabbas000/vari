'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { mediaUrl } from '@/lib/image-loader';
import type { Tier } from '@/lib/device';

/**
 * Hero — "the render assembles".
 * A real VARI render is cut into a grid of thick tiles (like façade panels).
 * On arrival they fly in from an exploded cloud and lock into the image; under the
 * pointer the façade pushes out in relief; scrolling blows the tiles apart in depth,
 * disassembling the building to open the next chapter.
 */

type Props = {
  progress: MutableRefObject<number>;
  started: boolean;
  tier: Exclude<Tier, 'none'>;
  imageId: string;
  imageAspect: number;
};

const vertex = /* glsl */ `
  attribute vec2 aUv;
  attribute float aSeed;
  uniform vec2 uTile;
  varying vec2 vUv;
  varying vec2 vLocal;
  varying vec3 vNormal;
  varying float vFront;
  varying float vSeed;
  void main() {
    vUv = aUv + uv * uTile;
    vLocal = uv;
    vSeed = aSeed;
    vFront = step(0.5, normal.z);
    vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uHasTex;
  uniform float uSeam;
  uniform float uTime;
  varying vec2 vUv;
  varying vec2 vLocal;
  varying vec3 vNormal;
  varying float vFront;
  varying float vSeed;
  void main() {
    vec3 gold = vec3(0.831, 0.686, 0.216);
    vec3 light = normalize(vec3(0.4, 0.7, 0.9));
    float lambert = max(dot(vNormal, light), 0.0);
    vec3 side = gold * (0.12 + 0.55 * lambert);

    vec3 img = uHasTex > 0.5 ? texture2D(uTex, vUv).rgb : mix(vec3(0.08,0.07,0.06), gold * 0.35, vUv.y);
    // Seams: a fine gold joint between panels while the façade is (dis)assembling.
    float e = min(min(vLocal.x, 1.0 - vLocal.x), min(vLocal.y, 1.0 - vLocal.y));
    float joint = (1.0 - smoothstep(0.0, 0.035, e)) * uSeam;
    vec3 front = mix(img * (0.82 + 0.18 * lambert), gold, joint * 0.85);
    // A slow shimmer of light travelling across the panels.
    front += gold * 0.06 * smoothstep(0.92, 1.0, sin(uTime * 0.6 + vUv.x * 6.0 - vUv.y * 3.0 + vSeed));

    gl_FragColor = vec4(mix(side, front, vFront), 1.0);
  }
`;

const ease = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Facade({ progress, started, tier, imageId, imageAspect }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { viewport, camera, gl, size } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const t0 = useRef<number | null>(null);
  const pointer = useRef(new THREE.Vector2(10, 10));
  const smoothScroll = useRef(0);

  const portrait = size.width < size.height;
  const cols = tier === 'high' ? 34 : portrait ? 12 : 20;

  // "cover" the viewport with the render at z = 0
  const vp = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
  let w = vp.width * 1.04;
  let h = w / imageAspect;
  if (h < vp.height * 1.04) {
    h = vp.height * 1.04;
    w = h * imageAspect;
  }
  const tileW = w / cols;
  const rows = Math.max(1, Math.round(h / tileW));
  const tileH = h / rows;
  const count = cols * rows;
  const depth = tileW * 0.55;

  const { uvs, seeds, targets, scatter, spin, delays } = useMemo(() => {
    const uvs = new Float32Array(count * 2);
    const seeds = new Float32Array(count);
    const targets: THREE.Vector3[] = [];
    const scatter: THREE.Vector3[] = [];
    const spin: THREE.Euler[] = [];
    const delays: number[] = [];
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        uvs[i * 2] = c / cols;
        uvs[i * 2 + 1] = r / rows;
        seeds[i] = Math.random() * 6.28;
        const x = -w / 2 + tileW * (c + 0.5);
        const y = -h / 2 + tileH * (r + 0.5);
        targets.push(new THREE.Vector3(x, y, 0));
        const dir = new THREE.Vector3(x, y, 0).normalize();
        scatter.push(new THREE.Vector3(dir.x * (2 + Math.random() * 6), dir.y * (2 + Math.random() * 5), -6 - Math.random() * 22));
        spin.push(new THREE.Euler((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2));
        // assemble from the centre outwards
        const d = Math.hypot(x / w, y / h);
        delays.push(d * 1.1 + Math.random() * 0.35);
        i++;
      }
    }
    return { uvs, seeds, targets, scatter, spin, delays };
  }, [count, cols, rows, w, h, tileW, tileH]);

  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(tileW, tileH, depth);
    g.setAttribute('aUv', new THREE.InstancedBufferAttribute(uvs, 2));
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    return g;
  }, [tileW, tileH, depth, uvs, seeds]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTex: { value: null },
          uHasTex: { value: 0 },
          uTile: { value: new THREE.Vector2(1 / cols, 1 / rows) },
          uSeam: { value: 1 },
          uTime: { value: 0 },
        },
      }),
    [cols, rows],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      mediaUrl(imageId, tier === 'high' ? 2400 : 1400, 85),
      (tex) => {
        if (disposed) return tex.dispose();
        tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        tex.generateMipmaps = true;
        setTexture(tex);
      },
      undefined,
      () => setTexture(null),
    );
    return () => {
      disposed = true;
    };
  }, [imageId, tier, gl]);

  useEffect(() => {
    material.uniforms.uTex.value = texture;
    material.uniforms.uHasTex.value = texture ? 1 : 0;
    return () => texture?.dispose();
  }, [texture, material]);

  useEffect(() => {
    if (tier !== 'high') return;
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    const onLeave = () => pointer.current.set(10, 10);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [tier]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const qT = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const hover = useRef(new THREE.Vector2());

  useFrame(({ clock }, dt) => {
    const m = mesh.current;
    if (!m) return;
    if (started && texture !== undefined && t0.current === null) t0.current = clock.elapsedTime;
    const t = t0.current === null ? -1 : clock.elapsedTime - t0.current;
    smoothScroll.current += (progress.current - smoothScroll.current) * Math.min(1, dt * 5);
    const s = smoothScroll.current;
    material.uniforms.uTime.value = clock.elapsedTime;

    // pointer in world units on the façade plane
    hover.current.set((pointer.current.x * vp.width) / 2, (pointer.current.y * vp.height) / 2);
    let assembledSum = 0;

    for (let i = 0; i < count; i++) {
      const a = t < 0 ? 0 : ease(clamp01((t - delays[i]) / 1.8));
      assembledSum += a;
      // Explosion driven by scroll: tiles nearer the edges leave first.
      const dz = clamp01(s * 1.6 - delays[i] * 0.35);
      const out = dz * dz;

      const T = targets[i];
      const S = scatter[i];
      const x = THREE.MathUtils.lerp(S.x, T.x, a) + T.x * out * 0.9;
      const y = THREE.MathUtils.lerp(S.y, T.y, a) + T.y * out * 0.9;
      let z = THREE.MathUtils.lerp(S.z, T.z, a) + out * (6 + (i % 7));

      // Relief under the cursor once assembled
      if (a > 0.98 && s < 0.05) {
        const d = Math.hypot(T.x - hover.current.x, T.y - hover.current.y);
        z += Math.max(0, 1 - d / (vp.width * 0.18)) ** 2 * depth * 2.2;
      }

      dummy.position.set(x, y, z);
      e.set(spin[i].x * (1 - a) + spin[i].x * out, spin[i].y * (1 - a) + spin[i].y * out, spin[i].z * (1 - a) + spin[i].z * out * 0.5);
      qT.setFromEuler(e);
      q.copy(qT);
      dummy.quaternion.copy(q);
      const sc = 0.0001 + Math.min(1, a * 1.4);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    const assembled = assembledSum / count;
    material.uniforms.uSeam.value = Math.max(1 - assembled, Math.min(1, s * 3)) * 0.9 + 0.1 * (assembled < 0.999 ? 1 : 0);

    // gentle camera drift
    camera.position.x += (pointer.current.x * 0.25 * (pointer.current.x < 5 ? 1 : 0) - camera.position.x) * 0.03;
    camera.position.y += (pointer.current.y * 0.15 * (pointer.current.y < 5 ? 1 : 0) - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return <instancedMesh key={count} ref={mesh} args={[geometry, material, count]} frustumCulled={false} />;
}

export default function HeroTiles(props: Props) {
  const high = props.tier === 'high';
  return (
    <Canvas
      dpr={high ? [1, 1.75] : [1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: 35, near: 0.1, far: 100, position: [0, 0, 10] }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#0C0B0A');
      }}
      aria-hidden
    >
      <Facade {...props} />
    </Canvas>
  );
}
