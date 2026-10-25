# Running this project outside Lovable

This is a full copy of the project source, including the 3D car model file, so it runs as-is.

## Requirements

- Node.js 20+ (with npm), or Bun 1.2+

## Install and run

```sh
npm install
npm run dev
```

Then open the printed local address (usually http://localhost:5173, or http://localhost:8080 in the Lovable sandbox).

Other commands:

```sh
npm run build     # production build
npm run preview   # serve the production build
npm run lint      # eslint
npm run test      # vitest
npm run format    # prettier
```

With Bun instead of npm: `bun install`, then `bun run dev` (same script names).

## The 3D model

The car is a real glTF binary model (`bmw-m4.glb`, 5.8 MB, meshopt-compressed). It is stored at:

```
public/__l5e/assets-v1/a866037f-6ebb-4d41-9887-9cd432e77a15/bmw-m4.glb
```

That path is what the app already requests at runtime (`src/assets/bmw-m4.glb.asset.json` holds the pointer), and Vite serves everything under `public/` from the site root — so the model loads locally with **no code changes**.

If you would rather keep the file at a tidier location, move it to `src/assets/bmw-m4.glb` and change one line in `src/components/bmw/Car.tsx`:

```ts
// was: const MODEL_URL = modelAsset.url;
const MODEL_URL = "/src/assets/bmw-m4.glb"; // or import the file directly with Vite's ?url suffix
```

Inside Lovable, leave the code as it is — the hosted asset is used there.

## Fonts

Typefaces (Archivo, JetBrains Mono, Manrope) are loaded from Google Fonts via a `<link>` in
`src/routes/__root.tsx`. They need an internet connection; offline the page falls back to system fonts.

## Model credit (keep this)

Model: "BMW M4 Competition M Package" by [SRT Performance](https://sketchfab.com/TheRealSRT) on
Sketchfab, licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/), optimized for web.
The credit is shown in the site footer (`src/components/bmw/Contact.tsx`) — keep it if you publish
or redistribute the model.

## What is in the archive

- `src/` — all app code (routes, components, styles, tests)
- `public/` — favicon, robots.txt, and the 3D model
- Config: `package.json`, `bun.lock`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`,
  `eslint.config.js`, `components.json`, `bunfig.toml`, `.prettierrc`, `.prettierignore`, `.gitignore`
- Docs: `README.md`, `AGENTS.md`, this file

## What was left out

`node_modules` (recreated by `npm install`), build output (`dist`, `.output`), Git metadata, and
Lovable's internal project folders. There is no database, API key, or secret in this project — the
booking form currently only shows a confirmation on screen and does not send mail anywhere.
