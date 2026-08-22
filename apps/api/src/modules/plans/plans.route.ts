import { Router } from "express";
import { PlansController } from "./plans.controller";

const router = Router();

router.get("/", PlansController.getPlans);
router.get("/:id", PlansController.getPlanById);

export default router;
