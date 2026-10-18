import mongoose from "mongoose";
import Reservation from "../model/Reservation.js";
import Table from "../model/Table.js";

// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const { tableId, chairNumber, reservationDate } = req.body;
    const studentId = req.user.id || req.user._id;

    if (!tableId || !chairNumber || !reservationDate) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (!mongoose.isValidObjectId(tableId)) {
      return res.status(400).json({
        message: "Invalid table ID",
      });
    }

    const number = Number(chairNumber);

    if (!Number.isInteger(number) || number <= 0) {
      return res.status(400).json({
        message: "Invalid chair number",
      });
    }

    const date = new Date(reservationDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid reservation date",
      });
    }

    if (date <= new Date()) {
      return res.status(400).json({
        message: "Reservation date must be in the future",
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    const chair = table.chairs.find(
      (c) => c.chairNumber === number
    );

    if (!chair) {
      return res.status(404).json({
        message: "Chair not found",
      });
    }

    const existingReservation = await Reservation.findOne({
      tableId,
      chairNumber: number,
      reservationDate: date,
      status: { $in: ["reserved", "checked-in"] },
    });

    if (existingReservation) {
      return res.status(409).json({
        message: "Chair is already reserved for this date and time",
      });
    }

    const reservation = await Reservation.create({
      studentId,
      tableId,
      chairNumber: number,
      reservationDate: date,
    });

    return res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create reservation",
      error: error.message,
    });
  }
};

// Get Student Reservations
export const getStudentReservations = async (req, res) => {
  try {
    const { studentId } = req.params;
    const loggedInStudentId = req.user.id || req.user._id;

    if (studentId !== String(loggedInStudentId)) {
      return res.status(403).json({
        message: "You can only view your own reservations",
      });
    }

    const reservations = await Reservation.find({
      studentId: loggedInStudentId,
    })
      .populate("tableId")
      .sort({ createdAt: -1 });

    return res.status(200).json(reservations);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};

// Cancel Reservation
export const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const studentId = req.user.id || req.user._id;

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId,
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (reservation.status !== "reserved") {
      return res.status(400).json({
        message: "Reservation is already cancelled or completed",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel reservation",
      error: error.message,
    });
  }
};

// Student Check-in
export const checkInReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const studentId = req.user.id || req.user._id;

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId,
      status: "reserved",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found or cannot check in",
      });
    }

    reservation.status = "checked-in";
    await reservation.save();

    return res.status(200).json({
      message: "Check-in successful",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Check-in failed",
      error: error.message,
    });
  }
};

// Student Check-out
export const checkOutReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const studentId = req.user.id || req.user._id;

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId,
      status: "checked-in",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found or check-in required first",
      });
    }

    reservation.status = "completed";
    await reservation.save();

    return res.status(200).json({
      message: "Check-out successful",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Check-out failed",
      error: error.message,
    });
  }
};