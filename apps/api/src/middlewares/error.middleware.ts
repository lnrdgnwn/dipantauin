import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error";

type HttpError = {
  statusCode: number;
  message: string;
  code?: string;
  limit?: number;
};

function isHttpError(error: unknown): error is HttpError {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Partial<HttpError>;
  return (
    typeof candidate.statusCode === "number" &&
    candidate.statusCode >= 400 &&
    candidate.statusCode < 600 &&
    typeof candidate.message === "string"
  );
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: err.issues,
    });
  }

  if (err instanceof AppError || isHttpError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      message:
        err instanceof AppError || err.statusCode < 500
          ? err.message
          : "Service unavailable",
      ...(err.code ? { code: err.code } : {}),
      ...(typeof err.limit === "number" ? { limit: err.limit } : {}),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ success: false, message: "Resource already exists" });
    }
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }
  }

  console.error("Unhandled request error", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
};
