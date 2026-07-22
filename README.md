# active-state

Tiny keyed pub/sub store for shared client UI state — React, Next.js, and light static HTML.

No Providers. Theme-agnostic (bring your own keys).

## Install

```bash
bunx add active-state
```

## 1. Define keys

`key()` types the id **and** registers its defaults on `ActiveState.state`.

```ts
// client/state/user.ts
import { key } from "active-state";

export const USER = key("USER", {
  id: null as string | null,
  name: null as string | null,
});
```

```ts
// client/state/layout.ts
import { key } from "active-state";

export const LAYOUT = key("LAYOUT", { nav: false });
```

```ts
// client/state/theme.ts
import { key } from "active-state";

// Survives refresh (localStorage). With <ActiveState ssr />, applies after first paint.
export const THEME = key("THEME", { dark: false }, { persist: true });
```

```ts
// client/state/index.ts
import { USER } from "./user";
import { LAYOUT } from "./layout";

// Re-export so importing this file registers every key.
export { USER, LAYOUT };
```

```ts
// client/index.ts — barrel for the whole client folder
export * from "./state";
```

Keys should be `UPPERCASE_IDS` unless you pass `{ any: true }`.

- `LAYOUT.$` → `"LAYOUT"`
- `LAYOUT.nav` → `"LAYOUT.nav"`
- `ActiveState.state` → `{ USER: {…}, LAYOUT: { nav: false } }`

Path alias — point at the `client` folder:


```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "client": ["./client"],
      "client/*": ["./client/*"]
    }
  }
}
```

```ts
import "client"; // register every key (via client → state)
import { USER, LAYOUT } from "client";
import { LAYOUT } from "client/state"; // same catalog, deeper path
import { LAYOUT } from "client/state/layout"; // single key module
```

Next.js picks up `paths` from `tsconfig.json` automatically.

## 2. Init once


Import your catalog **before** boot so `key()` registrations run, then init from `ActiveState.state` (default).

### Next.js / React

```tsx
// app/layout.tsx
import "client"; // registers USER, LAYOUT, …
import { ActiveState } from "active-state/react";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ActiveState ssr />
        {children}
      </body>
    </html>
  );
}
```

| Prop | Meaning |
| --- | --- |
| `init` | Optional. Defaults to `ActiveState.state` from `key()` calls. |
| `ssr` | App Router / static export — safe hydration. |
| `any` | Allow non-`UPPERCASE_IDS` keys. |

Explicit init still works if you prefer:

```tsx
import { state } from "client"; // if you export catalog() yourself
<ActiveState init={state} ssr />
```


Or:

```tsx
<ActiveState init={ActiveState.state} ssr />
```

Client-only apps can omit `ssr`:

```tsx
import "client";
<ActiveState />
```

### Without React

```ts
import "client";
import { init, registeredState } from "active-state";

init(registeredState());
// init(registeredState(), { ssr: true })
```

## 3. Use it in React

```tsx
// components/nav-toggle.tsx
"use client";

import { useActiveState } from "active-state/react";
import { LAYOUT } from "client";


export function NavToggle() {
  const [layout, setLayout] = useActiveState<typeof LAYOUT.defaults>(LAYOUT);

  return (
    <button
      type="button"
      onClick={() => setLayout((l) => ({ ...l!, nav: !l?.nav }))}
    >
      {layout?.nav ? "Close" : "Menu"}
    </button>
  );
}
```

```ts
ActiveState.set(LAYOUT, (l) => ({ ...l!, nav: true }));
ActiveState.get(LAYOUT);
```

## 4. Public / static HTML

Paths + verbs in HTML — **no JS expressions** (not Alpine). Keep attr strings aligned with your `key()` paths.

```html
<script src="https://unpkg.com/active-state/dist/active-state.min.js"></script>
<script>
  ActiveState.init({ LAYOUT: { nav: false }, THEME: { dark: false } });
  ActiveState.bind();
</script>

<button type="button" active-click="toggle:LAYOUT.nav">Menu</button>
Nav: <span active-text="LAYOUT.nav"></span>

<input active-model="THEME.label" />
<template active-each="BOARD.columns" active-as="col">
  <section active-drop="move→col.cards">
    <h2 active-text="col.title"></h2>
    <template active-each="col.cards" active-as="card">
      <article active-drag="card.id">
        <span active-text="card.title"></span>
      </article>
    </template>
    <form active-submit="push:col.cards">
      <input name="title" />
      <button type="submit">Add</button>
    </form>
  </section>
</template>
```

| Attribute | Behavior |
| --- | --- |
| `active-text` | `textContent` ← path |
| `active-show` | show when path is truthy |
| `active-model` | two-way on input/textarea/select/checkbox |
| `active-click` | command: `toggle:path`, `set:path:value`, `push:path:json` |
| `active-toggle` | shorthand → `toggle:path` |
| `active-submit` | form → `push:path` (FormData object; auto `id` if `title` set) |
| `active-each` + `active-as` | `<template>` list; alias paths like `col.title` |
| `active-drag` | drag payload ← path (e.g. `card.id`) |
| `active-drop` | `move→arrayPath` moves `{id}` into that array |

See `examples/html` for a full kanban.

With a bundler:

```ts
import "client";
import { init, registeredState } from "active-state";
import { bind } from "active-state/dom";

init(registeredState());
bind();
```

## 5. ESLint (agent guardrails)

Errors include fix instructions so coding agents self-correct.

```bash
bunx add -d eslint active-state
```

```js
// eslint.config.mjs
import { recommended, publicPages } from "active-state/eslint";

export default [
  ...recommended,
  // Hook ban on public/marketing only — omit authenticated app routes.
  ...publicPages({
    files: [
      "app/(public)/**/*.{js,jsx,ts,tsx}",
      "app/(marketing)/**/*.{js,jsx,ts,tsx}",
    ],
  }),
];
```

| Rule | Catches |
| --- | --- |
| `no-string-keys` | `get("LAYOUT")` / `useActiveState("…")` — use a `key()` slice |
| `valid-active-attr` | Bad `active-*` path / command shape |
| `no-hooks-in-files` | Any React hook under your `publicPages` globs |

`recommended` = string keys + attr shape. `publicPages({ files })` = hook ban on those paths only — list public/marketing globs; leave `app/(app)/**` (or whatever your product shell is) out so agents can use hooks there.

## API reference


| | |
| --- | --- |
| `key(id, defaults, { persist? })` | Typed paths + register defaults; `persist: true` → `localStorage` |
| `hydratePersisted()` | Re-load persisted keys (usually automatic) |
| `ActiveState.state` / `registeredState()` | Current registered map |
| `catalog()` | Same as `registeredState()`; `catalog(A, B)` builds a custom map |
| `init(state?, opts?)` / `<ActiveState ssr />` | Create the store (idempotent) |
| `get` / `set` / `subscribe` | Accept string or `key()` slice |
| `bind()` | Wire path + verb attrs (`text`, `model`, `click`, `each`, drag/drop, …) |
| `reset()` | Clear store **and** key registry (tests / hot reload) |
| `recommended` / `publicPages` from `active-state/eslint` | Flat-config guardrails (named exports) |

## Scope

**In**

- Keyed observables + singleton bus
- Auto-registering `key()` → `ActiveState.state` (`persist: true` → localStorage)
- React: `<ActiveState />`, `useActiveState`, `ssr`
- DOM: path + verb bindings (`each`, `model`, `click`, drag/drop, …)
- CDN build
- ESLint guardrails for AI-assisted codebases

**Out** (later / other packages)

- Theme engines / expression JS in HTML / component system
- Persistence, scroll/hover helpers
- HTML catalog sync beyond path/command-shape checks

## Bundle size

| Import | gzip | brotli | Use when |
| --- | ---: | ---: | --- |
| `active-state` | ~2.3KB | ~2.0KB | Vanilla JS/TS — `init` / `get` / `set` / `subscribe` / `key()` |
| `active-state/dom` | ~5.1KB | ~4.6KB | HTML verbs — `each` / `model` / `click` / drag-drop (+ core) |
| `active-state/react` | ~0.7KB | ~0.6KB | Next.js / React — `<ActiveState />` + `useActiveState` (+ core) |
| CDN IIFE | ~5.3KB | ~4.8KB | core + dom in one browser build |

Sizes are per entry (gzip level 9 / brotli quality 11). `/react` and `/dom` depend on core (one shared singleton). Importing `ActiveState` from `/react` also pulls `/dom` for `bind`. ESLint (`active-state/eslint`) is opt-in. CDNs typically serve brotli when the browser accepts it.

## Examples

Each demo is a full **kanban board** (drag / add / theme) — not published to npm:

```bash
bun run examples:html    # IIFE kanban
bun run examples:htmx    # kanban + HTMX suggest
bun run examples:react   # useActiveState kanban
bun run examples:astro   # Astro + same board
```

See [`examples/README.md`](./examples/README.md).

## Scripts

```bash
bun run build
bun test
bun run size          # gzip attribution
bun run size:brotli   # brotli totals + attribution
```

## License

MIT

