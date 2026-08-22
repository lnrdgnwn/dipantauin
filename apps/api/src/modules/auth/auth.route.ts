import { Router } from "express";
import { AuthController } from "./auth.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/sign-up", AuthController.signUp);
router.post("/sign-in", AuthController.signIn);
router.post("/sign-out", requireAuth, AuthController.signOut);
router.post("/verify-email", AuthController.verifyEmail);
router.get("/me", requireAuth, AuthController.me);

export default router;
