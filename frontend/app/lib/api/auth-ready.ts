let authReady = false;
let readyPromise: Promise<void> | null = null;
let resolveReady: (() => void) | null = null;

function ensureReadyPromise() {
  if (!readyPromise) {
    readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
  }
}

export function resetAuthReady() {
  authReady = false;
  readyPromise = null;
  resolveReady = null;
  ensureReadyPromise();
}

export function signalAuthReady() {
  authReady = true;
  resolveReady?.();
  resolveReady = null;
}

export function whenAuthReady(): Promise<void> {
  if (authReady) {
    return Promise.resolve();
  }
  ensureReadyPromise();
  return readyPromise!;
}

resetAuthReady();
