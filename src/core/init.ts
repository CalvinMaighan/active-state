import { createEventBus } from "./create-event-bus";
import { createObservable } from "./create-observable";
import { getStateInstance } from "./get-state-instance";
import { assertUppercaseId } from "./key-format";
import { setEnforceKeys } from "./options";

export type InitOptions = {
  /** Require UPPERCASE_IDS keys. Default true. */
  enforceKeys?: boolean;
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

  const enforceKeys = options.enforceKeys ?? true;
  setEnforceKeys(enforceKeys);

  if (enforceKeys) {
    for (const key of Object.keys(initialState)) {
      assertUppercaseId(key);
    }
  }

  const bus = createEventBus({
    init(observables) {
      for (const key of Object.keys(initialState)) {
        observables.set(key, createObservable(initialState[key]));
      }
    },
  });
  getStateInstance(bus);
}
