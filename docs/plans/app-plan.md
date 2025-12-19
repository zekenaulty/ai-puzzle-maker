## AI Jigsaw Puzzle Maker (React + Cloudflare Pages/Workers + Gemini) — Full Spec

### 0) Non-negotiables (your requirements, baked in)

* **React (web) only**: Desktop + mobile browsers. No React Native.
* **All puzzle/gameplay is fully client-side** (rendering, physics-ish snapping, piece generation, state).
* **AI operations only via Cloudflare Workers** (API key never ships to the browser).
* **Material UI (MUI)** as the base UI kit (Emotion default). ([MUI][1])
* **State persistence**: *everything* in **IndexedDB** (generated images + uploaded images + puzzle definitions + progress + settings).
* **Only the advanced piece generator** (no “simple grid cuts”). Pieces must truly interlock and look like premium physical puzzles.
* **Cloudflare storage keys** must be prefixed with: `ai-puzzle-maker` (KV/R2/Durable Object keys, etc.).

---

# 1) Tech stack + languages (explicit)

### Frontend (Cloudflare Pages)

* **Language**: TypeScript
* **Framework**: React 18
* **Build tool**: Vite
* **UI**: Material UI (MUI) + Emotion (default) ([MUI][1])
* **Routing**: React Router
* **State**: Zustand (or Redux Toolkit—Zustand preferred for small slice stores)
* **Persistence**: `idb` (light) or Dexie (more ergonomic)
* **Rendering**: `<canvas>` 2D + OffscreenCanvas pre-rendering (and optional Web Worker for generation)
* **Input**: Pointer Events (single unified model for mouse/touch/pen) ([MDN Web Docs][2])
* **Testing**: Vitest + Playwright (mobile viewport suites)

### Backend (Cloudflare Workers)

You can implement this in **either**:

* **A) Pages Functions** (`/functions/api/*`) — simplest: one Pages project deploy handles both site + API.
* **B) Separate Worker** (`wrangler deploy`) — if you want API independently versioned.

**Language**: TypeScript (Workers runtime)

### AI Provider (Google Gemini API)

* **Text model for prompt-building**: `gemini-2.5-flash`
* **Image model (Nano Banana)**: `gemini-2.5-flash-image` (and optionally `gemini-3-pro-image-preview` as a “HQ” toggle)
* **REST endpoint format**:

  * `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  * Auth via `x-goog-api-key` header (recommended). ([Google AI for Developers][3])
* **Gemini native image generation supports aspect ratios** and `imageConfig.aspectRatio` control. ([Google AI for Developers][3])
* **Structured Outputs**: we will force the prompt-builder to return JSON via schema. ([Google AI for Developers][4])

---

# 2) Repo/workspace structure (agent-ready)

```
ai-jigsaw-puzzle-maker/
  apps/
    web/                         # Cloudflare Pages React app
      index.html
      public/
      src/
        app/
          App.tsx
          routes.tsx
          theme.ts
          providers/
            QueryProvider.tsx
            SnackbarProvider.tsx
            ErrorBoundary.tsx
          layout/
            Shell.tsx
            AppTopBar.tsx
            AppDrawer.tsx
        pages/
          HomePage/
          CreatePuzzlePage/
          LibraryPage/
          PuzzlePlayPage/
          SettingsPage/
          AboutPage/
        components/
          common/                # small MUI wrappers
          create/
          library/
          puzzle/
            PuzzleCanvas/
              PuzzleCanvas.tsx
              usePuzzleRenderer.ts
              usePointerControls.ts
              viewTransform.ts
            PieceControls/
              PieceControls.tsx
              RotationControls.tsx
              ZoomPanControls.tsx
            Tray/
            Minimap/
            ProgressHUD/
        engine/
          model/
            puzzleTypes.ts
            idSchemas.ts
          generation/
            seed.ts
            edgeField.ts
            pieceTopology.ts
            piecePath.ts
            rasterizePieces.ts
          runtime/
            spatialIndex.ts
            unionFind.ts
            snapping.ts
            selection.ts
            persistence.ts
        storage/
          db.ts                  # IndexedDB open/migrations
          puzzlesRepo.ts
          imagesRepo.ts
          settingsRepo.ts
        ai/
          apiClient.ts           # calls /api/*
          promptTemplates.ts
          styleTaxonomy.ts
        utils/
      vite.config.ts             # proxy /api -> local worker
      package.json
      tsconfig.json

  workers/
    api/                         # Cloudflare Worker (or Pages Functions equivalent)
      src/
        index.ts                 # router
        routes/
          health.ts
          promptCompose.ts
          imageGenerate.ts
          modelsList.ts
        gemini/
          geminiClient.ts
          contracts.ts
          safety.ts
      wrangler.jsonc
      package.json
      tsconfig.json

  .editorconfig
  .eslintrc.cjs
  .prettierrc
  README.md
```

**Rule:** every React component is *small*, single responsibility, no engine logic inside components. Engine code lives in `/engine/*` and is consumed via hooks.

---

# 3) Cloudflare configuration + “ai-puzzle-maker” key prefix

### 3.1 Secrets / env vars

Cloudflare secret *names* cannot contain hyphens cleanly across tooling, so use env var names like:

* `AI_PUZZLE_MAKER__GEMINI_API_KEY`
* `AI_PUZZLE_MAKER__GEMINI_BASE_URL` (optional override; default `https://generativelanguage.googleapis.com`)

Store them with Wrangler secrets. ([Cloudflare Docs][5])

### 3.2 KV / R2 / Durable Objects key naming (must be prefixed)

Even if most data is IndexedDB-only, you’ll likely want **rate limiting** and optional **share links**.

* **KV keys**

  * `ai-puzzle-maker:ratelimit:ip:{hashedIp}`
  * `ai-puzzle-maker:share:{shareId}`

* **R2 object keys**

  * `ai-puzzle-maker/shared/{shareId}.json`
  * `ai-puzzle-maker/shared/{shareId}.webp`

* **Durable Object IDs / names**

  * DO name prefix: `ai-puzzle-maker-rate`
  * DO storage keys inside: `ai-puzzle-maker:counter:{...}`

---

# 4) AI flow: two-stage generation (your new requirement)

## 4.1 UX: “Create Puzzle” has two prompt paths

1. **Default (two-stage)**
   User selects:

   * **Base image type** (template, e.g., “Coastal lighthouse at sunset”)
   * **Style tags (multi-select)** (e.g., “watercolor”, “paper texture”, “soft lighting”)
   * Optional: subject modifiers (season, mood, palette)
     Then:
   * Stage A: `gemini-2.5-flash` composes a **final image prompt** JSON (structured output)
   * Stage B: that prompt is sent to `gemini-2.5-flash-image` to generate the image

2. **User-defined prompt (single-stage)**

   * User writes prompt directly
   * We still append **safety + “no copyright” guardrails** and optionally inject chosen style tags (toggle)

## 4.2 Why structured output here

We want the Stage A model to return:

* `finalPrompt` (string)
* `negativeConstraints` (string array)
* `title` (short)
* `altText` (accessibility)
* `seedHint` (optional deterministic hint, not guaranteed)

Gemini supports schema-based structured outputs. ([Google AI for Developers][4])

---

# 5) Gemini API contracts + real endpoint examples (agent-safe)

## 5.1 Worker → Gemini REST: Generate Content (text)

**Endpoint pattern** (Gemini API):

* `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
* Use `x-goog-api-key` header. ([Google AI for Developers][3])

### Stage A: Prompt composer request (Worker → Gemini 2.5 Flash)

**Model**: `gemini-2.5-flash`

**Request body (REST)**

```json
{
  "system_instruction": {
    "parts": {
      "text": "You are a prompt composer for a jigsaw puzzle image generator..."
    }
  },
  "contents": [{
    "role": "user",
    "parts": [{
      "text": "Base template: Cozy autumn street market at dusk...\nStyle tags: watercolor, ink outline, paper texture...\nConstraints: no logos, no copyrighted characters..."
    }]
  }],
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "finalPrompt": { "type": "string" },
        "negativeConstraints": { "type": "array", "items": { "type": "string" } },
        "altText": { "type": "string" }
      },
      "required": ["finalPrompt", "altText"]
    }
  }
}
```

(Structured outputs are supported as a first-class feature. ([Google AI for Developers][4]))

## 5.2 Worker → Gemini REST: Native image generation (Nano Banana)

**Model**: `gemini-2.5-flash-image`

**Endpoint example shown in Google’s image generation docs:**
`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent` ([Google AI for Developers][3])

**Request body**

```json
{
  "contents": [{
    "role": "user",
    "parts": [{ "text": "FINAL_IMAGE_PROMPT_HERE" }]
  }],
  "generationConfig": {
    "imageConfig": { "aspectRatio": "1:1" }
  }
}
```

Gemini image generation supports `generationConfig.imageConfig.aspectRatio` and lists supported ratios (including 1:1, 16:9, 9:16, etc.). ([Google AI for Developers][3])

**Response parsing rule**
Gemini image responses come back as `candidates[0].content.parts[]` where an image is typically in `inlineData.data` (base64). The official examples show iterating parts and extracting `inlineData`. ([Google AI for Developers][3])

---

# 6) Worker API surface (what the React app calls)

All endpoints live under `/api/*` (Pages Functions) or `https://api.<domain>/*` (separate Worker).

## 6.1 `POST /api/prompt/compose`

Stage A (defaults): produce JSON prompt package.

**Request**

```ts
type PromptComposeRequest = {
  baseTemplateId: string;            // e.g. "scenery.coast.lighthouse.sunset"
  styleTags: string[];               // multi-select taxonomy
  moodTags?: string[];               // optional
  paletteTags?: string[];            // optional
  extraDetails?: string;             // optional free text
  aspectRatio: "1:1" | "4:3" | "16:9" | "9:16" | "3:2" | "2:3";
};
```

**Response**

```ts
type PromptComposeResponse = {
  title: string;
  finalPrompt: string;
  negativeConstraints: string[];
  altText: string;
  model: "gemini-2.5-flash";
};
```

**Worker behavior**

* Validates tag IDs against server-known taxonomy (prevents prompt injection via “tags”).
* Builds a strong system instruction:

  * forbid copyrighted characters/logos/trademarks
  * forbid “in the style of [living artist]”
  * require “original scene, no recognizable IP”
* Calls Gemini with **structured output**.

## 6.2 `POST /api/image/generate`

Stage B: generate image from either:

* `finalPrompt` (from Stage A), or
* `userPrompt` (direct)

**Request**

```ts
type ImageGenerateRequest =
  | {
      kind: "default";
      finalPrompt: string;
      negativeConstraints: string[];
      aspectRatio: PromptComposeRequest["aspectRatio"];
      imageModel: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";
    }
  | {
      kind: "user";
      userPrompt: string;
      styleTags?: string[]; // optional append; toggle from UI
      aspectRatio: PromptComposeRequest["aspectRatio"];
      imageModel: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";
    };
```

**Response**

```ts
type ImageGenerateResponse = {
  imageMimeType: "image/png";
  imageBase64: string;        // raw image bytes, base64
  width: number;
  height: number;
  promptUsed: string;         // after guardrails appended
  model: string;
};
```

**Important:** keep response small. If you want to be extra production-grade, return a short-lived signed URL (R2) instead of base64. But your requirement is IndexedDB storage anyway, so base64 → Blob client-side is acceptable for 1024px outputs.

## 6.3 `GET /api/models`

Returns server-approved model IDs (prevents client from selecting random models).

---

# 7) Art templates + style system (copyright-safe, puzzle-popular)

## 7.1 Base templates (scene “what”)

All are generic, no IP:

* Nature: alpine lake sunrise, misty pine forest, desert dunes, tropical reef, waterfall canyon
* Travel postcards: old town streets, mountain village, coastal lighthouse, harbor boats, hot air balloons
* Animals: fox in snow, owl on branch, koi pond, horses at dawn, butterflies in meadow
* Still life: fruit bowl on linen, tea set by window, autumn leaves, flowers in vase
* Abstract: geometric gradients, stained-glass symmetry, swirling inks, mosaic tessellations, fractals, sacred geometry
* Seasonal: cherry blossoms, Halloween pumpkins, winter cabin lights, spring rain cityscape
* Wholesome fantasy (non-IP): cozy wizard study, floating lantern festival, enchanted library, sky islands, castles

## 7.2 Style taxonomy (multi-select “how it looks”)

You wanted a “secondary artistic style selector” that covers most styles and can blend. So we treat styles as **tags** in groups:

**Medium / Technique**

* watercolor wash
* gouache poster paint
* oil painting impasto
* colored pencil illustration
* ink linework
* charcoal sketch
* pastel chalk
* paper cut collage
* stained glass mosaic
* low-poly 3D render
* claymation look
* pixel art
* vector flat design
* linocut print texture
* Japanese woodblock print look (generic, no specific artist)
* Art Nouveau ornamental poster look (generic)

**Surface / Material**

* cold-press paper texture
* canvas weave
* parchment
* glossy enamel
* ceramic tile
* weathered wood
* metallic foil accents (subtle)

**Lighting / Mood**

* golden hour glow
* soft overcast
* neon night rain
* candlelit warmth
* dreamy haze
* crisp high-contrast

**Composition / Camera**

* wide cinematic
* macro close-up
* top-down flat lay
* centered symmetry
* rule-of-thirds

**Palette**

* pastel spring
* autumn earth tones
* teal/orange cinematic
* monochrome ink
* jewel tones

### Blending rule

The prompt composer is instructed to:

* pick **1–2 primary styles** from Medium/Technique,
* treat the rest as modifiers,
* keep the result coherent (avoid “everything everywhere”).

---

# 8) IndexedDB: everything stored (schema + strategy)

## 8.1 Database

Name: `ai-puzzle-maker-db`
Versioned migrations.

### Object stores

1. `images`

* key: `imageId` (uuid)
* value:

  * `createdAt`
  * `source`: `"generated" | "uploaded"`
  * `mime`
  * `blob` (original)
  * `width`, `height`
  * `previewBlob` (small webp/png)
  * `promptMeta` (model, promptUsed, styleTags, etc.)

2. `puzzles`

* key: `puzzleId`
* value:

  * `imageId`
  * `seed` (uint32)
  * `pieceCount`
  * `generatorVersion` (string)
  * `board`: canonical dimensions + padding
  * `edges`: compact edge params (see §9)
  * `createdAt`

3. `progress`

* key: `puzzleId`
* value:

  * `pieces`: packed typed-array style data or compressed JSON:

    * `x,y,rot,z,placed,clusterId`
  * `clusters`: union-find parent array or adjacency edges
  * `view`: zoom/pan transform
  * `lastSavedAt`
  * `completedAt?`

4. `settings`

* key: fixed `"global"`
* value:

  * snapping tolerance
  * rotation enabled
  * rotation step
  * background guide opacity
  * preferred aspect ratio
  * default piece count
  * accessibility options

## 8.2 Persistence policy

* Engine writes to in-memory store continuously.
* Persist to IndexedDB using:

  * **debounced saves** (e.g., every 750ms after last change),
  * plus **hard checkpoint** every ~10 seconds while interacting,
  * immediate save on `visibilitychange` / `pagehide`.

---

# 9) Advanced jigsaw piece generation (best-in-class, interlocking guaranteed)

This is the heart. The key to “pieces truly fit” is: **every shared edge is generated once, then mirrored**.

## 9.1 Puzzle coordinate system

* Work in **image-space** coordinates:

  * canonical image width `W`, height `H` (typically 1024px from Nano Banana)
* Define a logical grid:

  * choose `cols, rows` such that `cols * rows ≈ pieceCount`
  * keep aspect ratio: `cols/rows ≈ W/H`
* Each cell boundary is **not straight**; it becomes a *shared seam curve*.

## 9.2 Edge field (shared seam generation)

For every internal border:

* vertical seams: between cell (c,r) and (c+1,r)
* horizontal seams: between cell (c,r) and (c,r+1)

Generate a seam as a parametric curve `S(t)` for `t ∈ [0,1]`.

### Edge representation (compact + deterministic)

Store per seam:

```ts
type Seam = {
  id: number;
  aCell: number;        // index
  bCell: number;        // neighbor index
  orientation: "V"|"H";
  // control points in normalized cell-space:
  // base line from P0 to P3, with a "tab" bulge in the middle.
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  tab: {
    centerT: number;      // where the knob sits, usually ~0.5 with jitter
    amplitude: number;    // knob depth relative to cell size
    width: number;        // knob width relative to seam length
    shape: "bezier";      // future-proof
    sign: 1 | -1;         // + = tab for aCell, - = blank for aCell (bCell is opposite)
  };
  jitter: number;         // subtle waviness (0..1)
};
```

**Determinism:** all random values come from `seed` via a reproducible PRNG.
This lets you store *only seed + generatorVersion* if you want, but I recommend storing seams explicitly for forward compatibility.

## 9.3 Complement guarantee (the “true fit” rule)

For a seam between two pieces:

* Piece A uses seam with `sign = +1`
* Piece B uses the exact same seam but **mirrored normal** (`sign = -1`)

Meaning: the knob on one side becomes the matching socket on the other, with identical curve geometry.

## 9.4 Border edges

Physical puzzles usually have:

* straight outer edges (flat)
* optional subtle paper rounding

So for outer boundary seams:

* use a straight line (or very mild noise that still yields a flat-ish edge)
* no tab/blank.

## 9.5 Piece polygon / path assembly

Each piece has 4 edges in order (top, right, bottom, left).

* Top edge: seam curve from top-left → top-right
* Right: top-right → bottom-right
* Bottom: bottom-right → bottom-left
* Left: bottom-left → top-left

Generate an **SVG path** string (or Path2D) for clipping.

### Quality details (this is where “top notch” shows up)

* Use oversampling when rasterizing masks (e.g., 2x) then downsample for anti-alias edges.
* Add **stroke** around piece (subtle dark outline) + inner highlight to mimic cardboard thickness.
* Add **drop shadow** while dragging (lift effect), reduced when placed.
* Add slight **edge darkening** near perimeter (very subtle) to look physical.

## 9.6 Rasterization pipeline (performance + fidelity)

Precompute each piece into a bitmap once:

* Create OffscreenCanvas `pieceCanvas` sized to the piece bounding box + padding
* Clip to piece Path2D
* Draw source image offset so the correct pixels show through
* Apply:

  * edge stroke
  * shadow baked into alpha (or drawn at render-time)
* Export ImageBitmap for fast draw.

For mobile memory safety:

* Use WebP previews + keep piece bitmaps in an LRU cache (only keep N most recently used clusters fully decoded).

---

# 10) Gameplay engine (controls, snapping, rotation, mobile/desktop)

## 10.1 Rendering approach

* One full-screen `<canvas>` in `PuzzleCanvas`
* React state updates do **not** re-render the board each frame; the engine draws via `requestAnimationFrame`.
* Engine holds:

  * `pieces[]` transforms
  * `clusters` union-find
  * spatial index
  * view transform matrix

## 10.2 Input model (Pointer Events)

Use Pointer Events so mouse/touch/pen share the same code path. ([MDN Web Docs][2])

### Selection rules (your requirement)

* **Only one piece/cluster selected at a time**
* Tap/click selects topmost under pointer
* Selected piece gets:

  * outline glow
  * control overlay (rotation buttons etc.)
* Drag moves the *entire cluster*.

### Desktop controls

* Drag: mouse
* Rotate: on-screen buttons or keyboard:

  * `[` rotate left, `]` rotate right
* Zoom:

  * Ctrl+wheel (or trackpad pinch)
  * plus UI buttons for accessibility

### Mobile controls

* Drag: one finger
* Pan/zoom:

  * two-finger gesture **only for camera**
  * plus UI buttons (Zoom +/−, Recenter)
* **Rotation is never gesture-based**

  * show a bottom sheet “Piece Controls” with:

    * Rotate ⟲ / ⟳ (step = 90° by default)
    * Optional fine rotation slider if enabled

## 10.3 View transform (zoom/pan)

Maintain:

* `view.scale`
* `view.tx`, `view.ty`
  Convert pointer coords:
* screen → world = inverse(viewMatrix) * screenPoint

Clamp panning so the puzzle doesn’t get lost; include “Recenter” button.

## 10.4 Snapping (the “feels amazing” part)

Snapping should not check against all pieces.

### Spatial index

Use a uniform grid hashing:

* cell size ~ average piece size * 1.25
* each piece/cluster registers its AABB
* when dragging cluster, query only nearby cells

### Candidate snap checks

When moving a cluster, for each piece in the cluster:

* look at its 4 neighbors by topology (edge metadata tells who can connect)
* if neighbor piece is not in same cluster:

  * compute expected relative transform if connected
  * measure:

    * translation error (pixels in world space)
    * rotation error (degrees)
  * if below threshold → snap

### Thresholds

* Translation tolerance: default ~ `min(pieceWidth, pieceHeight) * 0.08` scaled by zoom
  (your earlier ±5px is too tight for mobile; we make it adaptive.)
* Rotation tolerance:

  * if rotation mode is 90° steps: tolerance ~ 10–15°
  * if fine rotation enabled: tolerance ~ 4–6°

### Snap resolution

When snap triggers:

* set cluster transform so the active piece aligns perfectly
* merge clusters in union-find
* update progress count

### Prevent “false snaps”

Require:

* at least one matching seam id AND correct orientation
* AND the two piece images’ seam bounding boxes overlap plausibly

---

# 11) UI (MUI), pages, and “small components” discipline

## 11.1 Pages

* **Home**: Resume last puzzle, quick “Create”
* **Create Puzzle**:

  * Template picker (cards)
  * Style multi-select (chips, grouped)
  * Aspect ratio selector (shows supported ratios) ([Google AI for Developers][3])
  * Piece count selector
  * “User prompt” toggle panel
  * Generate button (runs 2-stage unless user prompt)
* **Library**:

  * Images grid (generated + uploaded)
  * Puzzles grid (with progress ring)
* **Puzzle Play**:

  * Fullscreen canvas
  * Left/right drawers depending on breakpoint
  * Bottom sheet controls on mobile
* **Settings**

## 11.2 Key UI components (all small)

* `TemplatePicker` (display only)
* `StyleMultiSelect` (display + selection only)
* `PromptEditor` (controlled text input only)
* `GenerateButton` (calls `ai/apiClient.ts`)
* `PuzzleCanvas` (mounts engine; no UI inside)
* `PieceControls` (pure UI; calls engine commands)
* `ZoomPanControls`
* `ProgressHUD`
* `Tray` (optional; shows unplaced pieces thumbnails)

---

# 12) Local dev + deployment (console/CLI), no guesswork

## 12.1 Wrangler config format

Cloudflare recommends `wrangler.jsonc` for new projects. ([Cloudflare Docs][6])

## 12.2 Local dev (two terminals)

### Terminal A: Worker API

```bash
cd workers/api
npm i
npx wrangler dev
```

### Terminal B: React app

```bash
cd apps/web
npm i
npm run dev
```

Vite proxy `/api` → `http://127.0.0.1:8787` (wrangler dev default).

## 12.3 Secrets (Cloudflare)

```bash
cd workers/api
npx wrangler secret put AI_PUZZLE_MAKER__GEMINI_API_KEY
```

Wrangler secrets workflow documented here. ([Cloudflare Docs][5])

## 12.4 Deploy

### Option A (recommended): Cloudflare Pages + Pages Functions

* Put worker routes into `apps/web/functions/api/*`
* Deploy Pages via Wrangler direct upload. ([Cloudflare Docs][7])

### Option B: Separate Worker + Pages

Deploy Worker:

```bash
cd workers/api
npx wrangler deploy
```

Deploy Pages:

```bash
cd apps/web
npm run build
npx wrangler pages deploy dist
```

(Direct Upload is a supported Pages deployment path.) ([Cloudflare Docs][7])

---

# 13) Extra production-grade details (edge cases handled)

### Mobile Safari / memory limits

* Default to `gemini-2.5-flash-image` 1024px output (fast + manageable)
* Avoid storing hundreds of decoded ImageBitmaps at once:

  * store masks + transforms + original image in IDB
  * regenerate bitmaps on load, cache LRU

### Orientation changes

* Save view transform on resize
* Recompute screen-space UI only; world-space puzzle remains stable

### Prevent off-screen drops

* Clamp dragged cluster center inside a padded viewport rectangle
* If user drags near edge, optionally auto-pan camera

### Corruption recovery

* Every puzzle has `generatorVersion`
* If generator changes, keep old puzzles playable by honoring stored seam data
* If progress record fails to parse, fall back to “scatter pieces” deterministic layout

### Safety / copyright guardrails

* Prompt composer always includes:

  * “no recognizable copyrighted characters, brands, logos”
  * “no text overlays unless explicitly requested”
* Imagen docs note SynthID watermark for generated images (if you later add Imagen as alternative). ([Google AI for Developers][8])

---

[1]: https://mui.com/material-ui/getting-started/installation/?utm_source=chatgpt.com "Installation - Material UI"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events?utm_source=chatgpt.com "Pointer events - Web APIs | MDN"
[3]: https://ai.google.dev/gemini-api/docs/image-generation "Image generation with Gemini (aka Nano Banana & Nano Banana Pro)  |  Gemini API  |  Google AI for Developers"
[4]: https://ai.google.dev/gemini-api/docs/structured-output "Structured Outputs  |  Gemini API  |  Google AI for Developers"
[5]: https://developers.cloudflare.com/workers/configuration/secrets/?utm_source=chatgpt.com "Secrets - Workers"
[6]: https://developers.cloudflare.com/workers/wrangler/configuration/?utm_source=chatgpt.com "Configuration - Wrangler · Cloudflare Workers docs"
[7]: https://developers.cloudflare.com/pages/get-started/direct-upload/?utm_source=chatgpt.com "Direct Upload · Cloudflare Pages docs"
[8]: https://ai.google.dev/gemini-api/docs/imagen?utm_source=chatgpt.com "Generate images using Imagen | Gemini API"
