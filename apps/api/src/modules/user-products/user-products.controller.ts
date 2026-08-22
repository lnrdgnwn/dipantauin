import { Response, NextFunction } from "express";
import { UserProductsService, trackProductSchema, updateTrackedProductSchema } from "./user-products.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class UserProductsController {
  static async trackProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = trackProductSchema.parse(req.body);
      const result = await UserProductsService.trackProduct(req.user!.userId, validatedData);
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrackedProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserProductsService.getTrackedProducts(req.user!.userId);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTrackedProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = updateTrackedProductSchema.parse(req.body);
      const result = await UserProductsService.updateTrackedProduct(req.user!.userId, req.params.id as string, validatedData);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async untrackProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserProductsService.untrackProduct(req.user!.userId, req.params.id as string);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
