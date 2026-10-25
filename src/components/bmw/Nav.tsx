import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { scrollToStory, setExplorer } from "./store";

const LINKS: { label: string; go: () => void }[] = [
  { label: "Discover", go: () => scrollToStory(0) },
  { label: "Performance", go: () => scrollToStory(0.6) },
  { label: "Design", go: () => scrollToStory(0.45) },
  { label: "3D Experience", go: () => setExplorer(true) },
  { label: "Contact", go: () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }) },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "border-b border-border bg-background/70 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:h-20 md:px-10">
        <a href="#discover" onClick={(e) => (e.preventDefault(), scrollToStory(0))} className="font-wide text-sm tracking-[0.35em]">
          VANTAGE<span className="text-electric"> MOTORS</span>
        </a>
        <nav className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <button key={l.label} onClick={l.go} className="link-underline font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/80 hover:text-foreground">
              {l.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="btn-primary hidden px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] sm:inline-block"
          >
            Book a viewing
          </a>
          <button onClick={() => setOpen((o) => !o)} className="flex h-11 w-11 items-center justify-center lg:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className={`overflow-hidden transition-[max-height] duration-500 lg:hidden ${open ? "max-h-[480px]" : "max-h-0"}`}>
        <nav className="flex flex-col px-5 pb-8">
          {LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => (setOpen(false), l.go())}
              className="border-b border-border py-4 text-left font-wide text-2xl font-light"
            >
              {l.label}
            </button>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="btn-primary mt-6 py-4 text-center font-mono text-xs uppercase tracking-[0.25em]">
            Book a viewing
          </a>
        </nav>
      </div>
    </header>
  );
}
