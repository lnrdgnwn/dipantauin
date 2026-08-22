import { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", SubscriptionsController.getMySubscription);
router.get("/status", SubscriptionsController.getSubscriptionStatus);
router.post("/checkout", SubscriptionsController.checkout);
router.post("/cancel", SubscriptionsController.cancel);

export default router;
