import { Response, NextFunction } from "express";
import {
  UserProductsService,
  trackProductSchema,
  trackedProductsQuerySchema,
  updateTrackedProductSchema,
} from "./user-products.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { idSchema } from "../../utils/validation";

export class UserProductsController {
  static async queuePriceCheckNow(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await UserProductsService.queuePriceCheckNow(
        req.user!.userId,
        idSchema.parse(req.params.id),
      );
      res.status(202).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async trackProduct(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validatedData = trackProductSchema.parse(req.body);
      const result = await UserProductsService.trackProduct(
        req.user!.userId,
        validatedData,
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrackedProducts(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const query = trackedProductsQuerySchema.parse(req.query);
      const result = await UserProductsService.getTrackedProducts(
        req.user!.userId,
        query,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrackedProduct(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await UserProductsService.getTrackedProduct(
        req.user!.userId,
        idSchema.parse(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateTrackedProduct(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validatedData = updateTrackedProductSchema.parse(req.body);
      const result = await UserProductsService.updateTrackedProduct(
        req.user!.userId,
        idSchema.parse(req.params.id),
        validatedData,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async untrackProduct(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await UserProductsService.untrackProduct(
        req.user!.userId,
        idSchema.parse(req.params.id),
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
