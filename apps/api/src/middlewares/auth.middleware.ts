import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "@dipantauin/prisma";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // First ensure the user is authenticated
  requireAuth(req, res, async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { role: true },
      });

      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin access required",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error while checking permissions",
      });
    }
  });
};
