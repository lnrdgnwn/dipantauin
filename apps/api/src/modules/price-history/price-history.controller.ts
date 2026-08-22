import { Request, Response, NextFunction } from "express";
import { PriceHistoryService } from "./price-history.service";

export class PriceHistoryController {
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await PriceHistoryService.getHistoryByProductId(id, limit);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
