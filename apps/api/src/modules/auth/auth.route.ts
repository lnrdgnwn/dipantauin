import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/sign-up", AuthController.signUp);
router.post("/sign-in", AuthController.signIn);
router.post("/refresh", AuthController.refresh);
router.post("/sign-out", AuthController.signOut);
router.post("/verify-email", AuthController.verifyEmail);
router.get("/me", requireAuth, AuthController.me);
router.patch("/me", requireAuth, AuthController.updateProfile);
router.patch("/me/password", requireAuth, AuthController.changePassword);

export default router;
