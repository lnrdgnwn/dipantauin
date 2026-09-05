export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly limit?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}
