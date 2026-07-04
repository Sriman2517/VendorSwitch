import mongoose from "mongoose";

const routingRuleSchema = new mongoose.Schema(
  {
    capability: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },
    strategy: {
      type: String,
      enum: [
        "priority",
        "weighted",
        "lowest_latency",
        "lowest_cost",
        "failover",
        "feature_based",
        "health_based"
      ],
      default: "priority"
    },
    fallbackStrategy: {
      type: String,
      enum: ["priority", "lowest_latency", "lowest_cost", "failover"],
      default: "priority"
    },
    thresholds: {
      maxLatencyMs: {
        type: Number,
        default: 2000
      },
      maxErrorRate: {
        type: Number,
        default: 5
      },
      minAvailability: {
        type: Number,
        default: 95
      }
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("RoutingRule", routingRuleSchema);
