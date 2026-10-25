import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { GROUPS, type Note, type Tone } from "./annotations";
import { anchors, carMeta, smooth, story } from "./store";

const ACCENT: Record<Tone, string> = {
  glass: "var(--color-electric)",
  silver: "var(--color-silver)",
  blue: "var(--color-electric)",
  amber: "var(--color-amber)",
};
const CARD: Record<Tone, string> = {
  glass: "bg-background/55 border-foreground/15 text-foreground",
  silver: "bg-silver/90 border-silver text-background",
  blue: "bg-royal/70 border-electric/40 text-foreground",
  amber: "bg-background/60 border-amber/40 text-foreground",
};
const CARD_W = 300;
const ALL = GROUPS.flatMap((g) => g.notes.map((n, i) => ({ n, i, g })));
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Leader lines + cards attached to projected 3D anchors; fully scroll-driven (reversible, settles when scrolling stops). */
export function Annotations({ mobile }: { mobile: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Note | null>(null);

  useEffect(() => {
    const el = root.current!;
    const q = (id: string, part: string) => el.querySelector<HTMLElement & SVGElement>(`[data-a="${id}"][data-part="${part}"]`);
    const parts = ALL.map(({ n, i, g }) => ({
      n, i, g,
      dot: q(n.id, "dot")!, card: q(n.id, "card")!, line: q(n.id, "line")! as unknown as SVGPathElement,
    }));
    const tick = () => {
      const p = story.p;
      const W = window.innerWidth, H = window.innerHeight;
      // Mobile: only the most recent callout of the active group.
      let mobileActive = "";
      if (mobile) {
        for (const x of parts) {
          const t = smooth(x.g.a + x.i * 0.025, x.g.a + x.i * 0.025 + 0.02, p) * (1 - smooth(x.g.b - 0.025, x.g.b, p));
          if (t > 0.3 && anchors[x.n.anchor]?.vis) mobileActive = x.n.id;
        }
      }
      let stackY = -1;
      let stackGroup: unknown = null;
      for (const x of parts) {
        const a = anchors[x.n.anchor];
        const start = x.g.a + x.i * 0.025;
        let t = smooth(start, start + 0.02, p) * (1 - smooth(x.g.b - 0.025, x.g.b, p));
        if (!a || !a.vis || (mobile && x.n.id !== mobileActive)) t = 0;
        const dotT = clamp01(t / 0.25), lineT = clamp01((t - 0.2) / 0.45), cardT = clamp01((t - 0.55) / 0.45);
        const hidden = t < 0.005;
        x.dot.style.visibility = x.card.style.visibility = hidden ? "hidden" : "visible";
        x.line.style.visibility = hidden ? "hidden" : "visible";
        if (hidden || !a) continue;

        x.dot.style.transform = `translate3d(${a.x}px, ${a.y}px, 0) scale(${0.4 + dotT * 0.6})`;
        x.dot.style.opacity = String(dotT);
        x.dot.style.pointerEvents = cardT > 0.6 ? "auto" : "none";

        // Card position: right-hand column on desktop (fixed slots never overlap), top sheet on mobile.
        let cx: number, cy: number, ax: number, ay: number;
        const ch = x.card.offsetHeight || 150;
        if (mobile) {
          const cw = W - 32;
          cx = 16;
          cy = a.y > H * 0.42 ? 72 : Math.min(H - ch - 24, a.y + 80);
          x.card.style.width = `${cw}px`;
          ax = Math.min(Math.max(a.x, 40), W - 40);
          ay = cy < a.y ? cy + ch : cy;
        } else {
          cx = W - CARD_W - 40;
          // Stack cards of a group from the first slot, using real card heights so they never overlap.
          if (stackGroup !== x.g) {
            stackGroup = x.g;
            const total = parts.filter((o) => o.g === x.g).reduce((s, o) => s + (o.card.offsetHeight || 150) + 14, 0);
            stackY = Math.max(90, Math.min(x.g.slots[0]! * H - ch / 2, H - 100 - total));
          }
          cy = stackY;
          stackY = cy + ch + 14;
          ax = cx;
          ay = cy + 26;
        }
        x.card.style.transform = `translate3d(${cx}px, ${cy + (1 - cardT) * 14}px, 0)`;
        x.card.style.opacity = String(cardT);
        x.card.style.pointerEvents = cardT > 0.6 ? "auto" : "none";

        const elbow = mobile ? `L ${ax} ${ay}` : `L ${ax - 36} ${ay} L ${ax} ${ay}`;
        x.line.setAttribute("d", `M ${a.x} ${a.y} ${elbow}`);
        x.line.style.strokeDashoffset = String(1 - lineT);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [mobile]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-10">
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          {(Object.keys(ACCENT) as Tone[]).map((t) => (
            <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 10 0 L 0 5 L 10 10" fill="none" stroke={ACCENT[t]} strokeWidth="1.6" />
            </marker>
          ))}
        </defs>
        {ALL.map(({ n }) => (
          <path
            key={n.id}
            data-a={n.id}
            data-part="line"
            pathLength={1}
            fill="none"
            stroke={ACCENT[n.tone]}
            strokeWidth={1}
            strokeDasharray="1"
            markerStart={`url(#arrow-${n.tone})`}
            style={{ visibility: "hidden", filter: `drop-shadow(0 0 3px ${ACCENT[n.tone]})` }}
          />
        ))}
      </svg>

      {ALL.map(({ n }) => (
        <button
          key={n.id}
          data-a={n.id}
          data-part="dot"
          onClick={() => setOpen(n)}
          aria-label={`Details: ${n.title}`}
          className="absolute left-0 top-0 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center"
          style={{ visibility: "hidden" }}
        >
          <span className="absolute h-6 w-6 animate-ping rounded-full opacity-40" style={{ background: ACCENT[n.tone] }} />
          <span className="absolute h-5 w-5 rounded-full border" style={{ borderColor: ACCENT[n.tone] }} />
          <span className="h-2 w-2 rounded-full" style={{ background: ACCENT[n.tone], boxShadow: `0 0 10px ${ACCENT[n.tone]}` }} />
        </button>
      ))}

      {ALL.map(({ n }) => (
        <button
          key={n.id}
          data-a={n.id}
          data-part="card"
          onClick={() => setOpen(n)}
          className={`absolute left-0 top-0 border text-left backdrop-blur-xl transition-colors hover:border-foreground/50 ${CARD[n.tone]}`}
          style={{ width: mobile ? undefined : CARD_W, visibility: "hidden" }}
        >
          <span className="absolute inset-y-0 left-0 w-0.5" style={{ background: ACCENT[n.tone] }} />
          <span className="block px-5 py-4">
            <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
              <span>{n.no} — {n.category}</span>
              <span aria-hidden>+</span>
            </span>
            <span className="mt-2 block font-wide text-lg font-light leading-tight">{n.title}</span>
            <span className={`mt-1.5 block text-[13px] leading-snug opacity-80 ${mobile ? "line-clamp-2" : ""}`}>{n.body}</span>
            {n.spec && (
              <span className="mt-3 inline-block border-t pt-2 font-mono text-[11px] tracking-[0.12em]" style={{ borderColor: ACCENT[n.tone] }}>
                {n.spec}
              </span>
            )}
          </span>
        </button>
      ))}

      <Detail note={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Detail({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const [shown, setShown] = useState<Note | null>(note);
  useEffect(() => {
    if (note) setShown(note);
  }, [note]);
  const pt = shown && carMeta.points?.[shown.anchor];
  const L = carMeta.length || 4.8, H = carMeta.height || 1.4;
  const dx = pt ? 20 + ((pt.p.x + L / 2) / L) * 200 : 120;
  const dy = pt ? 78 - (pt.p.y / H) * 62 : 50;
  const accent = shown ? ACCENT[shown.tone] : "var(--color-electric)";

  return (
    <div
      role="dialog"
      aria-hidden={!note}
      className={`fixed bottom-4 left-4 right-4 z-40 border border-foreground/15 bg-background/80 p-6 backdrop-blur-2xl transition-all duration-500 md:left-auto md:right-8 md:bottom-8 md:w-[420px] ${
        note ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      style={{ boxShadow: `0 30px 80px -30px ${accent}` }}
      onTransitionEnd={() => !note && setShown(null)}
    >
      {shown && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
                {shown.no} — {shown.category}
              </p>
              <h3 className="mt-2 font-wide text-2xl font-light">{shown.title}</h3>
            </div>
            <button onClick={onClose} aria-label="Close details" className="flex h-10 w-10 shrink-0 items-center justify-center border border-foreground/20 hover:bg-foreground/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Location indicator on a side silhouette of the car */}
          <svg viewBox="0 0 240 90" className="mt-5 w-full">
            <path
              d="M20 72 L24 58 Q40 50 70 48 L100 30 Q130 22 160 26 L190 40 Q214 44 220 56 L222 72 Z"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.35"
            />
            <circle cx="62" cy="72" r="11" fill="none" stroke="currentColor" strokeOpacity="0.35" />
            <circle cx="186" cy="72" r="11" fill="none" stroke="currentColor" strokeOpacity="0.35" />
            <circle cx={240 - dx} cy={dy} r="9" fill={accent} opacity="0.25" />
            <circle cx={240 - dx} cy={dy} r="3.5" fill={accent} />
          </svg>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{shown.where}</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">{shown.detail}</p>
          {shown.spec && (
            <p className="mt-4 border-t border-foreground/15 pt-3 font-mono text-xs tracking-[0.12em]" style={{ color: accent }}>
              {shown.spec}
            </p>
          )}
        </>
      )}
    </div>
  );
}
