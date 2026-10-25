# Project rules
- The 3D story is driven by one normalized scroll value (`story.p` in src/components/bmw/store.ts) tweened by GSAP ScrollTrigger scrub; camera, lighting and text panels all read it — keeps everything in sync and reversible.
- Camera keyframes are derived from the loaded model's measured bounds (Car.tsx useCar), never hard-coded world points — so close-ups stay aligned if the model changes.
- The 3D experience is client-only (lazy + ClientOnly in the index route) — WebGL/three cannot run during SSR.
- The GLB model is hosted as a Lovable asset (src/assets/*.asset.json); CC BY 4.0 attribution must stay in the footer.
- Feature callouts anchor to points measured from real mesh vertices (anchors3d.ts) and are projected each frame by the camera rig; copy lives in annotations.ts — never position callouts with fixed CSS offsets.
- The story canvas pauses/resumes its render loop via a plain store listener (StoryLoop in Story.tsx), never a React `frameloop` prop — a failed commit while the explorer unmounts must not freeze the scroll camera.
- Explorer hotspots (drei Html) render into an Explorer-owned portal layer — the default canvas-parent target threw removeChild errors on close.
