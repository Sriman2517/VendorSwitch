import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

async function unwrap(request) {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    const payload = error.response?.data;
    throw new Error(payload?.message || payload?.routingReason || error.message || "Request failed");
  }
}

export const api = {
  health: () => unwrap(http.get("/health")),
  vendors: () => unwrap(http.get("/vendors")),
  createVendor: (payload) => unwrap(http.post("/vendors", payload)),
  metrics: () => unwrap(http.get("/vendor-metrics")),
  logs: () => unwrap(http.get("/routing-logs?limit=50")),
  rules: () => unwrap(http.get("/routing-rules")),
  saveRule: (payload) => unwrap(http.post("/routing-rules", payload)),
  aiGenerateRule: (payload) => unwrap(http.post("/ai/generate-rule", payload)),
  aiExplainDecision: (payload) => unwrap(http.post("/ai/explain-decision", payload)),
  aiVendorInsight: (payload) => unwrap(http.post("/ai/vendor-insight", payload)),
  route: async (payload) => {
    try {
      const response = await http.post("/route", payload);
      return response.data;
    } catch (error) {
      if (error.response?.data?.status) {
        return error.response.data;
      }
      throw new Error(error.response?.data?.message || error.message || "Request failed");
    }
  }
};
