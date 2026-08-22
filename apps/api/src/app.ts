import express from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi";
import authRoutes from "./modules/auth/auth.route";
import productsRoutes from "./modules/products/products.route";
import userProductsRoutes from "./modules/user-products/user-products.route";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.route";
import paymentsRoutes from "./modules/payments/payments.route";
import notificationsRoutes from "./modules/notifications/notifications.route";
import plansRoutes from "./modules/plans/plans.route";
import adminRoutes from "./modules/admin/admin.route";
import { requireAdmin } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/tracked-products", userProductsRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/subscription", subscriptionsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", requireAdmin, adminRoutes);

// Global error handler must be last
app.use(errorHandler);

export default app;