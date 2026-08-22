import { Request, Response, NextFunction } from "express";
import { AuthService, signUpSchema, signInSchema, verifyEmailSchema, signOutSchema } from "./auth.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

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
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = verifyEmailSchema.parse(req.body);
      const result = await AuthService.verifyEmail(validatedData);
      
      res.json({
        success: true,
        data: result,
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

  static async signOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = signOutSchema.parse(req.body);
      const result = await AuthService.signOut(validatedData);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
