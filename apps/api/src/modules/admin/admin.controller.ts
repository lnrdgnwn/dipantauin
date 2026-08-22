import { Request, Response, NextFunction } from "express";
import { AdminService, createPlanSchema, updatePlanSchema, updateUserStatusSchema } from "./admin.service";

export class AdminController {
  // USERS
  static async getUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getUsers();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateUserStatusSchema.parse(req.body);
      const result = await AdminService.updateUserStatus(req.params.id as string, validatedData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PLANS
  static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createPlanSchema.parse(req.body);
      const result = await AdminService.createPlan(validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updatePlanSchema.parse(req.body);
      const result = await AdminService.updatePlan(req.params.id as string, validatedData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // SUBSCRIPTIONS
  static async getAllSubscriptions(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAllSubscriptions();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.cancelSubscription(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PAYMENTS
  static async getAllPayments(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAllPayments();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
