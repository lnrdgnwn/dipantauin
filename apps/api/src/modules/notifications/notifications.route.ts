import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", NotificationsController.getNotifications);
router.patch("/:id/read", NotificationsController.markAsRead);

export default router;
