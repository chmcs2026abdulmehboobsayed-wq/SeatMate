import express from "express";

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controller/notificationController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);

router.patch("/read-all", protect, markAllNotificationsRead);

router.patch("/:id/read", protect, markNotificationRead);

export default router;