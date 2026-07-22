import { createEventBus } from "./create-event-bus";
import { createObservable } from "./create-observable";
import { getStateInstance } from "./get-state-instance";
import { assertUppercaseId } from "./key-format";
import { setEnforceKeys, setServerSnapshot, setSsr } from "./options";
import {
  applyPersistedToState,
  persistedIds,
  readPersisted,
} from "./persist";

export type InitOptions = {
  /** Allow any key format. Default false (UPPERCASE_IDS required). */
  any?: boolean;
  /**
   * SSR / static-export safe snapshots for React hydration.
   * Enables useSyncExternalStore in useActiveState.
   * Persisted keys hydrate on the client after the first paint.
   */
  ssr?: boolean;
};

export function init(
  initialState: Record<string, unknown>,
  options: InitOptions = {},
): void {
  try {
    getStateInstance();
    return;
  } catch {
    // continue
  }

  const allowAny = options.any ?? false;
  const enableSsr = options.ssr ?? false;
  setEnforceKeys(!allowAny);
  setSsr(enableSsr);

  // Server snapshot always uses the provided defaults (no localStorage).
  setServerSnapshot(initialState);

  if (!allowAny) {
    for (const key of Object.keys(initialState)) {
      assertUppercaseId(key);
    }
  }

  // Client-only apps: merge storage before the bus exists (no hydration mismatch).
  const bootState = enableSsr
    ? initialState
    : applyPersistedToState(initialState);

  const bus = createEventBus({
    init(observables) {
      for (const key of Object.keys(bootState)) {
        observables.set(key, createObservable(bootState[key]));
      }
    },
  });
  getStateInstance(bus);

  // Next / SSR: apply localStorage after first client paint.
  if (enableSsr && typeof globalThis.window !== "undefined") {
    queueMicrotask(() => {
      for (const id of persistedIds()) {
        const stored = readPersisted(id);
        if (stored !== undefined) bus.update(id, stored);
      }
    });
  }
}
