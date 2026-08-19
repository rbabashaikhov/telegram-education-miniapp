export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorContract {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorBody(error: unknown): ErrorContract {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    };
  }
  if (error instanceof Error) {
    return { error: { code: 'INTERNAL_ERROR', message: error.message } };
  }
  return { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
}

export function statusFromError(error: unknown, fallback = 500): number {
  if (error instanceof AppError) return error.status;
  return fallback;
}
