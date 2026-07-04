import { routeRequest } from "../services/routingEngine.js";

function statusCodeForRouteStatus(status) {
  switch (status) {
    case "SUCCESS":
      return 200;
    case "NO_VENDOR_AVAILABLE":
      return 404;
    case "TIMEOUT":
      return 504;
    case "FAILED":
    default:
      return 502;
  }
}

export async function routeVendorRequest(req, res, next) {
  try {
    const result = await routeRequest(req.body);
    const statusCode = statusCodeForRouteStatus(result.status);
    res.status(statusCode).json(result);
  } catch (error) {
    next(error);
  }
}
