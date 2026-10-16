import express from "express";

import {
  getAllUsers,
  getAllReservations,
  getDashboardStats,
} from "../controller/adminController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all users
router.get("/users", authMiddleware, getAllUsers);

// Get all reservations
router.get("/reservations", authMiddleware, getAllReservations);

// Get dashboard statistics
router.get("/dashboard", authMiddleware, getDashboardStats);
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.get(
  "/reservations",
  authMiddleware,
  adminMiddleware,
  getAllReservations
);

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);

export default router;