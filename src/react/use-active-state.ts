import { useSyncExternalStore } from "react";
import {
  get,
  getServerSnapshot,
  getSsr,
  resolveKey,
  set as setState,
  subscribe,
  type AnyKey,
} from "active-state";

type Setter<T> = (value: T | ((prev: T | undefined) => T)) => void;

export function useActiveState<T = unknown>(
  key: AnyKey,
): [T | undefined, Setter<T>];
export function useActiveState<T = unknown, S = T>(
  key: AnyKey,
  selector: (value: T) => S,
): [S | undefined, Setter<T>];
export function useActiveState<T = unknown, S = T>(
  key: AnyKey,
  selector?: (value: T) => S,
): [T | S | undefined, Setter<T>] {
  const id = resolveKey(key);

  const value = useSyncExternalStore(
    (onChange) => subscribe(id, () => onChange()),
    () => get<T>(id),
    getSsr() ? () => getServerSnapshot<T>(id) : undefined,
  );

  const set: Setter<T> = (next) => {
    setState<T>(id, next);
  };

  const selected =
    selector && value !== undefined ? selector(value) : (value as T | S | undefined);

  return [selected, set];
}
