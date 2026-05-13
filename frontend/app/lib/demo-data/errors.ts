export class DemoDataError extends Error {
  constructor(
    message: string,
    public readonly code = "DEMO_ERROR",
  ) {
    super(message);
    this.name = "DemoDataError";
  }
}

export function getDemoErrorMessage(
  error: unknown,
  fallback = "Demo data unavailable.",
) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
