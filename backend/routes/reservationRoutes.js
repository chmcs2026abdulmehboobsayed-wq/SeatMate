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

router.post("/", createReservation);

router.get("/student/:studentId", getStudentReservations);
router.patch("/:reservationId/cancel", cancelReservation);
// Check-in
router.patch(
  "/:reservationId/check-in",
  authMiddleware,
  checkInReservation
);

// Check-out
router.patch(
  "/:reservationId/check-out",
  authMiddleware,
  checkOutReservation
);

export default router;