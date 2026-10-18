import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createReservation,
  getStudentReservations,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
} from "../controller/reservationController.js";

const router = express.Router();

// Create reservation - login required
router.post("/", authMiddleware, createReservation);

// Get student reservations - login required
router.get("/student/:studentId", authMiddleware, getStudentReservations);

// Cancel reservation - login required
router.patch("/:reservationId/cancel", authMiddleware, cancelReservation);

// Check-in - login required
router.patch("/:reservationId/check-in", authMiddleware, checkInReservation);

// Check-out - login required
router.patch("/:reservationId/check-out", authMiddleware, checkOutReservation);

export default router;