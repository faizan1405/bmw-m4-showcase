import * as THREE from "three";
import type { AnchorPoint } from "./store";

type Cloud = { mat: string; xyz: Float32Array };

/** Samples the real mesh vertices (in normalized car space) so every annotation anchor sits on actual geometry. */
function sample(root: THREE.Object3D, meshes: THREE.Mesh[]): Cloud[] {
  root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  return meshes
    .filter((m) => m.visible)
    .map((m) => {
      const pos = m.geometry.attributes["position"] as THREE.BufferAttribute;
      const step = pos.count > 20000 ? 3 : 1;
      const out = new Float32Array(Math.ceil(pos.count / step) * 3);
      let j = 0;
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        out[j++] = v.x;
        out[j++] = v.y;
        out[j++] = v.z;
      }
      return { mat: ((m.material as THREE.Material).name || "").toLowerCase(), xyz: out.subarray(0, j) };
    });
}

function select(clouds: Cloud[], mat: RegExp | null, f: (x: number, y: number, z: number) => boolean) {
  const pts: THREE.Vector3[] = [];
  for (const c of clouds) {
    if (mat && !mat.test(c.mat)) continue;
    const a = c.xyz;
    for (let i = 0; i < a.length; i += 3) if (f(a[i]!, a[i + 1]!, a[i + 2]!)) pts.push(new THREE.Vector3(a[i], a[i + 1], a[i + 2]));
  }
  return pts;
}
const centroid = (p: THREE.Vector3[]) =>
  p.length ? p.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(p.length) : null;
/** Mean of the top `frac` points by a score — finds the outermost real surface in a region. */
function extreme(p: THREE.Vector3[], score: (v: THREE.Vector3) => number, frac = 0.03) {
  if (!p.length) return null;
  const s = [...p].sort((a, b) => score(b) - score(a));
  return centroid(s.slice(0, Math.max(3, Math.floor(s.length * frac))));
}

export function computeAnchors(
  root: THREE.Object3D,
  meshes: THREE.Mesh[],
  size: THREE.Vector3,
  wheel: THREE.Vector3,
  headlight: THREE.Vector3,
): Record<string, AnchorPoint> {
  const L = size.x / 2, H = size.y, W = size.z / 2;
  const clouds = sample(root, meshes);
  const pts: Record<string, AnchorPoint> = {};
  const add = (k: string, p: THREE.Vector3 | null, n: [number, number, number]) => {
    if (p) pts[k] = { p, n: new THREE.Vector3(...n).normalize() };
  };

  // Front wheel (+Z side): rim radius from real rim vertices.
  const rimF = select(clouds, /rim/, (x, _y, z) => x > 0 && z > 0);
  const bb = new THREE.Box3().setFromPoints(rimF);
  const rimR = rimF.length ? (bb.max.y - bb.min.y) / 2 : 0.3;
  const wz = rimF.length ? bb.max.z : wheel.z + 0.1;
  // Correct the camera's wheel target with the measured rim centre (shared vector).
  if (rimF.length) wheel.set((bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, Math.max(wheel.z, (bb.min.z + bb.max.z) / 2));
  add("rim", new THREE.Vector3(wheel.x - rimR * 0.45, wheel.y + rimR * 0.45, wz), [0, 0, 1]);
  add("caliper", centroid(select(clouds, /caliper/, (x, _y, z) => x > 0 && z > 0)), [0.2, 0, 1]);
  const tr = rimR * 1.18;
  add("tire", new THREE.Vector3(wheel.x + tr * 0.7, wheel.y - tr * 0.62, wz - 0.03), [0, 0, 1]);

  // Front fascia.
  add("grille", extreme(select(clouds, /piggrill|grill/, (x) => x > L * 0.7), (v) => v.x - Math.abs(v.z) * 0.5, 0.1), [1, 0, 0]);
  add("headlight", headlight.clone().setZ(Math.max(headlight.z, W * 0.55)), [1, 0, 0.6]);
  add(
    "intake",
    extreme(select(clouds, null, (x, y, z) => x > L * 0.8 && y > H * 0.12 && y < H * 0.3 && z > W * 0.45 && z < W * 0.8), (v) => v.x),
    [1, 0, 0.3],
  );

  // Side profile.
  add("body", extreme(select(clouds, null, (x, y) => Math.abs(x + L * 0.15) < 0.25 && y > H * 0.38 && y < H * 0.5), (v) => v.z), [0, 0, 1]);
  add("mirror", extreme(select(clouds, null, (x, y) => y > H * 0.55 && x > 0 && x < L * 0.6), (v) => v.z, 0.004), [0.2, 0.3, 1]);
  const rimRear = select(clouds, /rim/, (x, _y, z) => x < 0 && z > 0);
  const rb = new THREE.Box3().setFromPoints(rimRear);
  add("frontWheel", wheel.clone().setZ(wz), [0, 0, 1]);
  add("rearWheel", rimRear.length ? rb.getCenter(new THREE.Vector3()).setZ(rb.max.z) : new THREE.Vector3(-wheel.x, wheel.y, wz), [0, 0, 1]);

  // Rear.
  add("taillight", centroid(select(clouds, /redlight/, (x, _y, z) => x < -L * 0.6 && z > 0)), [-1, 0, 0.5]);
  add("diffuser", extreme(select(clouds, null, (x, y, z) => x < -L * 0.75 && y < H * 0.16 && y > H * 0.02 && Math.abs(z) < W * 0.6), (v) => -v.x, 0.1), [-1, -0.1, 0]);
  // Tailpipes: the rearmost geometry in the exhaust band on the visible (+Z) side.
  const exh = select(clouds, null, (x, y, z) => x < -L * 0.7 && y > H * 0.1 && y < H * 0.24 && z > W * 0.05 && z < W * 0.7);
  if (exh.length > 5) add("exhaust", extreme(exh, (v) => -v.x, 0.02), [-1, 0, 0.2]);

  // Top.
  add("roof", extreme(select(clouds, null, (x, _y, z) => Math.abs(x + L * 0.12) < 0.35 && Math.abs(z) < 0.3), (v) => v.y), [0, 1, 0]);
  add("hood", extreme(select(clouds, null, (x, _y, z) => x > L * 0.45 && x < L * 0.65 && Math.abs(z) < 0.25), (v) => v.y), [0, 1, 0.1]);
  add("roofline", extreme(select(clouds, null, (x, _y, z) => x < -L * 0.4 && x > -L * 0.55 && Math.abs(z - W * 0.3) < 0.15), (v) => v.y), [0, 1, 0]);
  return pts;
}
