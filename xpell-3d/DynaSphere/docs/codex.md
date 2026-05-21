# codex.md — Xpell (Core + XUI + X3D) Vibe-Coding Contract

**Scope:** This is the strict contract for AI/Codex when modifying any project that uses:
- `xpell-core` (runtime)
- `xpell-ui` (UI runtime)
- `xpell-3d` (3D runtime)

If a change conflicts with this contract, **refactor the code to comply**.

---

## One-line anchor
**Xpell is a real-time interpreter: objects hold runtime state, modules provide behavior, events coordinate changes.**

---

## 1) Responsibilities by layer

### 1.1 xpell-core (runtime engine)
Provides:
- Engine loop / scheduler
- Event bus (`_xem`)
- Command system (`XCommand`, parser responsibilities)
- Shared runtime memory (`XData2`)
- Object lifecycle (`XObject`)
- Module system (`XModule`)

Does **not** provide UI, DOM access, rendering, or platform assumptions.

### 1.2 xpell-ui (UI runtime)
Provides:
- UI objects (`XUIObject` and wrappers like `view`, `button`, `label`, etc.)
- DOM/HTML rendering and UI lifecycle
- Optional DOM-specific event adapter(s)

Rules:
- UI behavior must live in `XUIObject`-level code, not in `xpell-core`.

### 1.3 xpell-3d (3D runtime)
Provides:
- 3D objects (`X3DObject` and wrappers)
- Scene/world management
- Bridges to 3D engines (Three.js) and optional physics (cannon-es)

Rules:
- `xpell-3d` may rely on `xpell-ui` for `_x`, `_xem`, `_xd`, logging, and shared runtime patterns.
- 3D code must not leak DOM assumptions unless explicitly part of a UI-hosted 3D player component.

---

## 2) Xpell Object Contract (applies to ALL framework objects)

### 2.1 Underscore-only runtime state (MANDATORY)
**Every framework object MUST treat underscore-prefixed fields as the only runtime state.**

Rules:
- All runtime-managed fields MUST start with `_`.
- Use `snake_case` for runtime fields.
- Do not introduce public mutable fields without `_`.
- If you need encapsulation, use private `#fields` or `private` members, but expose a `_property` wrapper.

Examples:
- ✅ `_position`, `_rotation`, `_mass`, `_enable_physics`
- ❌ `position`, `mass`, `enablePhysics`

### 2.2 Method exposure & command mapping
- Methods starting with `_` are public to the Xpell engine and may be invoked by command execution.
- Methods without `_` are internal-only.
- Command name mapping:
  - Leading `_` is removed
  - `_` and `-` are interchangeable
  - No other transformations

Example:
```ts
public _set_value(cmd: XCommand) {}
```
Callable as: `set_value` or `set-value`.

### 2.3 No inference / no hidden shadow state
- Do not infer missing state from the environment.
- Do not mirror XData into hidden local mutable state as a “shadow source of truth”.
- If state must be shared, put it in XData2 with explicit keys and sources.

---

## 3) XData2 Contract

### 3.1 Canonical API (required)
All new code MUST use XData2 API:
- Read: `XData.get(key)` / `_xd.get(key)`
- Write: `XData.set(key, value, { source })` / `_xd.set(...)`
- Delete: `XData.delete(key, { source })` / `_xd.delete(...)`
- Subscribe: `XData.on(key, cb)` / `_xd.on(...)`
- Notify without changing value (optional): `XData.touch(key, { source })`
- Mailbox semantics (optional): `XData.pick(key, { source })`

### 3.2 Legacy `_o` access (compat only)
- `_xd._o[key] = value` is legacy compatibility only.
- New code must not write via `_o`.

### 3.3 Required metadata
- Every `.set()` and `.delete()` MUST include a stable `source` string.

---

## 4) Events

- Use `_xem` for event signaling.
- Do not use XData as an event bus.
- Listener order must not be assumed.

---

## 5) XUI rules

- Prefer concrete XUI wrappers (`_type: "button"`, `"label"`, `"view"`, etc.) over raw HTML.
- Use `XHTML` only when no wrapper exists (semantic tags like `<p>`).
- `xpell-core` must never call `document.*` or assume DOM.

---

## 6) X3D rules

### 6.1 Runtime ownership
- `X3DObject` owns its runtime state (`_position`, `_rotation`, `_scale`, `_visible`, etc.).
- The underlying Three.js object is a runtime implementation detail.

### 6.2 Public API for movement
If internal state is private, you MUST still provide public underscore state or setters:
- `setPosition({x,y,z})`, `setRotation({x,y,z,order?})`, `setScale({x,y,z})`
- Optional getters returning serializable `{x,y,z}`

### 6.3 Frame loop performance
- Avoid per-frame allocations in `onFrame`.
- Reuse typed arrays/vectors when possible.

### 6.4 Optional physics
- Physics adapters (`cannon-es`, `three-to-cannon`) must be optional.
- Do not force physics deps for users who only want rendering.

---

## 7) TypeScript / NodeNext / ESM rules

### 7.1 When `moduleResolution` is `node16` / `nodenext`
TypeScript requires **explicit file extensions** in relative ESM imports.

Rule:
- In source TS, write:
  - `import X3DLoader from "./X3DLoader.js";`
- TS will still resolve to the TS source, and emit correct `.js` paths.

If you want extensionless imports in TS source, use:
- `moduleResolution: "bundler"` (Vite-style)

### 7.2 Package exports
- Keep `exports["."].types` pointing to the generated `.d.ts` entry.
- `import` should point to ESM build, `require` to CJS build.

---

## 8) PR/Change discipline

Every change must:
- Keep changes minimal and localized
- Add logging only when debugging is required (and keep it guarded)
- Prefer deterministic behavior over auto-repair or inference

