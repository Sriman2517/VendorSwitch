import express from "express";
import { routeVendorRequest } from "../controllers/routeController.js";

const router = express.Router();

router.post("/", routeVendorRequest);

export default router;
