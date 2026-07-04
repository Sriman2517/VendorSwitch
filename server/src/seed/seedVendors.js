import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import RoutingRule from "../models/RoutingRule.js";
import Vendor from "../models/Vendor.js";

dotenv.config();

const capability = "PAN_VERIFICATION";

const vendors = [
  {
    name: "VendorA",
    capability,
    priority: 1,
    weight: 70,
    costPerRequest: 1.5,
    timeoutMs: 2000,
    rateLimitPerMinute: 100,
    supportedFeatures: ["PAN_STATUS", "NAME_MATCH"],
    health: {
      status: "DEGRADED",
      avgLatencyMs: 2400,
      successRate: 94,
      errorRate: 6,
      availability: 94
    }
  },
  {
    name: "VendorB",
    capability,
    priority: 2,
    weight: 30,
    costPerRequest: 1.2,
    timeoutMs: 3000,
    rateLimitPerMinute: 50,
    supportedFeatures: ["PAN_STATUS", "NAME_MATCH", "LOW_COST"],
    health: {
      status: "UP",
      avgLatencyMs: 850,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  },
  {
    name: "VendorC",
    capability,
    priority: 3,
    weight: 20,
    costPerRequest: 0.9,
    timeoutMs: 2500,
    rateLimitPerMinute: 30,
    supportedFeatures: ["PAN_STATUS", "LOW_COST"],
    health: {
      status: "UP",
      avgLatencyMs: 1300,
      successRate: 97,
      errorRate: 3,
      availability: 97
    }
  }
];

const rules = [
  {
    capability,
    strategy: "weighted",
    fallbackStrategy: "lowest_latency",
    thresholds: {
      maxLatencyMs: 2000,
      maxErrorRate: 5,
      minAvailability: 95
    }
  }
];

async function seed() {
  await connectDb();
  await Vendor.deleteMany({ capability });
  await RoutingRule.deleteMany({ capability });
  await Vendor.insertMany(vendors);
  await RoutingRule.insertMany(rules);
  await mongoose.connection.close();
  console.log("Seeded PAN verification vendors and routing rules");
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
