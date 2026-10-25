import type React from "react";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
type OrbitImpl = React.ComponentRef<typeof OrbitControls>;
import * as THREE from "three";
import { X, RotateCcw } from "lucide-react";
import { CarMaterials, useCar } from "./Car";
import { Studio } from "./Studio";
import { PAINTS, setExplorer, setPaint, usePaint, type CarInfo } from "./store";

type Goal = { pos: THREE.Vector3; target: THREE.Vector3 } | null;
const goal: { current: Goal } = { current: null };

function presets(c: CarInfo) {
  const m = c.height * 0.42;
  return {
    home: { pos: new THREE.Vector3(5.2, 1.3, 5.6), target: new THREE.Vector3(0, m, 0) },
    front: { pos: new THREE.Vector3(7, 0.9, 0.01), target: new THREE.Vector3(0, m, 0) },
    side: { pos: new THREE.Vector3(0, 0.9, 7.5), target: new THREE.Vector3(0, m, 0) },
    rear: { pos: new THREE.Vector3(-7, 1, 0.01), target: new THREE.Vector3(0, m, 0) },
    top: { pos: new THREE.Vector3(0.01, 9, 0.6), target: new THREE.Vector3(0, 0, 0) },
    wheel: { pos: c.wheel.clone().add(new THREE.Vector3(1.0, 0.1, 1.3)), target: c.wheel.clone() },
    light: { pos: c.headlight.clone().add(new THREE.Vector3(1.6, 0.1, 1.2)), target: c.headlight.clone() },
    tail: { pos: c.rear.clone().add(new THREE.Vector3(-1.8, 0.1, 1.6)), target: c.rear.clone() },
  };
}
type PresetKey = keyof ReturnType<typeof presets>;
let currentPresets: ReturnType<typeof presets> | null = null;
export const goTo = (k: PresetKey) => {
  if (currentPresets) goal.current = currentPresets[k];
};

const HOTSPOTS: { k: PresetKey; label: string; desc: string; at: (c: CarInfo) => THREE.Vector3 }[] = [
  { k: "wheel", label: "Wheels & brakes", desc: "M forged wheels with performance braking.", at: (c) => c.wheel.clone().add(new THREE.Vector3(0, 0, 0.12)) },
  { k: "light", label: "Adaptive LED", desc: "Signature BMW lighting design.", at: (c) => c.headlight.clone().add(new THREE.Vector3(0.1, 0, 0.1)) },
  { k: "tail", label: "Rear design", desc: "Wide stance and sculpted rear.", at: (c) => c.rear.clone().add(new THREE.Vector3(-0.05, 0.1, 0.5)) },
  { k: "top", label: "Roofline", desc: "Every surface engineered with purpose.", at: (c) => new THREE.Vector3(-0.3, c.height + 0.02, 0) },
];

function Scene({ mobile, portal }: { mobile: boolean; portal: React.RefObject<HTMLDivElement | null> }) {
  const { root, info } = useCar();
  const controls = useRef<OrbitImpl>(null);
  const p = useMemo(() => presets(info), [info]);
  useEffect(() => {
    currentPresets = p;
    goal.current = p.home;
  }, [p]);
  useFrame(({ camera }, dt) => {
    const g = goal.current;
    const c = controls.current;
    if (!g || !c) return;
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(g.pos, k);
    c.target.lerp(g.target, k);
    c.update();
    if (camera.position.distanceTo(g.pos) < 0.01) goal.current = null;
  });
  return (
    <>
      <Studio mobile={mobile} />
      <primitive object={root} />
      <CarMaterials storyDriven={false} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={1.6}
        maxDistance={11}
        maxPolarAngle={Math.PI / 2 - 0.04}
        onStart={() => (goal.current = null)}
      />
      {HOTSPOTS.map((h) => (
        <Html key={h.k} position={h.at(info)} center zIndexRange={[20, 0]} portal={portal as React.RefObject<HTMLDivElement>}>
          <button
            onClick={() => goTo(h.k)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-electric/80 bg-background/40 backdrop-blur transition-transform hover:scale-110"
            aria-label={h.label}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-electric" />
            <span className="pointer-events-none absolute left-9 top-1/2 w-44 -translate-y-1/2 border-l border-foreground/40 bg-background/80 px-3 py-2 text-left opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              <span className="block font-mono text-[10px] uppercase tracking-[0.2em]">{h.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{h.desc}</span>
            </span>
          </button>
        </Html>
      ))}
    </>
  );
}

export function Explorer({ mobile }: { mobile: boolean }) {
  const paint = usePaint();
  // Hotspots render into this layer (owned by us, not React-managed children) so closing the explorer can't hit a removeChild race.
  const hotspotLayer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExplorer(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-background" role="dialog" aria-label="Explore the BMW M4 in 3D">
      <Canvas shadows={!mobile} dpr={mobile ? [1, 1.5] : [1, 2]} camera={{ fov: 32, position: [7, 2, 7], near: 0.05, far: 60 }}>
        <Suspense fallback={null}>
          <Scene mobile={mobile} portal={hotspotLayer} />
        </Suspense>
      </Canvas>
      <div ref={hotspotLayer} className="pointer-events-none absolute inset-0 [&_button]:pointer-events-auto" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 md:p-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-electric">3D Experience</p>
          <h2 className="mt-2 font-wide text-2xl font-light md:text-4xl">BMW M4 Competition xDrive</h2>
          <p className="mt-2 text-sm text-muted-foreground">Drag to rotate · Scroll or pinch to zoom · Tap a point</p>
        </div>
        <button
          onClick={() => setExplorer(false)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center border border-foreground/30 transition-colors hover:bg-foreground/10"
          aria-label="Close 3D explorer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="flex flex-wrap gap-2">
          {(["front", "side", "rear", "top"] as const).map((k) => (
            <button
              key={k}
              onClick={() => goTo(k)}
              className="border border-foreground/25 bg-background/50 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] backdrop-blur transition-colors hover:border-electric hover:text-electric"
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => goTo("home")}
            className="flex items-center gap-2 border border-amber/40 bg-background/50 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-amber backdrop-blur transition-colors hover:border-amber"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Paint · {PAINTS.find((p) => p.id === paint)?.name}
          </p>
          <div className="flex gap-3">
            {PAINTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPaint(p.id)}
                aria-label={p.name}
                aria-pressed={paint === p.id}
                className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${paint === p.id ? "border-electric shadow-glow" : "border-foreground/20"}`}
                style={{ background: `radial-gradient(circle at 30% 30%, ${p.color}, ${p.color} 40%, #000 130%)` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
