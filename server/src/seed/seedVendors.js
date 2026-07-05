import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import RoutingRule from "../models/RoutingRule.js";
import Vendor from "../models/Vendor.js";

dotenv.config();

const capabilities = ["PAN_VERIFICATION", "OCR", "SMS"];

const vendors = [
  {
    name: "VendorPANFast",
    capability: "PAN_VERIFICATION",
    enabled: true,
    priority: 1,
    weight: 70,
    costPerRequest: 1.5,
    timeoutMs: 2000,
    rateLimitPerMinute: 100,
    supportedFeatures: ["PAN_STATUS", "NAME_MATCH"],
    endpointUrl: "",
    health: {
      status: "UP",
      avgLatencyMs: 700,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  },
  {
    name: "VendorPANCheap",
    capability: "PAN_VERIFICATION",
    enabled: true,
    priority: 2,
    weight: 30,
    costPerRequest: 1,
    timeoutMs: 2500,
    rateLimitPerMinute: 60,
    supportedFeatures: ["PAN_STATUS", "NAME_MATCH", "DOB_MATCH", "LOW_COST"],
    endpointUrl: "",
    health: {
      status: "UP",
      avgLatencyMs: 900,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  },
  {
    name: "VendorOCRFast",
    capability: "OCR",
    enabled: true,
    priority: 1,
    weight: 60,
    costPerRequest: 2.5,
    timeoutMs: 2500,
    rateLimitPerMinute: 80,
    supportedFeatures: ["TEXT_EXTRACTION", "IMAGE_QUALITY_CHECK"],
    endpointUrl: "",
    health: {
      status: "UP",
      avgLatencyMs: 850,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  },
  {
    name: "VendorOCRFull",
    capability: "OCR",
    enabled: true,
    priority: 2,
    weight: 40,
    costPerRequest: 2,
    timeoutMs: 3000,
    rateLimitPerMinute: 50,
    supportedFeatures: ["TEXT_EXTRACTION", "IMAGE_QUALITY_CHECK", "DOCUMENT_TYPE_DETECTION", "FIELD_CONFIDENCE"],
    endpointUrl: "",
    health: {
      status: "UP",
      avgLatencyMs: 950,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  },
  {
    name: "VendorSMSFast",
    capability: "SMS",
    enabled: true,
    priority: 1,
    weight: 65,
    costPerRequest: 0.4,
    timeoutMs: 1500,
    rateLimitPerMinute: 120,
    supportedFeatures: ["OTP_DELIVERY", "DELIVERY_REPORT"],
    endpointUrl: "",
    health: {
      status: "UP",
      avgLatencyMs: 750,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  },
  {
    name: "VendorSMSReliable",
    capability: "SMS",
    enabled: true,
    priority: 2,
    weight: 35,
    costPerRequest: 0.6,
    timeoutMs: 2000,
    rateLimitPerMinute: 90,
    supportedFeatures: ["OTP_DELIVERY", "DLT_TEMPLATE", "DELIVERY_REPORT", "UNICODE_SMS"],
    endpointUrl: "",
    health: {
      status: "UP",
      avgLatencyMs: 900,
      successRate: 99,
      errorRate: 1,
      availability: 99
    }
  }
];

const rules = [
  {
    capability: "PAN_VERIFICATION",
    strategy: "lowest_latency",
    fallbackStrategy: "priority",
    thresholds: {
      maxLatencyMs: 2000,
      maxErrorRate: 5,
      minAvailability: 95
    }
  },
  {
    capability: "OCR",
    strategy: "lowest_cost",
    fallbackStrategy: "lowest_latency",
    thresholds: {
      maxLatencyMs: 2000,
      maxErrorRate: 5,
      minAvailability: 95
    }
  },
  {
    capability: "SMS",
    strategy: "weighted",
    fallbackStrategy: "priority",
    thresholds: {
      maxLatencyMs: 2000,
      maxErrorRate: 5,
      minAvailability: 95
    }
  }
];

async function seed() {
  await connectDb();
  await Vendor.deleteMany({ capability: { $in: capabilities } });
  await RoutingRule.deleteMany({ capability: { $in: capabilities } });
  await Vendor.insertMany(vendors);
  await RoutingRule.insertMany(rules);
  await mongoose.connection.close();
  console.log("Seeded VendorSwitch sample vendors and routing rules");
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
