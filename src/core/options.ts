let enforceKeys = true;

export function setEnforceKeys(value: boolean): void {
  enforceKeys = value;
}

export function getEnforceKeys(): boolean {
  return enforceKeys;
}

export function resetOptions(): void {
  enforceKeys = true;
}
