import { Request, Response, NextFunction } from "express";
import { PaymentsService, webhookSchema } from "./payments.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class PaymentsController {
  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
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
}
