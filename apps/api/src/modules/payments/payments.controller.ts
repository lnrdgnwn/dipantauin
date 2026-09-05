import { Request, Response, NextFunction } from "express";
import { PaymentsService, webhookSchema } from "./payments.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { env } from "../../config/env";
import { idSchema } from "../../utils/validation";

export class PaymentsController {
  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      if (env.NODE_ENV !== "production") {
        console.info("[Payment webhook] received", { timestamp: new Date().toISOString(), method: req.method, path: req.path, contentType: req.get("content-type") || null, orderId: typeof req.body?.order_id === "string" ? req.body.order_id : null, keys: req.body && typeof req.body === "object" ? Object.keys(req.body) : [] });
      }
      const validatedData = webhookSchema.parse(req.body);
      const result = await PaymentsService.handleWebhook(validatedData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PaymentsService.getPayments(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PaymentsService.getPayment(
        req.user!.userId,
        idSchema.parse(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
