import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import {
  get,
  hydratePersisted,
  init,
  key,
  registeredState,
  reset,
  set,
} from "../src/core";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  const storage = {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
    writable: true,
  });
}

beforeAll(() => {
  installMemoryLocalStorage();
});

afterEach(() => {
  reset();
  globalThis.localStorage.clear();
});

describe("key({ persist: true })", () => {
  test("writes to localStorage on set", () => {
    key("THEME", { dark: false }, { persist: true });
    init(registeredState());
    set("THEME", { dark: true });
    expect(localStorage.getItem("active-state:THEME")).toBe(
      JSON.stringify({ dark: true }),
    );
  });

  test("rehydrates on init without ssr", () => {
    localStorage.setItem(
      "active-state:THEME",
      JSON.stringify({ dark: true }),
    );
    key("THEME", { dark: false }, { persist: true });
    init(registeredState());
    expect(get("THEME")).toEqual({ dark: true });
  });

  test("with ssr, hydrates after microtask", async () => {
    localStorage.setItem(
      "active-state:THEME",
      JSON.stringify({ dark: true }),
    );
    key("THEME", { dark: false }, { persist: true });
    init(registeredState(), { ssr: true });
    expect(get("THEME")).toEqual({ dark: false });
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(get("THEME")).toEqual({ dark: true });
  });

  test("hydratePersisted can be called manually", () => {
    key("THEME", { dark: false }, { persist: true });
    init(registeredState());
    localStorage.setItem(
      "active-state:THEME",
      JSON.stringify({ dark: true }),
    );
    hydratePersisted();
    expect(get("THEME")).toEqual({ dark: true });
  });

  test("non-persist keys stay out of storage", () => {
    key("LAYOUT", { nav: false });
    init(registeredState());
    set("LAYOUT", { nav: true });
    expect(localStorage.getItem("active-state:LAYOUT")).toBeNull();
  });
});
