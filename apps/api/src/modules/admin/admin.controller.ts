import { Request, Response, NextFunction } from "express";
import {
  AdminService,
  adminPaymentsQuerySchema,
  adminPriceChecksQuerySchema,
  adminSubscriptionsQuerySchema,
  adminUsersQuerySchema,
  createPlanSchema,
  updatePlanSchema,
  updateUserStatusSchema,
} from "./admin.service";
import { idSchema } from "../../utils/validation";

export class AdminController {
  static async getDashboardSummary(
    _req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      res.json({
        success: true,
        data: await AdminService.getDashboardSummary(),
      });
    } catch (error) {
      next(error);
    }
  }

  // USERS
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getUsers(
        adminUsersQuerySchema.parse(req.query),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await AdminService.getUser(idSchema.parse(req.params.id)),
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validatedData = updateUserStatusSchema.parse(req.body);
      const result = await AdminService.updateUserStatus(
        idSchema.parse(req.params.id),
        validatedData,
      );
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
      const result = await AdminService.updatePlan(
        idSchema.parse(req.params.id),
        validatedData,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // SUBSCRIPTIONS
  static async getAllSubscriptions(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await AdminService.getAllSubscriptions(
        adminSubscriptionsQuerySchema.parse(req.query),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await AdminService.getSubscription(idSchema.parse(req.params.id)),
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await AdminService.cancelSubscription(
        idSchema.parse(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PAYMENTS
  static async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAllPayments(
        adminPaymentsQuerySchema.parse(req.query),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPayment(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await AdminService.getPayment(idSchema.parse(req.params.id)),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPriceChecks(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await AdminService.getPriceChecks(
          adminPriceChecksQuerySchema.parse(req.query),
        ),
      });
    } catch (error) {
      next(error);
    }
  }
}
