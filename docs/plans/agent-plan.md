# Agent Plan: AI Jigsaw Puzzle Maker

This is the execution plan I will follow when you say "continue". It is story-driven (one story per turn whenever possible) and updated at the end of every turn.

## Operating rules
- One story per turn is the goal. If a story cannot finish in one turn, keep it active, mark it Blocked, and continue it next turn.
- After each turn, update this file with:
  - Active story
  - Story status
  - Turn log entry
  - Any scope changes or new risks
- Do not start a new story until the current story is Done or explicitly deferred.

## Progress tracker
Active story: S24 (In Progress)
Last updated: 2025-12-18

Turn log:
- T000: Plan created. No code changes yet.
- T001: Completed S01. Scaffolded repo structure and baseline configs for web and worker.
- T002: Completed S02. Added worker router, JSON helpers, and /api/health route.
- T003: Completed S03. Added Gemini client utilities and shared contracts.
- T004: Completed S04. Implemented prompt composition route with taxonomy validation.
- T005: Completed S05. Implemented image generation route with guardrails and response parsing.
- T006: Completed S06. Added models list route for approved model IDs.
- T007: Completed S07. Added IndexedDB schema and repository modules.
- T008: Completed S08. Added puzzle types and deterministic seeded RNG.
- T009: Completed S09. Added edge field generation and piece topology mapping.
- T010: Completed S10. Added piece path generation and rasterization pipeline.
- T011: Completed S11. Added renderer loop, view transforms, and bitmap LRU cache.
- T012: Completed S12. Added selection, spatial index, snapping, and union-find utilities.
- T013: Completed S13. Added pointer controls and camera pan/zoom handlers.
- T014: Completed S14. Added MUI theme, app shell, top bar, and drawer layout.
- T015: Completed S15. Built Create Puzzle UI with template, style, and prompt controls.
- T016: Completed S16. Wired AI generation to API client and IndexedDB storage with preview.
- T017: Completed S17. Built Library page with images, puzzles, and resume UX.
- T018: Completed S18. Implemented Puzzle Play page with canvas, controls, and engine wiring.
- T019: Completed S19. Added Settings page, persisted settings defaults, and wired settings into Create and Play.
- T020: Completed S20. Added progress persistence scheduler with debounced saves, checkpoints, and resume loading.
- T021: Completed S21. Added keyboard rotation shortcuts, ARIA labels, and generated alt text for images.
- T022: Completed S22. Added automated tests (Vitest + Playwright smokes) and documented commands.
- T023: Completed S23. Added deployment-ready docs for Pages + Worker, env vars, and build commands.
- T024: Started S24 polish. Moved puzzle HUD/controls off the board, constrained scatter/drag to board bounds, reduced out-of-bounds scatter, and removed the duplicate Create button on Library.
- T025: Continued S24. Enlarged workspace padding to use the whole play area, squared the play container edges to prevent clipping, and recentered the initial view when container size is known.
- T026: Continued S24. Padding now scales to the visible play container so pieces can move across the full parent area (eliminating dead space).
- T027: Continued S24. Fixed shared seam orientation and endpoint drift so piece edges align pixel-perfectly; reduced wave at corners.

Status keys: Planned | In Progress | Blocked | Done

## Definition of Done (product)
- Web app runs on desktop and mobile, using React 18 + Vite + MUI.
- All puzzle gameplay and rendering are fully client-side.
- AI calls only happen via Cloudflare Workers/Pages Functions.
- IndexedDB persists images, puzzles, progress, and settings.
- Advanced interlocking piece generator with deterministic seams.
- API routes implemented and validated: /api/prompt/compose, /api/image/generate, /api/models, /api/health.
- Minimal but complete test coverage (unit + Playwright smoke).
- Deployment instructions and configs present (wrangler, env vars, build scripts).

## Stories (ordered, one per turn)

S01 [Done] As a developer, I want to audit the repo and align the workspace structure with the spec so that the rest of the work lands cleanly.
Acceptance criteria:
- Confirm or create apps/web and workers/api structure.
- Tooling and configs present: Vite, TS, ESLint/Prettier, tsconfig, wrangler.jsonc.
- No destructive changes to existing work.
Tasks:
- Inspect current tree and reconcile with spec.
- Add or adjust minimal configs and folders.

S02 [Done] As a developer, I want a Worker skeleton with typed routing so that API routes are ready for implementation.
Acceptance criteria:
- Worker entrypoint with router and JSON error handling.
- /api/health route returns ok.
- Local dev wiring matches Vite proxy plan.
Tasks:
- Create worker router, request/response helpers, and health route.

S03 [Done] As a developer, I want Gemini client utilities and contracts so that API calls are consistent and testable.
Acceptance criteria:
- Gemini client with base URL + API key from env.
- Contracts and shared types defined.
Tasks:
- Add gemini client module, types, and error normalization.

S04 [Done] As a user, I want prompt composition via structured output so that I get reliable image prompts.
Acceptance criteria:
- /api/prompt/compose validates inputs.
- Uses gemini-2.5-flash with schema-based JSON output.
- Server validates style tags against taxonomy.
Tasks:
- Implement prompt composer route.
- Add style taxonomy data on server.

S05 [Done] As a user, I want AI image generation so that I can create puzzle images safely.
Acceptance criteria:
- /api/image/generate supports "default" and "user" flows.
- Guardrails appended to user prompts.
- Response includes base64 image + metadata.
Tasks:
- Implement image generate route and parsing of inlineData.

S06 [Done] As a user, I want a list of approved models so that the UI cannot select unsupported ones.
Acceptance criteria:
- /api/models returns allowed model IDs.
Tasks:
- Implement models list route.

S07 [Done] As a developer, I want IndexedDB stores and repos so that all data persists locally.
Acceptance criteria:
- IndexedDB schema with images, puzzles, progress, settings.
- Repository modules for CRUD.
Tasks:
- Implement db.ts and repo modules with idb or Dexie.

S08 [Done] As a developer, I want deterministic PRNG and puzzle data types so that puzzle generation is stable.
Acceptance criteria:
- PRNG seeded per puzzle.
- puzzleTypes and schemas defined.
Tasks:
- Add model types and seed utilities.

S09 [Done] As a user, I want advanced interlocking piece seams so that pieces fit like a real puzzle.
Acceptance criteria:
- Edge field generation for internal seams.
- Seam mirroring guarantees complement fits.
- Flat outer borders.
Tasks:
- Implement edgeField and pieceTopology.

S10 [Done] As a user, I want piece paths and rasterized assets so that pieces look premium.
Acceptance criteria:
- Path2D or SVG path per piece.
- OffscreenCanvas rasterization with oversampling.
- Stroke, edge shading, and drag shadow logic.
Tasks:
- Implement piecePath and rasterizePieces pipeline.

S11 [Done] As a user, I want a performant rendering engine so that puzzles run smoothly.
Acceptance criteria:
- requestAnimationFrame rendering loop in PuzzleCanvas.
- LRU cache for piece bitmaps.
- View transform conversions implemented.
Tasks:
- Implement renderer hooks and viewTransform utilities.

S12 [Done] As a user, I want reliable selection and snapping so that solving feels satisfying.
Acceptance criteria:
- Single selection at a time.
- Spatial index for nearby checks only.
- Rotation and translation tolerances applied.
Tasks:
- Implement selection, snapping, union-find, spatial index.

S13 [Done] As a user, I want pointer-based controls so that desktop and mobile inputs behave correctly.
Acceptance criteria:
- Pointer Events for drag and select.
- Two-finger pan/zoom on mobile only.
- Rotation via UI controls, not gestures.
Tasks:
- Implement pointer controls and camera controls.

S14 [Done] As a user, I want MUI theming and app shell so that navigation feels consistent.
Acceptance criteria:
- Theme, layout shell, top bar, and drawer.
- Routes wired for all pages.
Tasks:
- Implement theme and base app layout.

S15 [Done] As a user, I want a Create Puzzle page so that I can generate images and puzzles.
Acceptance criteria:
- Template picker, style tags, aspect ratio, piece count.
- User prompt toggle.
- Generate button triggers AI flow.
Tasks:
- Build Create Puzzle page and components.

S16 [Done] As a user, I want image generation integrated with storage so that my creations persist.
Acceptance criteria:
- Calls /api/prompt/compose and /api/image/generate.
- Stores images in IndexedDB and shows previews.
Tasks:
- Implement ai/apiClient, integrate with Create flow and storage.

S17 [Done] As a user, I want a Library page so that I can browse images and puzzles.
Acceptance criteria:
- Images grid, puzzles grid, progress ring.
- Resume last puzzle.
Tasks:
- Implement Library page UI and data queries.

S18 [Done] As a user, I want the Puzzle Play page so that I can solve puzzles with controls.
Acceptance criteria:
- Fullscreen canvas and controls (zoom/pan/rotation).
- Mobile bottom sheet controls.
- Progress HUD and optional tray.
Tasks:
- Integrate engine into Puzzle Play page and UI controls.

S19 [Done] As a user, I want settings so that gameplay preferences persist.
Acceptance criteria:
- Settings page with rotation, snapping, accessibility, defaults.
- Persisted to IndexedDB.
Tasks:
- Implement Settings page and settings repo.

S20 [Done] As a user, I want resilient persistence so that progress is never lost.
Acceptance criteria:
- Debounced saves and periodic checkpoints.
- Save on visibilitychange/pagehide.
Tasks:
- Implement persistence scheduler in engine runtime.

S21 [Done] As a user, I want accessibility and keyboard support so that the app is usable for more people.
Acceptance criteria:
- Keyboard rotate shortcuts.
- ARIA labels on controls.
- Alt text generated for images.
Tasks:
- Add accessibility hooks and labels.

S22 [Done] As a developer, I want automated tests so that regressions are caught early.
Acceptance criteria:
- Unit tests for generator and snapping.
- Playwright smoke tests for key flows.
Tasks:
- Add Vitest and Playwright configs and initial tests.

S23 [Done] As a developer, I want deployment-ready docs and configs so that release is straightforward.
Acceptance criteria:
- README updated with complete app description, details, with dev and deploy steps.
- wrangler.jsonc and env var docs in place.
Tasks:
- Write docs and verify build scripts.

S24 [Planned] As a user, I want final polish and QA so that the app feels production-ready.
Acceptance criteria:
- Performance checks on mobile.
- Visual polish tweaks and bug fixes.
Tasks:
- Fix issues found during QA and optimize.

## Risk and decision log (update per turn)
- None yet.
