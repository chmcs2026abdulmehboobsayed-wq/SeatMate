import User from "../model/user.js";
import Table from "../model/Table.js";
import Reservation from "../model/Reservation.js";
import mongoose from "mongoose";

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Get All Reservations
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("studentId", "name email")
      .populate("tableId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      totalReservations: reservations.length,
      reservations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};

// Get Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTables = await Table.countDocuments();
    const totalReservations = await Reservation.countDocuments();

    const activeReservations = await Reservation.countDocuments({
      status: { $in: ["reserved", "checked-in"] },
    });

    res.status(200).json({
      totalUsers,
      totalTables,
      totalReservations,
      activeReservations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};
// Admin Cancel Reservation
export const adminCancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (!["reserved", "checked-in"].includes(reservation.status)) {
      return res.status(400).json({
        message: "This reservation cannot be cancelled",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    return res.status(200).json({
      message: "Reservation cancelled successfully by admin",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel reservation",
      error: error.message,
    });
  }
};
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({
      section: 1,
      row: 1,
      position: 1
    });

    return res.status(200).json({
      totalTables: tables.length,
      tables
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tables",
      error: error.message
    });
  }
};
