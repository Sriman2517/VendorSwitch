import mongoose from "mongoose";

const attemptedVendorSchema = new mongoose.Schema(
  {
    vendorId: String,
    vendorName: String,
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "TIMEOUT"]
    },
    latencyMs: Number,
    reason: String
  },
  { _id: false }
);

const requestLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    capability: {
      type: String,
      required: true,
      uppercase: true
    },
    strategy: {
      type: String,
      required: true
    },
    vendorUsed: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "TIMEOUT", "NO_VENDOR_AVAILABLE"],
      required: true
    },
    routingReason: {
      type: String,
      required: true
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    decisions: {
      type: [String],
      default: []
    },
    attemptedVendors: {
      type: [attemptedVendorSchema],
      default: []
    }
  },
  { timestamps: true }
);

requestLogSchema.index({ capability: 1, createdAt: -1 });
requestLogSchema.index({ vendorUsed: 1, createdAt: -1 });
requestLogSchema.index({ "attemptedVendors.vendorName": 1, createdAt: -1 });

export default mongoose.model("RequestLog", requestLogSchema);
