import { Response, NextFunction } from "express";
import { historyQuerySchema, PriceHistoryService } from "./price-history.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { idSchema } from "../../utils/validation";

export class PriceHistoryController {
  static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = idSchema.parse(req.params.id);
      const query = historyQuerySchema.parse(req.query);

      const result = await PriceHistoryService.getHistoryByProductId(
        req.user!.userId,
        id,
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
}
