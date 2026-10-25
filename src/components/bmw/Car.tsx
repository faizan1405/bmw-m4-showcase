import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import modelAsset from "@/assets/bmw-m4.glb.asset.json";
import { computeAnchors } from "./anchors3d";
import { PAINTS, getPaint, story, type CarInfo } from "./store";

export const MODEL_URL = modelAsset.url;
const TARGET_LENGTH = 4.8;

// Shared PBR paint so every canvas (story + explorer) shows the same finish.
const paintMat = new THREE.MeshPhysicalMaterial({
  color: "#3b4046",
  metalness: 0.85,
  roughness: 0.3,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.4,
});
const lightMats: THREE.MeshStandardMaterial[] = [];

function centerOf(objs: THREE.Object3D[], root: THREE.Object3D) {
  const box = new THREE.Box3();
  objs.forEach((o) => box.expandByObject(o));
  root.updateMatrixWorld(true);
  return box.isEmpty() ? null : box.getCenter(new THREE.Vector3());
}

/** Loads the GLB, orients it (front = +X, driver side visible = +Z), scales it and derives camera anchors from real mesh bounds. */
export function useCar() {
  const { scene } = useGLTF(MODEL_URL);
  return useMemo(() => {
    const model = scene.clone(true);
    const root = new THREE.Group();
    root.add(model);

    const meshes: THREE.Mesh[] = [];
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      meshes.push(m);
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as THREE.MeshStandardMaterial;
      const name = mat.name.toLowerCase();
      if (name.includes("livery")) {
        m.visible = false; // clean factory paint instead of the race livery decal
      } else if (/zx1|white4/.test(name)) {
        m.material = paintMat;
      } else {
        mat.envMapIntensity = 1.2;
        if (/headlight|led/.test(name) && !lightMats.includes(mat)) {
          mat.emissive = new THREE.Color("#dfe9ff");
          mat.emissiveIntensity = 0;
          lightMats.push(mat);
        }
      }
    });
    const byMat = (re: RegExp) =>
      meshes.filter((m) => re.test(((m.material as THREE.Material).name || "").toLowerCase()));

    // 1. long axis -> X
    let box = new THREE.Box3().setFromObject(root);
    let size = box.getSize(new THREE.Vector3());
    if (size.z > size.x) model.rotation.y = Math.PI / 2;
    root.updateMatrixWorld(true);
    // 2. headlights must point to +X
    const hl = centerOf(byMat(/headlight/), root);
    box = new THREE.Box3().setFromObject(root);
    const c0 = box.getCenter(new THREE.Vector3());
    if (hl && hl.x < c0.x) model.rotation.y += Math.PI;
    root.updateMatrixWorld(true);
    // 3. scale + ground
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());
    const s = TARGET_LENGTH / size.x;
    model.scale.setScalar(s);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    size = box.getSize(new THREE.Vector3());

    // Front wheel on the +Z side, from rim/caliper meshes when they are separate.
    const fallbackWheel = new THREE.Vector3(size.x * 0.3, size.y * 0.25, size.z * 0.44);
    let wheel = fallbackWheel;
    const parts = byMat(/rim|caliper/)
      .map((m) => new THREE.Box3().setFromObject(m))
      .filter((b) => b.getSize(new THREE.Vector3()).x < size.x * 0.3)
      .map((b) => b.getCenter(new THREE.Vector3()))
      .filter((p) => p.x > 0 && p.z > 0);
    if (parts.length) {
      wheel = parts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(parts.length);
      wheel.z = Math.max(wheel.z, size.z * 0.38);
    }
    const hlc = centerOf(byMat(/headlight/), root);
    const headlight = new THREE.Vector3(
      hlc ? hlc.x : size.x * 0.44,
      hlc ? hlc.y : size.y * 0.5,
      size.z * 0.33,
    );
    const info: CarInfo = {
      length: size.x,
      width: size.z,
      height: size.y,
      wheel,
      headlight,
      rear: new THREE.Vector3(-size.x / 2, size.y * 0.5, 0),
      points: computeAnchors(root, meshes, size, wheel, headlight),
    };
    return { root, info };
  }, [scene]);
}

/** Animates paint toward the selected finish and lights headlights in the front scene. */
export function CarMaterials({ storyDriven }: { storyDriven: boolean }) {
  const target = useRef(new THREE.Color());
  useFrame((_, dt) => {
    const p = PAINTS.find((x) => x.id === getPaint())!;
    target.current.set(p.color);
    const k = 1 - Math.exp(-dt * 4);
    paintMat.color.lerp(target.current, k);
    paintMat.metalness += (p.metalness - paintMat.metalness) * k;
    paintMat.roughness += (p.roughness - paintMat.roughness) * k;
    const glow = storyDriven
      ? 0.15 + 0.85 * Math.max(0, 1 - Math.abs(story.p - 0.45) / 0.07) + (story.p > 0.92 ? 0.4 : 0)
      : 0.6;
    lightMats.forEach((m) => (m.emissiveIntensity = glow * 0.5));
  });
  return null;
}

useGLTF.preload(MODEL_URL);
