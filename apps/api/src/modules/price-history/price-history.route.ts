import { Router } from "express";
import { PriceHistoryController } from "./price-history.controller";

const router = Router({ mergeParams: true }); // mergeParams to access productId from parent route

router.get("/", PriceHistoryController.getHistory);

export default router;
