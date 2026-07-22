import type { AnyKey } from "active-state";
import { useActiveState } from "./use-active-state";

export type UseLocalStateOptions = {
  /**
   * Deedee compat no-op when the root mounts with `<ActiveState ssr />`
   * (server snapshot + post-paint hydrate). Kept for call-site parity.
   */
  hydrationSafe?: boolean;
  /**
   * Deedee compat. active-state always JSON-serializes persisted values.
   * Non-JSON / component data must stay on non-`persist` keys.
   */
  json?: boolean;
};

type Setter<T> = (value: T | ((prev: T | undefined) => T)) => void;

/**
 * Compat alias for persisted UI prefs — same as `useActiveState`.
 * Mark the key with `key(id, defaults, { persist: true })`.
 */
export function useLocalState<T = unknown>(
  key: AnyKey,
  selectorOrOptions?: ((value: T) => unknown) | UseLocalStateOptions,
  _maybeOptions?: UseLocalStateOptions,
): [T | undefined, Setter<T>] {
  if (typeof selectorOrOptions === "function") {
    return useActiveState(key, selectorOrOptions as (value: T) => T) as [
      T | undefined,
      Setter<T>,
    ];
  }
  return useActiveState<T>(key);
}
