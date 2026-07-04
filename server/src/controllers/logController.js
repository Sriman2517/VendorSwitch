import RequestLog from "../models/RequestLog.js";

export async function getRoutingLogs(req, res, next) {
  try {
    const filter = {};
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    if (req.query.capability) {
      filter.capability = String(req.query.capability).toUpperCase();
    }

    if (req.query.status) {
      filter.status = String(req.query.status).toUpperCase();
    }

    const logs = await RequestLog.find(filter).sort({ createdAt: -1 }).limit(limit);

    res.json({
      status: "SUCCESS",
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}
