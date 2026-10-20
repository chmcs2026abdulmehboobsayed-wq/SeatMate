import express from "express";

import {
  createReservation,
  getStudentReservations,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  getSlotAvailability,
  extendReservation,
  verifyBookingQR,
} from "../controller/reservationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Check availability for a selected slot
router.get("/availability", authMiddleware, getSlotAvailability);

// Create reservation
router.post("/", authMiddleware, createReservation);

// Student reservations
router.get("/student/:studentId", authMiddleware, getStudentReservations);

// Cancel reservation
router.patch("/:reservationId/cancel", authMiddleware, cancelReservation);

// Check-in
router.patch("/:reservationId/checkin", authMiddleware, checkInReservation);

// Check-out
router.patch("/:reservationId/checkout", authMiddleware, checkOutReservation);

router.patch("/:reservationId/extend", authMiddleware, extendReservation);

router.post("/verify-qr", authMiddleware, verifyBookingQR);

export default router;