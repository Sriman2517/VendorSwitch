import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    capability: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 1,
      min: 1
    },
    weight: {
      type: Number,
      default: 1,
      min: 0
    },
    costPerRequest: {
      type: Number,
      required: true,
      min: 0
    },
    timeoutMs: {
      type: Number,
      default: 2000,
      min: 100
    },
    rateLimitPerMinute: {
      type: Number,
      default: 60,
      min: 1
    },
    rateLimit: {
      currentUsage: {
        type: Number,
        default: 0,
        min: 0
      },
      windowStartedAt: {
        type: Date,
        default: Date.now
      },
      windowSizeSeconds: {
        type: Number,
        default: 60,
        min: 1
      },
      lastUpdatedAt: {
        type: Date,
        default: Date.now
      }
    },
    supportedFeatures: {
      type: [String],
      default: []
    },
    endpointUrl: {
      type: String,
      default: ""
    },
    health: {
      status: {
        type: String,
        enum: ["UP", "DEGRADED", "DOWN"],
        default: "UP"
      },
      avgLatencyMs: {
        type: Number,
        default: 900,
        min: 0
      },
      successRate: {
        type: Number,
        default: 99,
        min: 0,
        max: 100
      },
      errorRate: {
        type: Number,
        default: 1,
        min: 0,
        max: 100
      },
      availability: {
        type: Number,
        default: 99,
        min: 0,
        max: 100
      },
      lastCheckedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  { timestamps: true }
);

vendorSchema.index({ capability: 1, name: 1 }, { unique: true });

export default mongoose.model("Vendor", vendorSchema);
