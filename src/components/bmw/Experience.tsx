import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { Story } from "./Story";
import { Explorer } from "./Explorer";
import { useExplorer } from "./store";

function Loader() {
  const { progress, active } = useProgress();
  const [gone, setGone] = useState(false);
  const done = !active && progress >= 100;
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setGone(true), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [done]);
  if (gone) return null;
  return (
    <div className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${done ? "opacity-0" : "opacity-100"}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.45em] text-muted-foreground">Preparing your experience</p>
      <div className="mt-6 h-px w-56 bg-foreground/15">
        <div className="h-full origin-left bg-foreground transition-transform duration-300" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <p className="mt-4 font-mono text-[10px] tabular-nums text-muted-foreground">{Math.round(progress)}%</p>
    </div>
  );
}

function Cursor() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = document.getElementById("cursor-dot");
    if (!el) return;
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const move = (e: PointerEvent) => ((x = e.clientX), (y = e.clientY));
    const loop = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.transform = `translate3d(${cx - 14}px, ${cy - 14}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    el.style.opacity = "1";
    return () => (window.removeEventListener("pointermove", move), cancelAnimationFrame(raf));
  }, []);
  return <div id="cursor-dot" className="pointer-events-none fixed left-0 top-0 z-[80] h-7 w-7 rounded-full border border-foreground/50 opacity-0 mix-blend-difference" />;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Experience() {
  const explorer = useExplorer();
  const [mobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [webgl] = useState(hasWebGL);

  if (!webgl) {
    return (
      <section id="discover" className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-muted-foreground">BMW M4 Competition xDrive</p>
        <h1 className="mt-6 font-wide text-5xl font-light md:text-7xl">ENGINEERED TO THRILL.</h1>
        <p className="mt-6 max-w-md text-muted-foreground">Your browser can't display the interactive 3D experience. Visit us for a private viewing instead.</p>
      </section>
    );
  }
  return (
    <>
      <Loader />
      <Cursor />
      <Story mobile={mobile} />
      {explorer && <Explorer mobile={mobile} />}
    </>
  );
}
