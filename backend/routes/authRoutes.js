import express from "express";
import {
    register,
    login
} from "../controller/authController.js";

const router = express.Router();

// Register student
router.post("/register", register);

// Login student
router.post("/login", login);

export default router;