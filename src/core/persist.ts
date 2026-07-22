const PREFIX = "active-state:";
const persistIds = new Set<string>();

export function markPersisted(id: string): void {
  persistIds.add(id);
}

export function clearPersistedIds(): void {
  persistIds.clear();
}

export function isPersisted(id: string): boolean {
  return persistIds.has(id);
}

export function persistedIds(): string[] {
  return [...persistIds];
}

function canUseStorage(): boolean {
  return typeof globalThis.localStorage !== "undefined";
}

export function readPersisted(id: string): unknown | undefined {
  if (!canUseStorage()) return undefined;
  try {
    const raw = globalThis.localStorage.getItem(PREFIX + id);
    if (raw == null) return undefined;
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function writePersisted(id: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    globalThis.localStorage.setItem(PREFIX + id, JSON.stringify(value));
  } catch {
    // quota / private mode — ignore
  }
}

/** Overlay localStorage values onto a state map (browser only). */
export function applyPersistedToState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!canUseStorage() || persistIds.size === 0) return state;
  const next = { ...state };
  for (const id of persistIds) {
    if (!(id in next)) continue;
    const stored = readPersisted(id);
    if (stored !== undefined) next[id] = stored;
  }
  return next;
}
