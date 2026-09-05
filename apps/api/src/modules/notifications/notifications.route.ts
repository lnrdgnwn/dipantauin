import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", NotificationsController.getNotifications);
router.get("/unread-count", NotificationsController.getUnreadCount);
router.patch("/read-all", NotificationsController.markAllAsRead);
router.patch("/:id/read", NotificationsController.markAsRead);
router.delete("/:id", NotificationsController.deleteNotification);

export default router;
