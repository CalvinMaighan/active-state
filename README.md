# active-state

Tiny keyed pub/sub client store for TypeScript apps, with a React hook aimed at **Next.js**.

Core is framework-agnostic. React adapter: `ActiveState` + `useActiveState`.

## Install

```bash
bunx add active-state
```

## Recommended setup: `client/state`

Declare every key (and its default) in one place, then pass that object to `<ActiveState init={…} />`.

**Keys must be `UPPERCASE_IDS`** (e.g. `CART`, `CART_ITEMS`, `UI_NAV_OPEN`) unless you disable enforcement.

```ts
// client/state/cart.ts
export const CART = "CART" as const;
export type CartItem = { id: string; qty: number };
export const cartDefault: CartItem[] = [];
```

```ts
// client/state/ui.ts
export const UI = "UI" as const;
export type UiState = { navOpen: boolean };
export const uiDefault: UiState = { navOpen: false };
```

```ts
// client/state/index.ts
import { CART, cartDefault } from "./cart";
import { UI, uiDefault } from "./ui";

export const state = {
  [CART]: cartDefault,
  [UI]: uiDefault,
};

export type AppState = typeof state;
export { CART, UI };
```

```tsx
// app/layout.tsx
import { ActiveState } from "active-state/react";
import { state } from "../client/state";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ActiveState init={state} />
        {children}
      </body>
    </html>
  );
}
```

Disable key-format enforcement if you need legacy names:

```tsx
<ActiveState init={state} enforceKeys={false} />
```

```tsx
// components/cart-badge.tsx
"use client";

import { useActiveState } from "active-state/react";
import { CART, type CartItem } from "../client/state/cart";

export function CartBadge() {
  const [cart, setCart] = useActiveState<CartItem[]>(CART);

  return (
    <button type="button" onClick={() => setCart((c) => [...(c ?? []), { id: "1", qty: 1 }])}>
      {cart?.length ?? 0}
    </button>
  );
}
```

### Runtime checks

| Case | Behavior |
| --- | --- |
| Key not `UPPERCASE_IDS` (default) | Throws |
| Key missing from `init` object | `console.warn` |
| `enforceKeys={false}` | Skips format check |

```text
[active-state] Invalid key "cart". Use UPPERCASE_IDS (e.g. CART_ITEMS). ...
[active-state] Unknown key "FOO". Add it to your init object (e.g. client/state).
```

`active-state/react` is marked `"use client"` so layout can import `ActiveState` and Client Components can use the hook.

## Core API (no React)

```ts
import { init, get, set, subscribe, reset } from "active-state";

init({ COUNT: 0 });
get<number>("COUNT"); // 0
set("COUNT", (c) => (c ?? 0) + 1);
const unsub = subscribe("COUNT", console.log);
reset(); // tests / hot reload

// opt out of UPPERCASE_IDS
init({ count: 0 }, { enforceKeys: false });
```

Same helpers also hang off the React export: `ActiveState.init`, `ActiveState.get`, `ActiveState.set`, …

| Method | Notes |
| --- | --- |
| `init(state, opts?)` / `<ActiveState init={state} enforceKeys? />` | Idempotent. One observable per key. |
| `get(key)` | Current value (throws if store not initialized). Warns if key missing. |
| `set(key, value \| updater)` | `Object.is` skips notify. Warns if key missing (then lazy-creates). |
| `subscribe(key, fn)` | Immediate current value; returns unsubscribe. Warns if key missing. |
| `reset()` | Clears singleton. |

## Design notes

- Singleton bus — shared client UI state across components
- Treat `client/state` as the catalog of allowed `UPPERCASE_IDS` keys
- Not a server store; do not put secrets in it
- Not a replacement for URL state, server cache, or a forms library

## Scripts

```bash
bun run build
bun test
```

## License

MIT
