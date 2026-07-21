import { getStateInstance, resetStateInstance } from "./get-state-instance";
import { init } from "./init";
import { assertUppercaseId } from "./key-format";
import { getEnforceKeys, resetOptions } from "./options";
import { uuid } from "./uuid";

export { createObservable } from "./create-observable";
export type { Observable, Observer } from "./create-observable";
export { createEventBus } from "./create-event-bus";
export type { EventBus } from "./create-event-bus";
export { getStateInstance } from "./get-state-instance";
export { init } from "./init";
export type { InitOptions } from "./init";
export { isUppercaseId, assertUppercaseId } from "./key-format";
export { uuid } from "./uuid";

function assertKey(key: string): void {
  if (getEnforceKeys()) assertUppercaseId(key);
}

export function get<T = unknown>(key: string): T | undefined {
  assertKey(key);
  const source = getStateInstance().getSource(key);
  return source?.getValue() as T | undefined;
}

export function set<T = unknown>(
  key: string,
  value: T | ((prev: T | undefined) => T),
): void {
  assertKey(key);
  const bus = getStateInstance();
  // Avoid getSource here so unknown keys warn once inside update().
  const prev = bus.keys().includes(key)
    ? (bus.getSource(key)?.getValue() as T | undefined)
    : undefined;
  const next =
    typeof value === "function"
      ? (value as (p: T | undefined) => T)(prev)
      : value;
  bus.update(key, next);
}

export function subscribe(
  key: string,
  listener: (value: unknown) => void,
): () => void {
  assertKey(key);
  const source = getStateInstance().getSource(key);
  if (!source) return () => {};

  const id = uuid();
  source.subscribe({
    id,
    next: listener,
    complete: () => {},
  });
  return () => source.unsubscribe(id);
}

export function reset(): void {
  try {
    const bus = getStateInstance();
    for (const key of bus.keys()) {
      bus.getSource(key)?.complete();
    }
  } catch {
    // not initialized
  }
  resetStateInstance();
  resetOptions();
}
