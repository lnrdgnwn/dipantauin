import { Router } from "express";
import { UserProductsController } from "./user-products.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", UserProductsController.trackProduct);
router.get("/", UserProductsController.getTrackedProducts);
router.post("/:id/check-now", UserProductsController.queuePriceCheckNow);
router.get("/:id", UserProductsController.getTrackedProduct);
router.patch("/:id", UserProductsController.updateTrackedProduct);
router.delete("/:id", UserProductsController.untrackProduct);

export default router;
