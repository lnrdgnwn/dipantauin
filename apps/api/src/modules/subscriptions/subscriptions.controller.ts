import { Request, Response, NextFunction } from "express";
import { SubscriptionsService, checkoutSchema } from "./subscriptions.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class SubscriptionsController {
  static async getMySubscription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionsService.getMySubscription(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSubscriptionStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionsService.getSubscriptionStatus(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async checkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const result = await SubscriptionsService.checkout(req.user!.userId, validatedData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionsService.cancel(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
