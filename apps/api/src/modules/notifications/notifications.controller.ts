import { Response, NextFunction } from "express";
import { NotificationsService } from "./notifications.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class NotificationsController {
  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationsService.getNotifications(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationsService.markAsRead(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
