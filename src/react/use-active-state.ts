import { useEffect, useState } from "react";
import { get, set as setState, subscribe } from "../core";

type Setter<T> = (value: T | ((prev: T | undefined) => T)) => void;

export function useActiveState<T = unknown>(
  key: string,
): [T | undefined, Setter<T>];
export function useActiveState<T = unknown, S = T>(
  key: string,
  selector: (value: T) => S,
): [S | undefined, Setter<T>];
export function useActiveState<T = unknown, S = T>(
  key: string,
  selector?: (value: T) => S,
): [T | S | undefined, Setter<T>] {
  const [value, setValue] = useState<T | undefined>(() => get<T>(key));

  useEffect(() => {
    return subscribe(key, (next) => setValue(next as T));
  }, [key]);

  const set: Setter<T> = (next) => {
    setState<T>(key, next);
  };

  const selected =
    selector && value !== undefined ? selector(value) : (value as T | S | undefined);

  return [selected, set];
}
