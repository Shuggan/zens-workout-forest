# Zen's Workout Forest 🌱

A personal workout tracker that grows a tiny 3D forest. Search for a workout
video, do it, log it — and every ~5 minutes of movement plants something new
on a floating low-poly island. Built with Next.js, React Three Fiber, and a
Vercel Blob JSON store for the workout log (single user, no accounts).

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
```

The app is PWA-installable (manifest + icons in `public/icons/`), locked
behind a 6-digit passcode (`NEXT_PUBLIC_APP_PIN` in `.env.local`, changeable
in Settings), and an unlock lasts 3 days.

Copy `.env.example` to `.env.local` and set your passcode before running locally.
In production, add `NEXT_PUBLIC_APP_PIN` in Vercel project settings.

### Workout log storage

The workout log is the one piece of data worth not losing, so it's persisted
server-side as a single private JSON blob via [Vercel Blob](https://vercel.com/docs/vercel-blob)
rather than `localStorage` — Vercel's serverless functions don't have a
durable filesystem, so a plain file on disk wouldn't survive between
requests. `app/api/workouts/route.ts` reads/writes `workout-log.json`
(GET/POST/DELETE) and `lib/log.ts` is the client-side wrapper the UI calls.
The passcode/unlock state (`lib/auth.ts`) is unrelated app-lock state and
still lives in `localStorage`, since it's device-local by design.

The Blob store connected to this project uses Vercel's newer OIDC-based auth
(no long-lived `BLOB_READ_WRITE_TOKEN`) — auth happens via `BLOB_STORE_ID` +
a short-lived `VERCEL_OIDC_TOKEN` that Vercel injects into serverless
functions automatically. For that to work in **production**, enable
"System Environment Variables" for the project (Settings → Environment
Variables). For **local dev**, run:

```bash
vercel link              # once, to connect this folder to the Vercel project
vercel env pull .env.local
```

which pulls down `BLOB_STORE_ID` and a temporary `VERCEL_OIDC_TOKEN` (valid
~12h — re-run `vercel env pull` if local requests start failing with an
auth error).

## Where the 3D assets come from

**Nowhere — there are no downloaded assets.** Every model in the scene is
generated procedurally at runtime from three.js primitive geometry, which is
what gives the app its low-poly, flat-shaded look and keeps the bundle free
of `.glb`/`.gltf` files entirely:

| Thing | Made of |
|---|---|
| Pine tree | 1 tapered cylinder (trunk) + 3 stacked cones |
| Oak tree | 1 cylinder + 2–3 icosahedron "blobs" of foliage |
| Birch | 1 thin pale cylinder + 2 small blobs |
| Bush | 1–2 ground-level blobs, sometimes a tiny berry sphere |
| Flower | Thin cylinder stem + colored sphere head + leaf blob |
| Mushroom | Stubby cylinder + squashed cone cap |
| Rock | 1–2 flattened icosahedrons |
| Island | Cylinder with rim vertices wobbled by sine noise, plus a soil skirt and a big water disc |
| Clouds | Groups of 3 low-segment spheres drifting in circles |
| Fireflies | A single `THREE.Points` cloud with additive blending |
| Sky | A giant inverted sphere with a custom gradient fragment shader |

All of the plant recipes live in `components/garden/ForestInstances.tsx`
(`partsForPlant()`), and each part gets slight per-plant color/size/rotation
jitter from a seeded RNG so no two trees look identical.

## How the island renders (4 draw calls)

Every plant is assembled from only four primitive shapes: **cylinder, cone,
icosahedron, and sphere**. Instead of creating a mesh per part (a big forest
would mean thousands of draw calls), the whole forest is rendered as four
`THREE.InstancedMesh`es — one per primitive — with per-instance transform
matrices and colors. A 1,000-plant forest is still just 4 draw calls, so the
scene stays smooth on a phone.

The forest itself is **deterministic**: `lib/forest.ts` turns the workout log
into plants using an RNG seeded by each workout's id. Plant *n* is placed on
a golden-angle (sunflower) spiral — `r = spacing·√n`, `θ = n·2.39996…` — with
seeded jitter, so the island fills evenly from the center outward and the
exact same history always regrows the exact same forest on every page load.
The island's radius grows with `√(plantCount)`, and the camera distance
follows it, so the world gets bigger as the forest does.

Scene dressing: one shadow-casting directional "sun" + hemisphere light,
warm fog matched to the horizon color, ACES tone mapping (R3F default), and
a gradient sky dome shader (peach horizon → soft blue zenith).

## How the animations work

**Growth animation.** `components/garden/growth.ts` defines a shared timeline.
When a workout is logged (or ▶ replay is pressed), a `GrowthAnim` records:
the first plant index to animate, a start timestamp (`performance.now()`),
and a per-plant stagger. Each plant *i* pops in at `t0 + (i − fromIndex) ·
stagger`, scaling from 0 → 1 over 0.75s with an **ease-out-back** curve (it
overshoots ~1.1× then settles, which is the springy "plop"). The stagger
auto-compresses for big batches so a full-forest replay never takes much more
than ~8 seconds. Every frame, `ForestInstances` recomputes the instance
matrices of any plant whose growth value changed; once the animation ends it
stops writing matrices entirely.

**The minute counter.** The big number that ticks up during growth is plain
DOM, not 3D 
— but it reads the *same* `GrowthAnim` timeline and the same
`performance.now()` clock via `requestAnimationFrame`, so the count and the
planting stay perfectly in sync.

**Camera.** There are no user controls. A tiny rig (`CameraRig`) advances an
angle every frame (~one full orbit per two minutes, slightly faster during
growth animations) and orbits the island center, while lerping its distance
and height toward targets derived from the island radius — so when the
forest grows, the camera smoothly pulls back.

**Ambient motion.** Clouds advance along circular paths, the firefly point
cloud slowly rotates while its opacity breathes on a sine wave, and UI
overlays use small CSS keyframe animations (`fade-in`, `rise`, keypad
`shake`).

## Project map

```
app/
  layout.tsx              fonts, PWA metadata, theme colors
  manifest.ts             web app manifest (installable PWA)
  page.tsx                client-only dynamic import of the app
  api/youtube-search/     YouTube search (unchanged original logic)
components/
  GardenApp.tsx           state: log, lock, overlays, growth timeline
  garden/
    ForestScene.tsx       canvas, sky, island, clouds, lights, camera
    ForestInstances.tsx   plant recipes + instanced rendering
    growth.ts             shared animation timeline math
  ui/                     lock screen, workout/journal/settings/install overlays
lib/
  forest.ts               workout log → deterministic plant layout
  log.ts                  client wrapper around /api/workouts
  auth.ts                 passcode + 3-day unlock + attempt cooldown (localStorage)
  installPrompt.ts        beforeinstallprompt capture / iOS detection
services/
  youtubeService.ts       client wrapper for the search API
```

The workout log lives in Vercel Blob (one JSON file, no database); the
passcode lock is the only thing left in localStorage (`zlf-*` keys) — no
accounts, no auth service, one very loved user. 💚
