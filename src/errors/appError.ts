/**
 * An error that already knows which HTTP status and error code it should
 * produce. This is a real `Error` (built with `new Error(...)`, same as
 * any built-in error) with two extra fields attached to it — not a custom
 * `class AppError extends Error`. `instanceof Error`, `.message` and
 * `.stack` all still work, because it genuinely is one.
 */
export interface AppError extends Error {
  statusCode: number;
  code: string;
}

export function createAppError(statusCode: number, code: string, message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    typeof (error as AppError).statusCode === 'number' &&
    typeof (error as AppError).code === 'string'
  );
}
