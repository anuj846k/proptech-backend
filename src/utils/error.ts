// src/utils/error.ts

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message); // Pass message to Error

    this.statusCode = statusCode;

    // Needed to make 'instanceof AppError' work
    Object.setPrototypeOf(this, AppError.prototype);

    // Optional: capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
