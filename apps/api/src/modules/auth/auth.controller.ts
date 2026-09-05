import { Request, Response, NextFunction } from "express";
import {
  AuthService,
  signUpSchema,
  signInSchema,
  verifyEmailSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./auth.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { env } from "../../config/env";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export class AuthController {
  static async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = signUpSchema.parse(req.body);
      const result = await AuthService.signUp(validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = signInSchema.parse(req.body);
      const result = await AuthService.signIn(validatedData);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = verifyEmailSchema.parse(req.body);
      const result = await AuthService.verifyEmail(validatedData);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await AuthService.me(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.updateProfile(
        req.user!.userId,
        updateProfileSchema.parse(req.body),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.changePassword(
        req.user!.userId,
        changePasswordSchema.parse(req.body),
      );
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Read refresh token from HTTP-only cookie
      const refreshTokenValue = req.cookies?.refreshToken;

      if (!refreshTokenValue) {
        return res
          .status(401)
          .json({ success: false, message: "No refresh token" });
      }

      const result = await AuthService.refreshAccessToken(refreshTokenValue);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.json({
        success: true,
        data: { user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async signOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;

      // Expire browser credentials first so logout still takes effect if token
      // revocation encounters a transient database error.
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      // Revoke refresh token from database
      if (refreshToken) {
        await AuthService.signOut({
          refreshToken,
        });
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
