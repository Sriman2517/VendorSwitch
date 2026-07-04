import mongoose from "mongoose";
import { summarizeStrategyCoverage } from "../services/routingEngine.js";

export function getHealth(_req, res) {
  res.json({
    status: "SUCCESS",
    service: "VendorSwitch API",
    database: mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED",
    routingStrategies: summarizeStrategyCoverage(),
    timestamp: new Date().toISOString()
  });
}
