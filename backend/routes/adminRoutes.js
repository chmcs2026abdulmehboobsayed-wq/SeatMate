import express from "express";

import {
  getAllUsers,
  getAllReservations,
  getDashboardStats,
  adminCancelReservation,
  getAllTables,
} from "../controller/adminController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all users
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

// Get all reservations
router.get(
  "/reservations",
  authMiddleware,
  adminMiddleware,
  getAllReservations
);

// Get dashboard statistics
router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);

// Admin cancels a reservation
router.patch(
  "/reservations/:reservationId/cancel",
  authMiddleware,
  adminMiddleware,
  adminCancelReservation
);

router.get(
  "/tables",
  authMiddleware,
  adminMiddleware,
  getAllTables
);

export default router;