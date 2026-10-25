import { useSyncExternalStore } from "react";
import * as THREE from "three";

/** Single normalized scroll value (0..1) driving the whole cinematic story. */
export const story = { p: 0 };

/** Screen-space projections of 3D anchor points, written by the camera rig every frame. */
export type Screen = { x: number; y: number; vis: boolean };
export const anchors: Record<string, Screen> = {};

/** Scene atmosphere colour (CSS rgb string) written by the rig, read by DOM overlays. */
export const atmosphere = { a: "rgb(40,90,255)", b: "rgb(120,90,255)" };

/** Car-space metadata for DOM widgets (detail panel location indicator). */
export const carMeta: { length: number; height: number; points: Record<string, AnchorPoint> | null } = { length: 0, height: 0, points: null };

export type AnchorPoint = { p: THREE.Vector3; n: THREE.Vector3 };

export type CarInfo = {
  length: number;
  width: number;
  height: number;
  wheel: THREE.Vector3;
  headlight: THREE.Vector3;
  rear: THREE.Vector3;
  points: Record<string, AnchorPoint>;
};

export const PAINTS = [
  { id: "graphite", name: "Graphite Grey", color: "#4d545c", metalness: 0.8, roughness: 0.28 },
  { id: "alpine", name: "Alpine White", color: "#e6e8e9", metalness: 0.15, roughness: 0.22 },
  { id: "sapphire", name: "Sapphire Black", color: "#0b0d12", metalness: 0.8, roughness: 0.2 },
  { id: "blue", name: "Deep Blue", color: "#122c63", metalness: 0.85, roughness: 0.26 },
] as const;
export type PaintId = (typeof PAINTS)[number]["id"];

let paint: PaintId = "graphite";
const listeners = new Set<() => void>();
export function setPaint(id: PaintId) {
  paint = id;
  listeners.forEach((l) => l());
}
export function usePaint() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => paint,
    () => paint,
  );
}
export const getPaint = () => paint;

let explorerOpen = false;
const exListeners = new Set<() => void>();
export function setExplorer(v: boolean) {
  explorerOpen = v;
  exListeners.forEach((l) => l());
}
/** Plain (non-React) subscription so the story canvas can pause/resume its render loop independently of React commits. */
export function subscribeExplorer(l: () => void) {
  exListeners.add(l);
  return () => void exListeners.delete(l);
}
export const isExplorerOpen = () => explorerOpen;
export function useExplorer() {
  return useSyncExternalStore(
    (l) => (exListeners.add(l), () => exListeners.delete(l)),
    () => explorerOpen,
    () => false,
  );
}

/** Scrolls the page so the story reaches the given progress. */
export function scrollToStory(p: number) {
  const el = document.getElementById("discover");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = el.offsetHeight - window.innerHeight;
  window.scrollTo({ top: top + range * p, behavior: "smooth" });
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
