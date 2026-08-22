import { Router } from "express";
import { AdminController } from "./admin.controller";

const router = Router();

// USERS
router.get("/users", AdminController.getUsers);
router.patch("/users/:id/status", AdminController.updateUserStatus);

// PLANS
router.post("/plans", AdminController.createPlan);
router.patch("/plans/:id", AdminController.updatePlan);

// SUBSCRIPTIONS
router.get("/subscriptions", AdminController.getAllSubscriptions);
router.post("/subscriptions/:id/cancel", AdminController.cancelSubscription);

// PAYMENTS
router.get("/payments", AdminController.getAllPayments);

export default router;
