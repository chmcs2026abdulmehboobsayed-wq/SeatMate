import express from "express";
import {
    register,
    login,
    updateProfile
} from "../controller/authController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Update logged-in user's profile
router.patch("/profile", protect, updateProfile);

export default router;