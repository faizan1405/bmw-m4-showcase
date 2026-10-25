import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCar, CarMaterials } from "./Car";
import { Studio } from "./Studio";
import { CameraRig } from "./CameraRig";
import { atmosphere, isExplorerOpen, setExplorer, smooth, story, subscribeExplorer } from "./store";
import { Annotations } from "./Annotations.tsx";

/**
 * Pauses the story render loop while the full-screen explorer is open and always resumes it on close.
 * Driven by a plain store listener (not a React prop) so a failed/interrupted React commit while the
 * explorer unmounts can never leave the cinematic camera frozen on frameloop="never".
 */
function StoryLoop() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const sync = () => {
      setFrameloop(isExplorerOpen() ? "never" : "always");
      invalidate();
    };
    sync();
    const off = subscribeExplorer(sync);
    return () => {
      off();
      setFrameloop("always");
    };
  }, [setFrameloop, invalidate]);
  return null;
}

function Scene({ mobile }: { mobile: boolean }) {
  const { root, info } = useCar();
  return (
    <>
      <Studio mobile={mobile} />
      <primitive object={root} />
      <CarMaterials storyDriven />
      <CameraRig info={info} />
    </>
  );
}

const SCENES = [
  { a: 0, b: 0.14, label: "The Reveal" },
  { a: 0.14, b: 0.33, label: "Precision" },
  { a: 0.33, b: 0.49, label: "Presence" },
  { a: 0.49, b: 0.64, label: "Performance" },
  { a: 0.64, b: 0.77, label: "Rear Design" },
  { a: 0.77, b: 0.91, label: "Form" },
  { a: 0.91, b: 1.01, label: "Finale" },
];

// [fadeInStart, fadeOutEnd] per overlay panel
const RANGES: Record<string, [number, number]> = {
  hero: [-1, 0.12],
  wheel: [0.25, 0.345],
  front: [0.415, 0.505],
  perf: [0.565, 0.665],
  rear: [0.7, 0.785],
  roof: [0.845, 0.925],
  finale: [0.95, 2],
};

const Spec = ({ children }: { children: React.ReactNode }) => (
  <p data-i className="font-mono text-[11px] uppercase tracking-[0.28em] text-electric">
    {children}
  </p>
);

export function Story({ mobile }: { mobile: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = root.current!;
    const tween = gsap.to(story, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: reduce ? true : 0.9 },
    });

    const panels = Array.from(el.querySelectorAll<HTMLElement>("[data-panel]"));
    const counters = Array.from(el.querySelectorAll<HTMLElement>("[data-count]"));
    const sceneNo = el.querySelector<HTMLElement>("[data-scene-no]")!;
    const sceneLabel = el.querySelector<HTMLElement>("[data-scene-label]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const glow = el.querySelector<HTMLElement>("[data-glow]")!;
    let lastScene = -1;

    const tick = () => {
      const p = story.p;
      const vis: Record<string, number> = {};
      for (const panel of panels) {
        const id = panel.dataset["panel"]!;
        const [a, b] = RANGES[id]!;
        const v = smooth(a, a + 0.035, p) * (1 - smooth(b - 0.03, b, p));
        vis[id] = v;
        panel.style.visibility = v < 0.005 ? "hidden" : "visible";
        panel.querySelectorAll<HTMLElement>("[data-i]").forEach((c, i) => {
          const cv = Math.min(1, Math.max(0, v * 1.6 - i * 0.12));
          c.style.opacity = String(cv);
          c.style.transform = `translate3d(0, ${(1 - cv) * 24}px, 0)`;
        });
      }
      const perfLocal = smooth(0.565, 0.61, p);
      counters.forEach((c) => {
        const target = Number(c.dataset["count"]);
        const dec = Number(c.dataset["dec"] || 0);
        c.textContent = (target * perfLocal).toFixed(dec);
      });
      glow.style.background = `radial-gradient(70% 55% at 50% 100%, ${atmosphere.a.replace("rgb", "rgba").replace(")", ",0.22)")}, transparent 70%), radial-gradient(50% 45% at 100% 0%, ${atmosphere.b.replace("rgb", "rgba").replace(")", ",0.14)")}, transparent 70%)`;
      const idx = Math.max(0, SCENES.findIndex((s) => p >= s.a && p < s.b));
      if (idx !== lastScene) {
        lastScene = idx;
        sceneNo.textContent = String(idx + 1).padStart(2, "0");
        sceneLabel.textContent = SCENES[idx]!.label;
      }
      bar.style.transform = `scaleY(${p})`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const panelBase = "pointer-events-none absolute";
  const side =
    "inset-x-0 bottom-0 bg-veil-bottom px-6 pb-14 pt-24 md:inset-y-0 md:right-auto md:flex md:w-[46%] md:flex-col md:justify-center md:bg-veil md:px-16 md:pb-0";

  return (
    <section id="discover" ref={root} className="relative h-[820vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <Canvas
          shadows={!mobile}
          dpr={mobile ? [1, 1.5] : [1, 2]}
          camera={{ fov: 30, near: 0.05, far: 60, position: [8.5, 2.4, 8.5] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          className="absolute inset-0"
        >
          <StoryLoop />
          <Suspense fallback={null}>
            <Scene mobile={mobile} />
          </Suspense>
        </Canvas>

        {/* Scene-tinted light wash, colour follows the 3D atmosphere */}
        <div data-glow className="pointer-events-none absolute inset-0 mix-blend-screen" />

        <Annotations mobile={mobile} />

        {/* SCENE 1 */}
        <div data-panel="hero" className={`${panelBase} inset-x-0 bottom-0 top-0 flex flex-col items-center justify-end px-6 pb-24 text-center md:pb-20`}>
          <p data-i className="mb-5 font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
            BMW M4 Competition xDrive
          </p>
          <h1 data-i className="text-chrome font-wide text-[13vw] font-light leading-[0.9] tracking-tight md:text-[6.4vw]">
            ENGINEERED
            <br />
            TO <span className="text-accent-gradient">THRILL.</span>
          </h1>
          <p data-i className="mt-6 font-mono text-xs uppercase tracking-[0.35em]">
            <span className="text-amber">530 PS.</span> Pure adrenaline.
          </p>
          <div data-i className="mt-12 flex flex-col items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Scroll to explore</span>
            <span className="relative h-10 w-px overflow-hidden bg-foreground/15">
              <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-foreground" />
            </span>
          </div>
        </div>

        {/* SCENE 2 */}
        <div data-panel="wheel" className={`${panelBase} ${side}`}>
          <Spec>02 — Chassis</Spec>
          <h2 data-i className="mt-4 font-wide text-4xl font-light leading-[0.95] md:text-6xl">
            PRECISION IN
            <br />
            EVERY TURN.
          </h2>
          <p data-i className="mt-6 max-w-sm text-lg font-light text-muted-foreground">M Forged Wheels. Performance-focused braking. Confident control.</p>
        </div>

        {/* SCENE 3 */}
        <div data-panel="front" className={`${panelBase} ${side}`}>
          <Spec>03 — Design</Spec>
          <h2 data-i className="mt-4 font-wide text-4xl font-light leading-[0.95] md:text-6xl">
            AN ICONIC
            <br />
            PRESENCE.
          </h2>
          <p data-i className="mt-6 max-w-sm text-lg font-light text-muted-foreground">Signature BMW M design. Adaptive LED headlights. Unmistakable road presence.</p>
        </div>

        {/* SCENE 4 */}
        <div data-panel="perf" className={`${panelBase} inset-x-0 top-0 px-6 pt-24 md:px-16 md:pt-28`}>
          <Spec>04 — Performance</Spec>
          <div className="mt-6 grid grid-cols-3 gap-4 md:max-w-5xl md:gap-12">
            {[
              { n: 530, d: 0, u: "PS", l: "Maximum Power" },
              { n: 650, d: 0, u: "Nm", l: "Maximum Torque" },
              { n: 3.5, d: 1, u: "SEC", l: "0–100 km/h" },
            ].map((s) => (
              <div key={s.l} data-i className="border-t border-electric/60 bg-background/30 px-4 pb-4 pt-4 backdrop-blur-md">
                <p className="font-wide text-3xl font-light tabular-nums md:text-7xl">
                  <span data-count={s.n} data-dec={s.d} className="text-chrome">0</span>
                  <span className="ml-1 text-sm text-amber md:text-xl">{s.u}</span>
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground md:text-xs">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SCENE 5 */}
        <div data-panel="rear" className={`${panelBase} ${side}`}>
          <Spec>05 — Rear</Spec>
          <h2 data-i className="mt-4 font-wide text-4xl font-light leading-[0.95] md:text-6xl">
            POWER LEAVES
            <br />
            AN IMPRESSION.
          </h2>
          <p data-i className="mt-6 max-w-sm text-lg font-light text-muted-foreground">
            Designed to command attention from every angle.
          </p>
        </div>

        {/* SCENE 6 */}
        <div data-panel="roof" className={`${panelBase} inset-x-0 bottom-0 px-6 pb-14 md:bottom-auto md:top-0 md:px-16 md:pt-28`}>
          <Spec>06 — Form</Spec>
          <h2 data-i className="mt-4 font-wide text-4xl font-light leading-[0.95] md:text-6xl">
            FORM FOLLOWS PERFORMANCE.
          </h2>
          <p data-i className="mt-4 text-lg font-light text-muted-foreground">Every surface engineered with purpose.</p>
        </div>

        {/* SCENE 7 */}
        <div data-panel="finale" className={`${panelBase} inset-x-0 bottom-0 bg-veil-bottom px-6 pb-14 pt-32 text-center md:pb-16`}>
          <h2 data-i className="font-wide text-[10vw] font-light leading-[0.92] md:text-6xl">
            YOUR NEXT OBSESSION AWAITS.
          </h2>
          <p data-i className="mt-4 text-lg font-light text-muted-foreground">Experience extraordinary performance.</p>
          <div data-i className="pointer-events-auto mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="btn-primary w-full px-8 py-4 font-mono text-xs uppercase tracking-[0.25em] sm:w-auto"
            >
              Book a private viewing
            </a>
            <button
              onClick={() => setExplorer(true)}
              className="w-full border border-silver/50 bg-background/30 px-8 py-4 font-mono text-xs uppercase tracking-[0.25em] backdrop-blur transition-colors hover:border-electric hover:text-electric sm:w-auto"
            >
              Explore the vehicle
            </button>
          </div>
        </div>

        {/* Scene indicator + progress */}
        <div className="pointer-events-none absolute bottom-8 right-8 z-20 hidden flex-row-reverse items-end gap-4 md:flex">
          <div className="text-right font-mono text-[10px] uppercase tracking-[0.3em]">
            <span data-scene-no className="text-electric">01</span>
            <span className="text-muted-foreground"> / 07</span>
            <p data-scene-label className="mt-1 text-muted-foreground">The Reveal</p>
          </div>
          <div className="relative h-16 w-px bg-foreground/15">
            <div data-bar className="absolute inset-0 origin-top bg-accent-gradient" style={{ transform: "scaleY(0)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
