import { Request, Response, NextFunction } from "express";
import { PlansService } from "./plans.service";

export class PlansController {
  static async getPlans(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PlansService.getPlans();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PlansService.getPlanById(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
