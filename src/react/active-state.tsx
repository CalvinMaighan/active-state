import {
  catalog,
  clearPersisted,
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
   * Initial store map — required. Pass your catalog snapshot, e.g.
   * `import { state } from "client/state"` then `<ActiveState init={state} />`.
   */
  init: ActiveStateInit;
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
  if (init == null || Object.keys(init).length === 0) {
    throw new Error(
      "[active-state] <ActiveState init={…} /> requires a non-empty map. " +
        'Import your catalog (e.g. import { state } from "client/state") and pass init={state}.',
    );
  }
  // initState is idempotent — safe under Strict Mode / re-renders
  const options: InitOptions = { any, ssr };
  initState(init, options);
  return null;
}

/** Drop once in root layout. Initializes the singleton; renders nothing. */
export const ActiveState = Object.assign(ActiveStateRoot, {
  init: initState,
  get,
  set,
  subscribe,
  reset,
  clearPersisted,
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
  clearPersisted: typeof clearPersisted;
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
