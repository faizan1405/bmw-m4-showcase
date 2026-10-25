import { useState } from "react";

type Form = { name: string; phone: string; email: string; vehicle: string; method: string; message: string };
const empty: Form = { name: "", phone: "", email: "", vehicle: "BMW M4 Competition xDrive", method: "Email", message: "" };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) e.name = "Please enter your full name.";
  if (!/^[+()\d\s-]{7,20}$/.test(f.phone.trim())) e.phone = "Please enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Please enter a valid email.";
  if (f.message.length > 1000) e.message = "Please keep your message under 1000 characters.";
  return e;
}

const field =
  "w-full border-0 border-b border-input bg-transparent px-0 py-3 text-lg font-light outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-electric";
const label = "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground";

export function Contact() {
  const [f, setF] = useState<Form>(empty);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setDone(true);
  };

  return (
    <section id="contact" className="bg-section relative border-t border-electric/30 bg-background px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className={label}>Contact</p>
          <h2 className="mt-5 font-wide text-5xl font-light leading-[0.95] md:text-7xl">
            <span className="text-chrome">EXPERIENCE IT</span>
            <br />
            <span className="text-accent-gradient">IN PERSON.</span>
          </h2>
          <p className="mt-8 max-w-md text-lg font-light text-muted-foreground">
            Arrange a private, one-to-one viewing of the BMW M4 Competition xDrive in our showroom.
          </p>
          <div className="mt-12 space-y-6 border-l border-electric/50 pl-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber">Demo details — replace with real dealership info</p>
            <div>
              <p className={label}>Showroom</p>
              <p className="mt-1 font-light">Vantage Motors, 1 Example Avenue, Your City</p>
            </div>
            <div>
              <p className={label}>Phone</p>
              <p className="mt-1 font-light">+00 000 000 000</p>
            </div>
            <div>
              <p className={label}>Hours</p>
              <p className="mt-1 font-light">Mon–Sat, by appointment</p>
            </div>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col justify-center border border-electric/40 bg-royal/20 p-10 backdrop-blur">
            <p className={label}>Demo mode</p>
            <h3 className="mt-4 font-wide text-3xl font-light">Thank you, {f.name.split(" ")[0]}.</h3>
            <p className="mt-4 text-muted-foreground">
              Your details passed validation, but this demo has no inquiry inbox connected yet — so nothing has been sent.
              Once the dealership's real contact address is configured, requests will be delivered.
            </p>
            <button onClick={() => (setDone(false), setF(empty))} className="mt-8 self-start font-mono text-xs uppercase tracking-[0.25em] link-underline">
              New request
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-8 sm:grid-cols-2">
            {(
              [
                ["name", "Full Name", "text", "name"],
                ["phone", "Phone Number", "tel", "tel"],
                ["email", "Email", "email", "email"],
              ] as const
            ).map(([k, l, t, ac]) => (
              <label key={k} className={k === "email" ? "sm:col-span-2" : ""}>
                <span className={label}>{l}</span>
                <input type={t} autoComplete={ac} value={f[k]} onChange={set(k)} className={field} aria-invalid={!!errors[k]} maxLength={120} />
                {errors[k] && <span className="mt-2 block text-sm text-destructive">{errors[k]}</span>}
              </label>
            ))}
            <label>
              <span className={label}>Interested Vehicle</span>
              <select value={f.vehicle} onChange={set("vehicle")} className={`${field} [&>option]:bg-background`}>
                <option>BMW M4 Competition xDrive</option>
                <option>BMW M4 Competition Coupé</option>
                <option>Other M model</option>
              </select>
            </label>
            <label>
              <span className={label}>Preferred Contact Method</span>
              <select value={f.method} onChange={set("method")} className={`${field} [&>option]:bg-background`}>
                <option>Email</option>
                <option>Phone</option>
                <option>WhatsApp</option>
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Message</span>
              <textarea value={f.message} onChange={set("message")} rows={4} maxLength={1000} className={`${field} resize-none`} />
              {errors.message && <span className="mt-2 block text-sm text-destructive">{errors.message}</span>}
            </label>
            <button
              type="submit"
              className="btn-primary px-8 py-5 font-mono text-xs uppercase tracking-[0.25em] sm:col-span-2 sm:justify-self-start"
            >
              Request a private viewing
            </button>
          </form>
        )}
      </div>

      <footer className="mx-auto mt-28 flex max-w-[1400px] flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:justify-between">
        <p>© Vantage Motors — independent dealership demo. Not affiliated with or endorsed by BMW AG.</p>
        <p>
          3D model “BMW M4 Competition M Package” by{" "}
          <a className="underline" href="https://sketchfab.com/TheRealSRT" target="_blank" rel="noreferrer">SRT Performance</a>, licensed{" "}
          <a className="underline" href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, optimized for web.
        </p>
      </footer>
    </section>
  );
}
