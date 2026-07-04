import { getCapabilityMetrics } from "../services/metricsService.js";

export async function getVendorMetrics(req, res, next) {
  try {
    const metrics = await getCapabilityMetrics(req.query.capability);

    res.json({
      status: "SUCCESS",
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
}
