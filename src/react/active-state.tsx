import {
  get,
  init as initState,
  reset,
  set,
  subscribe,
  type InitOptions,
} from "../core";

export type ActiveStateInit = Record<string, unknown>;

type ActiveStateProps = {
  init: ActiveStateInit;
  /** Require UPPERCASE_IDS keys. Default true. */
  enforceKeys?: boolean;
};

function ActiveStateRoot({
  init,
  enforceKeys = true,
}: ActiveStateProps): null {
  // initState is idempotent — safe under Strict Mode / re-renders
  const options: InitOptions = { enforceKeys };
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
});
