import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
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
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { DatabaseRepository } from "./repositories/database.repository";
import { corsOptions } from "./config/cors";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.set("json replacer", (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value,
);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests" },
});

app.get("/api/health/live", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health/ready", async (_req, res) => {
  try {
    await DatabaseRepository.isReady();
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/tracked-products", userProductsRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/subscription", subscriptionsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", requireAdmin, adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
