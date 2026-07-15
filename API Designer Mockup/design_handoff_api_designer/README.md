# Handoff: API Designer (APIforge)

## Overview
"APIforge" is an in-browser visual editor for authoring OpenAPI-style API specs: paths/methods, request & response schemas, headers, security schemes, tags, a governance-policy diagnostics view, and a live REST projection preview. This bundle is the interactive HTML prototype produced during design; the goal of this handoff is to reimplement it as a real, typed frontend application.

## About the Design Files
The files in this bundle (`API Designer.dc.html`, `api-policy.js`, `primitives.js`, `support.js`) are **design references built as an HTML/JS prototype** — they demonstrate the intended UI, state model, and interaction behavior. They are **not production code to copy as-is**. Your task is to **recreate this design in your target codebase's environment** (React + TypeScript is recommended given the component's structure, but adapt to whatever stack the target repo already uses) using that codebase's existing patterns, component library, and state-management conventions. If no environment exists yet, React + TypeScript + Vite is a reasonable default given how this prototype is structured (single component tree, local state, derived view-models).

`support.js` is prototype-runtime plumbing specific to this design tool (template binding, `sc-for`/`sc-if` directives, etc.) — **do not port it**. Treat `API Designer.dc.html` purely as a reference for markup structure, inline styles, and the `class Component` logic block (state + derived view-model functions), which is plain JavaScript and maps directly onto a React component's state + render logic.

## Fidelity
**High-fidelity.** Colors, spacing, typography, and copy in the HTML file are final — reproduce them pixel-for-pixel. Where a value is a CSS custom property (e.g. `var(--accent)`), the resolved value is defined in the `.app` and `.app[data-theme="light"]` blocks at the top of the `<style>` — carry both the dark (default) and light theme variants over as CSS variables or a theme object.

## Architecture Overview
Everything lives in one component tree today (a single `class Component` with a large `renderVals()`), organized into these major regions — split these into real components in the target codebase:

- **Topbar** — brand, undo/redo, import/export, share, compliance badge, diagnostics issue badge, theme toggle.
- **Sidebar** — path/tag tree navigator (collapsible), drag-to-reorder.
- **Canvas area**, tabbed via `canvasTab` state (`design | diagnostics | rest-projection`):
  - **Design (tree) view** — path-grouped method editor. Per method: summary/operationId, security row, tags row, then a two-column **Request** (params, headers, body) / **Response** (status-class pills, per-response headers, content-types, examples) layout.
  - **Schema editor** — object/array/scalar schema field editor with type pickers, ref pickers, primitive locking, validation constraints (pattern/min/max/length).
  - **Diagnostics tab** — governance policy compliance (`api-policy.js`) with severity-grouped issues.
  - **Live REST projection tab** — read-only generated preview.
- **Modals/overlays** (all currently absolutely-positioned `sc-if` blocks in the same file — should become real dialog components): Share/Library, Auth, Primitive Picker (two-column category browser sourced from `primitives.js`), Parameter/Field type picker (schema ref vs. primitive), Delete-path confirm, Tag cascade confirm, Bulk tag manager, Global security-scheme manager, Workspace settings.

## Key Behaviors to Preserve
- **Headers are always string-typed** — no type picker on header rows (recently simplified; don't reintroduce a type selector for headers).
- **Locked/mandated fields** — headers and responses that are mandated by `api-policy.js` (e.g. 401/403 on secured endpoints) render as locked/disabled with a policy tooltip, and cannot be removed or toggled optional.
- **Primitive vs. custom vs. ref fields** — schema fields and params have three kinds: `ref` (points to another schema, shown as a purple pill, opens the type picker), `primitive` (backed by a library primitive from `primitives.js`, locked, shown as `primitive · type`), and `custom` (free-typed, shown as a plain type tag). Once created, a field/param's kind is locked — delete and re-add to change it.
- **Status-class filtering** — responses are grouped/filterable by status class (2xx/3xx/4xx/5xx) via pills.
- **Diagnostics severity model** — `error` / `warning` / `info`, each with its own icon shape and color (see `sevMeta` in the logic block).
- **Undo/redo** — full history stack over the spec document state.

## Design Tokens
Defined as CSS custom properties in `API Designer.dc.html`'s `<style>` block, with light + dark variants:

- Surfaces: `--bg`, `--surface`, `--surface-2`, `--inset`
- Borders: `--border`, `--border-strong`
- Text: `--text`, `--text-dim`, `--text-faint`
- Accent: `--accent`, `--accent-soft`
- Semantic: `--add`/`--add-soft` (green), `--del`/`--del-soft` (red), `--warn`/`--warn-soft` (amber)
- Shadow: `--shadow`
- All colors are defined in OKLCH — carry the exact OKLCH values over rather than converting to hex, to preserve perceptual consistency across the palette.
- Typography: `Hanken Grotesk` (UI text), `JetBrains Mono` (code/identifiers/params/schemas), loaded from Google Fonts.
- Radii: 5–11px depending on component size (small pills ~5px, cards ~9–11px).
- Type-tint colors for JSON types (`jsonTint` in the logic block): string `#4a82d8`, integer/number `#3b9c6e`, boolean `#c79a3a`, array `#a86fd8`, object `#7c7c8a`.

## State Management
The prototype holds everything in one `state` object on the root component and derives per-row "view models" (badge styles, labels, disabled flags, etc.) inline in `renderVals()` on every render — e.g. `withParamBadges()`, the `headers:(...).map(...)` blocks, `primCatItems`, etc. In a real app:
- Model the API spec (paths → methods → params/headers/body/responses, plus schemas, tags, security schemes) as normalized typed state (e.g. Zustand/Redux/Context + reducer, or React Query if persisted server-side).
- Keep "derived display" logic (styles, labels, locked flags) as pure selector/hook functions, mirroring the current `renderVals()` computations, rather than storing them in state.
- `api-policy.js` (`API_POLICY`) is pure governance data — port as-is (JSON/TS const) and keep the compliance-checking logic (which fields/headers/responses are mandatory per method/status) as pure functions.
- `primitives.js` is a static catalog (`CATEGORIES` of primitive types) — port as-is (typed as `Primitive[]`).

## TypeScript Conversion Notes
- Define types for: `Endpoint`, `Method` (`GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS`), `Param`, `Header`, `RequestBody`, `Response`, `Schema`/`SchemaField` (with `kind: 'ref'|'primitive'|'custom'`), `SecurityScheme`, `Tag`.
- `Param`/`Header`/`SchemaField` share the ref/primitive/custom kind discriminant — model as a discriminated union on `kind`.
- Type the `API_POLICY` object from `api-policy.js` against a schema (there's a `$schema` reference to `api_policy.schema.json` in the source data — recover/regenerate that JSON Schema and derive a TS type from it, e.g. via `json-schema-to-typescript`, or hand-write the interface).
- Type `primitives.js`'s `CATEGORIES` as `{ key: string; label: string; prims: Primitive[] }[]` with `Primitive = { key, jsonType, format?, description, example, validation: {...} }`.

## Data Persistence / Database Notes
This prototype persists everything to `localStorage` only (see the `_savedProject` read and the various `localStorage.getItem('apiDesigner.*')` calls in the logic block) — there is no backend in the design. To back this with a real database:
- **Entities to persist**: one `Project` (title, OpenAPI version, notes, preferences) containing many `Block`s — `Endpoint` (path/method) and `Schema`/`Security`/`Tag` records — plus nested `Param`/`Header`/`RequestBody`/`Response` rows. Model this as either (a) normalized relational tables (`projects`, `endpoints`, `params`, `headers`, `responses`, `schemas`, `schema_fields`, `security_schemes`, `tags`) with foreign keys back to `project_id`, or (b) a single JSON document column per project (simplest — the whole `blocks` array is already a serializable tree) if you don't need to query inside the spec server-side.
- **API surface needed**: CRUD on the project document (`GET/PUT /projects/:id`) is sufficient for a document-store approach; a relational approach needs CRUD endpoints per entity (endpoints, schemas, etc.) plus an aggregate `GET /projects/:id` that assembles the full tree for the editor.
- **Autosave pattern**: the prototype writes on every state change; debounce this in the real app (e.g. 500ms–1s after the last edit) and PUT/PATCH to the backend instead of `localStorage.setItem`.
- **Multi-user concerns not modeled here**: the prototype has no concept of concurrent edits, versioning, or the "Access" list shown in Settings/Share is static mock data — if the real app needs sharing/collaboration, you'll need to design that data model separately (it's out of scope of this prototype).
- **Suggested stack**: since the target is React + TypeScript, a typical pairing is Prisma or Drizzle ORM against Postgres, with the `Endpoint`/`Schema`/etc. TypeScript types from the section above doubling as your Prisma/Drizzle model types (or generated from them). tRPC or a typed REST layer (e.g. Hono/Express + `zod` validation using the same discriminated-union types) keeps the frontend/backend types in sync.

## Assets
No external images/icons — all icons are inline vector icon-component calls (`ic('name', size)` / `icBrandLogo`, `icClose`, `icPlusSm`, `icTagCheck`, etc.) referencing a small internal icon set. Recreate with your codebase's existing icon library (e.g. lucide-react, which the icon names like `triangle-alert`, `circle-alert`, `arrow-down-to-line` suggest this prototype was already drawing from).

## Files in This Bundle
- `API Designer.dc.html` — full prototype markup + logic (reference for layout, styles, copy, and state-derivation logic).
- `api-policy.js` — governance policy data (response code requirements, mandatory headers, method characteristics) driving the locked/mandated UI behavior and Diagnostics tab.
- `primitives.js` — categorized primitive schema-property catalog powering the Primitive Picker modal.
