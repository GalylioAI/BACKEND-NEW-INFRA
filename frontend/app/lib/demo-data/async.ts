export function demoAsync<T>(value: T, delayMs = 180): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delayMs);
  });
}

export function nowIso() {
  return new Date().toISOString();
}
