import { createEventBus, type EventBus } from "./create-event-bus";
import { createObservable } from "./create-observable";
import { getStateInstance } from "./get-state-instance";
import { assertUppercaseId } from "./key-format";
import { setEnforceKeys, setServerSnapshot, setSsr } from "./options";
import {
  applyPersistedToState,
  isPersisted,
  persistedIds,
  readPersisted,
  startStorageSync,
  writePersisted,
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

/** Persist on every bus write (set, update, helpers) for `persist: true` keys. */
function installPersistBridge(bus: EventBus): void {
  const baseUpdate = bus.update.bind(bus);
  bus.update = (id, value) => {
    baseUpdate(id, value);
    if (isPersisted(id)) writePersisted(id, value);
  };
}

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
  installPersistBridge(bus);
  getStateInstance(bus);

  startStorageSync((id, value) => {
    bus.update(id, value);
  });

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
