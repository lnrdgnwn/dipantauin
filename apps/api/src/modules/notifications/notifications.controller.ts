import { Response, NextFunction } from "express";
import {
  NotificationsService,
  notificationsQuerySchema,
} from "./notifications.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { idSchema } from "../../utils/validation";

export class NotificationsController {
  static async getNotifications(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await NotificationsService.getNotifications(
        req.user!.userId,
        notificationsQuerySchema.parse(req.query),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      res.json({
        success: true,
        data: await NotificationsService.getUnreadCount(req.user!.userId),
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationsService.markAsRead(
        req.user!.userId,
        idSchema.parse(req.params.id),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await NotificationsService.markAllAsRead(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await NotificationsService.deleteNotification(
        req.user!.userId,
        idSchema.parse(req.params.id),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
