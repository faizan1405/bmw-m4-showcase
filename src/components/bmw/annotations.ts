export type Tone = "glass" | "silver" | "blue" | "amber";
export type Note = {
  id: string;
  anchor: string; // key into CarInfo.points
  no: string;
  category: string;
  title: string;
  body: string;
  spec?: string;
  detail: string;
  tone: Tone;
  where: string;
};
export type NoteGroup = { a: number; b: number; slots: number[]; notes: Note[] };

/**
 * Callouts grouped by camera scene. [a, b] is the scroll window in which the camera frames the parts.
 * Copy sticks to published BMW M4 Competition xDrive facts; where no number is verified, it stays descriptive.
 */
export const GROUPS: NoteGroup[] = [
  {
    a: 0.235,
    b: 0.35,
    slots: [0.24, 0.47, 0.7],
    notes: [
      {
        id: "rim", anchor: "rim", no: "01", category: "Wheels", title: "M Light-Alloy Wheel", tone: "glass", where: "Front wheel",
        body: "Mixed-size M wheels: larger at the rear for traction, smaller at the front for sharper turn-in.",
        spec: "19\" front · 20\" rear",
        detail: "The M4 Competition runs a staggered set-up — 19-inch front and 20-inch rear M light-alloy wheels. Lighter M forged designs are available as options, reducing unsprung mass for more responsive handling.",
      },
      {
        id: "caliper", anchor: "caliper", no: "02", category: "Braking", title: "M Compound Brakes", tone: "amber", where: "Front brake caliper",
        body: "Large-diameter discs and fixed multi-piston front calipers for consistent, fade-resistant stopping.",
        spec: "Optional: M Carbon ceramic",
        detail: "M Compound brakes are standard, with selectable brake-pedal feel via the M setup. M Carbon ceramic brakes are optional, offering lower weight and higher thermal resistance for repeated hard use.",
      },
      {
        id: "tire", anchor: "tire", no: "03", category: "Grip", title: "Performance Tires", tone: "silver", where: "Front tire sidewall",
        body: "Wide, low-profile tires keep a large contact patch for traction, braking and precise feedback.",
        spec: "275/35 R19 · 285/30 R20",
        detail: "Front 275/35 R19 and rear 285/30 R20 tires transfer the xDrive system's power to the road. The low sidewall limits flex for accurate steering response.",
      },
    ],
  },
  {
    a: 0.415,
    b: 0.51,
    slots: [0.26, 0.48, 0.7],
    notes: [
      {
        id: "grille", anchor: "grille", no: "01", category: "Design", title: "M Kidney Grille", tone: "blue", where: "Front centre",
        body: "The vertical BMW kidney grille defines the M4's face and feeds cooling air to the engine.",
        spec: "Feeds the 3.0L M TwinPower Turbo",
        detail: "Its large vertical opening supplies air to the radiators and intercooling needed by the 3.0-litre M TwinPower Turbo inline six-cylinder engine.",
      },
      {
        id: "headlight", anchor: "headlight", no: "02", category: "Lighting", title: "Adaptive LED Headlights", tone: "silver", where: "Front headlight",
        body: "Slim LED units with signature daytime light graphics and adaptive light distribution.",
        detail: "The adaptive LED headlights adjust their beam to road and steering conditions, giving the M4 its recognisable signature lighting at day and night.",
      },
      {
        id: "intake", anchor: "intake", no: "03", category: "Aerodynamics", title: "Front Air Intakes", tone: "glass", where: "Lower front bumper",
        body: "Large intakes direct air to the brakes and coolers while shaping airflow around the front wheels.",
        detail: "The sculpted M front apron channels cooling air to the brakes and auxiliary coolers and helps manage airflow around the front of the car.",
      },
    ],
  },
  {
    a: 0.575,
    b: 0.67,
    slots: [0.36, 0.55, 0.74],
    notes: [
      {
        id: "body", anchor: "body", no: "01", category: "Form", title: "Sculpted Side Surfaces", tone: "glass", where: "Door and side panel",
        body: "Flared arches and strong shoulder lines express the wide track and athletic stance.",
        spec: "Length 4,794 mm",
        detail: "Muscular wheel arches and a long, low coupé profile give the M4 its distinctive silhouette, emphasising width and the low centre of gravity.",
      },
      {
        id: "mirror", anchor: "mirror", no: "02", category: "Design", title: "M Exterior Mirrors", tone: "blue", where: "Driver-side mirror",
        body: "Aerodynamically shaped M mirror caps designed to reduce turbulence along the cabin.",
        detail: "The M exterior mirrors use a streamlined shape, finished in high-gloss black, to complement the car's aerodynamic profile.",
      },
      {
        id: "stance", anchor: "rearWheel", no: "03", category: "Stance", title: "Performance Stance", tone: "silver", where: "Rear wheel",
        body: "Wheels pushed to the corners with a long wheelbase for stability at speed.",
        spec: "Wheelbase 2,857 mm",
        detail: "The long wheelbase and wide track, combined with M xDrive all-wheel drive, deliver composure under hard acceleration and in fast corners.",
      },
    ],
  },
  {
    a: 0.7,
    b: 0.8,
    slots: [0.26, 0.48, 0.7],
    notes: [
      {
        id: "taillight", anchor: "taillight", no: "01", category: "Lighting", title: "Rear LED Lights", tone: "amber", where: "Rear light cluster",
        body: "Three-dimensional LED light clusters with a distinctive night-time signature.",
        detail: "The rear LED lights wrap around the rear quarters, emphasising the width of the car and giving it a recognisable signature after dark.",
      },
      {
        id: "diffuser", anchor: "diffuser", no: "02", category: "Aerodynamics", title: "Rear Diffuser", tone: "glass", where: "Lower rear bumper",
        body: "The M rear apron with diffuser manages airflow leaving the underbody.",
        detail: "The diffuser helps air exit cleanly from beneath the car, framing the exhaust outlets within a performance-focused rear apron.",
      },
      {
        id: "exhaust", anchor: "exhaust", no: "03", category: "Sound", title: "M Sport Exhaust", tone: "amber", where: "Exhaust tailpipes",
        body: "Four tailpipes — the classic M signature — with a flap-controlled exhaust sound.",
        spec: "4 tailpipes",
        detail: "The M Sport exhaust system with four tailpipes lets the driver switch between a more restrained and a more emotive sound via the exhaust flaps.",
      },
    ],
  },
  {
    a: 0.86,
    b: 0.935,
    slots: [0.3, 0.5, 0.7],
    notes: [
      {
        id: "roof", anchor: "roof", no: "01", category: "Lightweight", title: "CFRP Roof", tone: "silver", where: "Roof panel",
        body: "A carbon-fibre-reinforced plastic roof lowers weight high up, lowering the centre of gravity.",
        detail: "The M4 Competition Coupé features a CFRP roof. Saving weight at the highest point of the car lowers the centre of gravity and benefits agility.",
      },
      {
        id: "hood", anchor: "hood", no: "02", category: "Design", title: "Sculpted Bonnet", tone: "blue", where: "Bonnet",
        body: "A powerful domed bonnet with sharp contours above the M TwinPower Turbo engine.",
        spec: "530 PS · 650 Nm",
        detail: "Below the bonnet sits the 3.0-litre M TwinPower Turbo six-cylinder producing 530 PS and 650 Nm, enabling 0–100 km/h in 3.5 seconds.",
      },
      {
        id: "roofline", anchor: "roofline", no: "03", category: "Form", title: "Coupé Roofline", tone: "glass", where: "Rear roofline",
        body: "The low, flowing coupé line tapers into the boot lid for a clean aerodynamic profile.",
        spec: "Height 1,393 mm",
        detail: "The roofline flows smoothly into the rear, combining a low silhouette with a cleanly detached airflow at the rear edge.",
      },
    ],
  },
];
