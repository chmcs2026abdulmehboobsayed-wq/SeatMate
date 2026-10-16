import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

import {
    getTables,
    addTable,
    updateTable
} from "../controller/tableController.js";

const router = express.Router();

router.get("/", getTables);
router.post("/", authMiddleware, adminMiddleware, addTable);
router.put("/:id", authMiddleware, adminMiddleware, updateTable);


export default router;