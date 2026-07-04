import cors from "cors";
import express from "express";
import morgan from "morgan";
import aiRoutes from "./routes/aiRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import metricRoutes from "./routes/metricRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import ruleRoutes from "./routes/ruleRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/health", healthRoutes);
app.use("/ai", aiRoutes);
app.use("/vendors", vendorRoutes);
app.use("/route", routeRoutes);
app.use("/routing-rules", ruleRoutes);
app.use("/vendor-metrics", metricRoutes);
app.use("/routing-logs", logRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
