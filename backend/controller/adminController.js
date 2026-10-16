import User from "../model/User.js";
import Table from "../model/Table.js";
import Reservation from "../model/Reservation.js";

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