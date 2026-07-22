import {
  catalog,
  get,
  init as initState,
  key,
  registeredState,
  reset,
  resolveKey,
  set,
  subscribe,
  type InitOptions,
} from "active-state";
import { bind } from "active-state/dom";

export type ActiveStateInit = Record<string, unknown>;

type ActiveStateProps = {
  /**
   * Initial store map. Optional if you've already called `key()` in imported
   * modules — defaults to `ActiveState.state`.
   */
  init?: ActiveStateInit;
  /** Allow any key format. Default false (UPPERCASE_IDS required). */
  any?: boolean;
  /**
   * SSR / static-export safe hydration for useActiveState.
   * Uses init values as the server snapshot — no other setup needed.
   */
  ssr?: boolean;
};

function ActiveStateRoot({
  init,
  any = false,
  ssr = false,
}: ActiveStateProps): null {
  const payload = init ?? registeredState();
  if (Object.keys(payload).length === 0) {
    throw new Error(
      "[active-state] No state to init. Import your key() modules first, or pass init={...}.",
    );
  }
  // initState is idempotent — safe under Strict Mode / re-renders
  const options: InitOptions = { any, ssr };
  initState(payload, options);
  return null;
}

/** Drop once in root layout. Initializes the singleton; renders nothing. */
export const ActiveState = Object.assign(ActiveStateRoot, {
  init: initState,
  get,
  set,
  subscribe,
  reset,
  bind,
  key,
  catalog,
  resolveKey,
}) as typeof ActiveStateRoot & {
  init: typeof initState;
  get: typeof get;
  set: typeof set;
  subscribe: typeof subscribe;
  reset: typeof reset;
  bind: typeof bind;
  key: typeof key;
  catalog: typeof catalog;
  resolveKey: typeof resolveKey;
  readonly state: Record<string, unknown>;
};

Object.defineProperty(ActiveState, "state", {
  get: () => registeredState(),
  enumerable: true,
});
