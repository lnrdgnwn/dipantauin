import { Router } from "express";
import { AdminController } from "./admin.controller";

const router = Router();

router.get("/dashboard/summary", AdminController.getDashboardSummary);

// USERS
router.get("/users", AdminController.getUsers);
router.get("/users/:id", AdminController.getUser);
router.patch("/users/:id/status", AdminController.updateUserStatus);

// PLANS
router.post("/plans", AdminController.createPlan);
router.patch("/plans/:id", AdminController.updatePlan);

// SUBSCRIPTIONS
router.get("/subscriptions", AdminController.getAllSubscriptions);
router.get("/subscriptions/:id", AdminController.getSubscription);
router.post("/subscriptions/:id/cancel", AdminController.cancelSubscription);

// PAYMENTS
router.get("/payments", AdminController.getAllPayments);
router.get("/payments/:id", AdminController.getPayment);
router.get("/price-checks", AdminController.getPriceChecks);

export default router;
