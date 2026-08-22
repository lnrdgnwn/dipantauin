import { Router } from "express";
import { ProductsController } from "./products.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import priceHistoryRoutes from "../price-history/price-history.route";

const router = Router();

// Products route typically requires authentication
router.use(requireAuth);

router.post("/preview", ProductsController.preview);
router.post("/", ProductsController.addProduct);
router.get("/", ProductsController.getProducts);
router.get("/:id", ProductsController.getProductById);
router.delete("/:id", ProductsController.deleteProduct);

// Nested route for price history
router.use("/:id/price-history", priceHistoryRoutes);

export default router;
