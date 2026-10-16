import express from "express";
import authMiddleware from "../controller/authMiddleware.js";
import { getProfile } from "../controller/profileController.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);

export default router;