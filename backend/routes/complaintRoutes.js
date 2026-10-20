import express from "express";

import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint,
} from "../controller/complaintController.js";

import protect from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Student routes
router.post("/", protect, createComplaint);
router.get("/my", protect, getMyComplaints);

// Admin-only routes
router.get("/", protect, adminMiddleware, getAllComplaints);
router.patch("/:id", protect, adminMiddleware, updateComplaint);

export default router;