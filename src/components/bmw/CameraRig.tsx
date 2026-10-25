import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { anchors, atmosphere, carMeta, story, smooth, type CarInfo } from "./store";

type Key = { t: number; pos: [number, number, number]; target: [number, number, number]; fov: number; close?: boolean };

/** Keyframes are built from the model's real bounds so close-ups land on the actual wheel, grille and rear. */
function buildKeys(c: CarInfo): Key[] {
  const L = c.length / 2;
  const W = c.wheel;
  const H = c.headlight;
  const mid = c.height * 0.42;
  return [
    { t: 0.0, pos: [8.5, 2.4, 8.5], target: [0, mid, 0], fov: 30 },
    { t: 0.08, pos: [6.2, 1.4, 6.0], target: [0, mid, 0], fov: 30 },
    { t: 0.14, pos: [4.6, 0.75, 4.9], target: [0.2, mid, 0], fov: 30 },
    { t: 0.22, pos: [W.x + 0.9, W.y + 0.35, W.z + 2.6], target: [W.x, W.y, W.z], fov: 30, close: true },
    { t: 0.3, pos: [W.x + 1.0, W.y + 0.08, W.z + 1.25], target: [W.x - 0.05, W.y, W.z], fov: 32, close: true },
    { t: 0.34, pos: [W.x + 1.35, W.y + 0.15, W.z + 1.05], target: [W.x, W.y, W.z], fov: 32, close: true },
    { t: 0.41, pos: [L + 1.6, 0.75, 2.2], target: [H.x - 0.2, H.y - 0.05, 0.3], fov: 30, close: true },
    { t: 0.47, pos: [L + 2.1, 0.42, 0.35], target: [L - 0.3, H.y - 0.05, 0], fov: 32, close: true },
    { t: 0.52, pos: [L + 1.8, 0.8, 3.4], target: [0.6, mid, 0], fov: 30 },
    { t: 0.58, pos: [0.4, 0.6, 7.0], target: [0, mid, 0], fov: 30 },
    { t: 0.65, pos: [-2.0, 0.42, 6.2], target: [-0.2, mid, 0], fov: 30 },
    { t: 0.71, pos: [-L - 1.4, 0.55, 1.7], target: [-L + 0.3, c.height * 0.5, 0], fov: 32, close: true },
    { t: 0.77, pos: [-L - 3.4, 0.85, 0.5], target: [-0.6, mid, 0], fov: 30 },
    { t: 0.82, pos: [-L - 1.8, 3.4, 3.0], target: [0, mid * 0.6, 0], fov: 30 },
    { t: 0.87, pos: [-1.6, 6.8, 1.6], target: [0, 0, 0], fov: 30 },
    { t: 0.92, pos: [0.3, 9.4, 0.5], target: [0, 0, 0], fov: 30 },
    { t: 0.96, pos: [5.8, 1.6, 6.2], target: [0, mid, 0], fov: 30 },
    { t: 1.0, pos: [4.9, 1.0, 5.4], target: [0.1, mid, 0], fov: 30 },
  ];
}

const v = new THREE.Vector3();
export function CameraRig({ info }: { info: CarInfo }) {
  const { camera, size, scene } = useThree();
  const keys = useMemo(() => buildKeys(info), [info]);
  carMeta.length = info.length;
  carMeta.height = info.height;
  carMeta.points = info.points;
  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
    const tgt = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.target)), false, "centripetal");
    return { pos, tgt };
  }, [keys]);
  const tmpP = useMemo(() => new THREE.Vector3(), []);
  const tmpT = useMemo(() => new THREE.Vector3(), []);
  const lightA = useRef<THREE.PointLight>(null);
  const lightB = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const p = Math.min(1, Math.max(0, story.p));
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1]!.t) i++;
    const a = keys[i]!;
    const b = keys[i + 1]!;
    const x = Math.min(1, Math.max(0, (p - a.t) / (b.t - a.t)));
    const eased = x * 0.45 + x * x * (3 - 2 * x) * 0.55; // settles gently at each composition
    const u = (i + eased) / (keys.length - 1);
    curves.pos.getPoint(u, tmpP);
    curves.tgt.getPoint(u, tmpT);

    // Portrait screens: pull back so the car isn't cropped (less for close-ups).
    const aspect = size.width / size.height;
    if (aspect < 1.25) {
      const closeness = (a.close ? 1 - x : 0) + (b.close ? x : 0);
      const k = 1 + (1.25 / aspect - 1) * (0.75 - closeness * 0.45);
      tmpP.sub(tmpT).multiplyScalar(k).add(tmpT);
    }
    camera.position.copy(tmpP);
    camera.lookAt(tmpT);
    camera.updateMatrixWorld(); // anchors below must project with this frame's camera, not last frame's
    if (import.meta.env.DEV) (window as unknown as { __storyCam?: unknown }).__storyCam = { p, x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const cam = camera as THREE.PerspectiveCamera;
    const fov = a.fov + (b.fov - a.fov) * eased;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // Lighting choreography: dark reveal -> lit studio -> brighter finale.
    scene.environmentIntensity = 0.04 + smooth(0, 0.11, p) * 0.9 + smooth(0.92, 1, p) * 0.35;

    // Per-scene colour atmosphere, blended continuously with scroll.
    let j = 0;
    while (j < MOODS.length - 2 && p > MOODS[j + 1]!.t) j++;
    const m0 = MOODS[j]!, m1 = MOODS[j + 1]!;
    const mx = smooth(m0.t, m1.t, p);
    bg.copy(m0.bg).lerp(m1.bg, mx);
    if (scene.background instanceof THREE.Color) scene.background.copy(bg);
    if (scene.fog) scene.fog.color.copy(bg);
    cA.copy(m0.a).lerp(m1.a, mx);
    cB.copy(m0.b).lerp(m1.b, mx);
    const reveal = smooth(0.02, 0.12, p);
    if (lightA.current) (lightA.current.color.copy(cA), (lightA.current.intensity = 70 * reveal));
    if (lightB.current) (lightB.current.color.copy(cB), (lightB.current.intensity = 55 * reveal));
    atmosphere.a = `rgb(${(cA.r * 255) | 0},${(cA.g * 255) | 0},${(cA.b * 255) | 0})`;
    atmosphere.b = `rgb(${(cB.r * 255) | 0},${(cB.g * 255) | 0},${(cB.b * 255) | 0})`;

    // Project every geometry anchor; hide those facing away from the camera (behind the car) or off-screen.
    for (const [k, a] of Object.entries(info.points)) {
      const out = (anchors[k] ??= { x: 0, y: 0, vis: false });
      dir.copy(camera.position).sub(a.p).normalize();
      v.copy(a.p).project(camera);
      out.x = (v.x * 0.5 + 0.5) * size.width;
      out.y = (-v.y * 0.5 + 0.5) * size.height;
      out.vis = v.z < 1 && Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.94 && dir.dot(a.n) > 0.08;
    }
  });
  return (
    <>
      {/* Coloured studio strips: one front-left, one rear-right, so tints read as reflections on the paint */}
      <pointLight ref={lightA} position={[3.5, 2.6, 3.8]} distance={14} decay={1.6} intensity={0} />
      <pointLight ref={lightB} position={[-3.6, 2.2, -3.2]} distance={14} decay={1.6} intensity={0} />
    </>
  );
}

const C = (h: string) => new THREE.Color(h);
const MOODS = [
  { t: 0.0, bg: C("#06070c"), a: C("#3d6bff"), b: C("#6a5cff") },
  { t: 0.2, bg: C("#050b1a"), a: C("#4aa8ff"), b: C("#ffa53d") }, // wheel: cool blue + amber brakes
  { t: 0.42, bg: C("#040a22"), a: C("#2c63ff"), b: C("#c9d6ec") }, // grille: deep blue + silver
  { t: 0.6, bg: C("#0c0a1e"), a: C("#6d5cff"), b: C("#3d7bff") }, // side: violet-blue
  { t: 0.73, bg: C("#130708"), a: C("#ff4a2e"), b: C("#ffaa3c") }, // rear: red + amber
  { t: 0.87, bg: C("#081022"), a: C("#5fa0ff"), b: C("#dfe6f2") }, // top: blue + silver
  { t: 1.0, bg: C("#080a18"), a: C("#3d7bff"), b: C("#8a6bff") },
];
const bg = new THREE.Color();
const cA = new THREE.Color();
const cB = new THREE.Color();
const dir = new THREE.Vector3();
