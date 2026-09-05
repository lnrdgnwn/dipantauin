import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AuthRepository } from "../modules/auth/auth.repository";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token = "";

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

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
  next: NextFunction,
) => {
  // First ensure the user is authenticated
  requireAuth(req, res, async () => {
    try {
      const user = await AuthRepository.findUserRole(req.user!.userId);

      if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin access required",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  });
};
