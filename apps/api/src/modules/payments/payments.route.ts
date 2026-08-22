import { Router } from "express";
import { PaymentsController } from "./payments.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/webhook", PaymentsController.webhook);
router.get("/", requireAuth, PaymentsController.getPayments);

export default router;
