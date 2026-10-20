import mongoose from "mongoose";
import Reservation from "../model/Reservation.js";
import Table from "../model/Table.js";
import QRCode from "qrcode";
import Notification from "../model/Notification.js";

const LIBRARY_OPEN_HOUR = 10;
const LIBRARY_CLOSE_HOUR = 17;
const MAX_ADVANCE_DAYS = 7;

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isValidLibrarySlot = (date) => {
  // Sunday holiday
  if (date.getDay() === 0) {
    return false;
  }

  // Only hourly slots from 10 AM to 5 PM
  if (
    date.getHours() < LIBRARY_OPEN_HOUR ||
    date.getHours() >= LIBRARY_CLOSE_HOUR ||
    date.getMinutes() !== 0 ||
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0
  ) {
    return false;
  }

  return true;
};

const isWithinAdvanceWindow = (date) => {
  const now = new Date();
  const today = getLocalDateString(now);
  const selectedDay = getLocalDateString(date);

  const maximumDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + MAX_ADVANCE_DAYS
  );

  return selectedDay >= today &&
    selectedDay <= getLocalDateString(maximumDate);
};
// Create Reservation
// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const { tableId, chairNumber, reservationDate } = req.body;
    const studentId = req.user.id || req.user._id;

    if (!tableId || !chairNumber || !reservationDate) {
      return res.status(400).json({
        message: "Table, chair and reservation date are required",
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
        message: "Please select a future time slot",
      });
    }

    if (!isValidLibrarySlot(date)) {
      return res.status(400).json({
        message: "Library is open Monday to Saturday, 10 AM to 5 PM",
      });
    }

    if (!isWithinAdvanceWindow(date)) {
      return res.status(400).json({
        message: "Reservations can only be made up to 7 days in advance",
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    const chair = table.chairs.find(
      (c) => Number(c.chairNumber) === number
    );

    if (!chair) {
      return res.status(404).json({
        message: "Chair not found",
      });
    }

    if (String(chair.status || "available").toLowerCase() !== "available") {
      return res.status(409).json({
        message: "This chair is not available",
      });
    }

    const reservationEnd = new Date(
      date.getTime() + 60 * 60 * 1000
    );

    // Check the exact slot again on the backend.
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

    const bookingId = `SM-${new mongoose.Types.ObjectId()
      .toString()
      .slice(-8)
      .toUpperCase()}`;

    const reservation = await Reservation.create({
      bookingId,
      studentId,
      tableId,
      chairNumber: number,
      reservationDate: date,
      reservationEnd,
    });

    try {
      const qrData = JSON.stringify({
        bookingId: reservation.bookingId,
        reservationId: reservation._id.toString(),
        studentId: String(studentId),
        tableId: String(tableId),
        chairNumber: number,
        reservationDate: date.toISOString(),
        reservationEnd: reservationEnd.toISOString(),
      });

      reservation.qrCode = await QRCode.toDataURL(qrData);
      await reservation.save();
    } catch (qrError) {
      await Reservation.findByIdAndDelete(reservation._id);
      throw qrError;
    }
    // Create booking confirmation notification
try {
  await Notification.create({
    recipient: studentId,
    title: "Booking Confirmed! 🎉",
    message: `Your booking ${reservation.bookingId} is confirmed. Chair ${number} has been reserved successfully.`,
    type: "booking_confirmation",
    relatedId: reservation._id,
  });
} catch (notificationError) {
  console.error(
    "Booking notification error:",
    notificationError
  );
}

    return res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This seat is already reserved for that date and time",
      });
    }

    console.error("Reservation error:", error);

    return res.status(500).json({
      message: "Failed to create reservation",
      error: error.message,
    });
  }
};
// Get reserved chairs for a particular date and time slot
export const getSlotAvailability = async (req, res) => {
  try {
    const { reservationDate } = req.query;

    if (!reservationDate) {
      return res.status(400).json({
        message: "Reservation date is required",
      });
    }

    const date = new Date(reservationDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        message: "Invalid reservation date",
      });
    }

    if (!isValidLibrarySlot(date)) {
      return res.status(400).json({
        message: "Invalid slot. Library hours are 10 AM to 5 PM, Monday to Saturday",
      });
    }

    const reservations = await Reservation.find({
      reservationDate: date,
      status: { $in: ["reserved", "checked-in"] },
    }).select("tableId chairNumber");

    return res.status(200).json({
      reservationDate: date.toISOString(),
      reservedSeats: reservations.map((reservation) => ({
        tableId: String(reservation.tableId),
        chairNumber: reservation.chairNumber,
      })),
    });
  } catch (error) {
    console.error("Availability error:", error);

    return res.status(500).json({
      message: "Failed to fetch slot availability",
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
// Extend Reservation by 1 Hour
export const extendReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const studentId = req.user.id || req.user._id;

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    // Find the student's active checked-in booking
    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId,
      status: "checked-in",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Active checked-in reservation not found",
      });
    }

    const currentEnd = new Date(reservation.reservationEnd);
    const nextEnd = new Date(
      currentEnd.getTime() + 60 * 60 * 1000
    );

    // Library closes at 5 PM
    if (
      currentEnd.getHours() < LIBRARY_OPEN_HOUR ||
      nextEnd.getHours() > LIBRARY_CLOSE_HOUR ||
      (nextEnd.getHours() === LIBRARY_CLOSE_HOUR &&
        (nextEnd.getMinutes() !== 0 ||
          nextEnd.getSeconds() !== 0))
    ) {
      return res.status(400).json({
        message: "Cannot extend beyond library closing time (5 PM)",
      });
    }

    // Do not extend on Sunday
    if (
      currentEnd.getDay() === 0 ||
      nextEnd.getDay() === 0
    ) {
      return res.status(400).json({
        message: "Library is closed on Sunday",
      });
    }

    // Check whether the same chair is occupied during the next hour
    const conflictingReservation = await Reservation.findOne({
      _id: { $ne: reservation._id },
      tableId: reservation.tableId,
      chairNumber: reservation.chairNumber,
      status: { $in: ["reserved", "checked-in"] },
      reservationDate: { $lt: nextEnd },
      reservationEnd: { $gt: currentEnd },
    });

    if (conflictingReservation) {
      return res.status(409).json({
        message: "The next hour is already booked. Extension unavailable.",
      });
    }

    // Update the end time
    reservation.reservationEnd = nextEnd;

    // Refresh QR code with the updated end time
    const qrData = JSON.stringify({
      bookingId: reservation.bookingId,
      reservationId: reservation._id.toString(),
      studentId: String(reservation.studentId),
      tableId: String(reservation.tableId),
      chairNumber: reservation.chairNumber,
      reservationDate: reservation.reservationDate.toISOString(),
      reservationEnd: nextEnd.toISOString(),
    });

    reservation.qrCode = await QRCode.toDataURL(qrData);

    await reservation.save();

    return res.status(200).json({
      message: "Booking extended by 1 hour successfully",
      reservation,
    });
  } catch (error) {
    console.error("Extension error:", error);

    return res.status(500).json({
      message: "Failed to extend booking",
      error: error.message,
    });
  }
};
// Admin QR Booking Verification
export const verifyBookingQR = async (req, res) => {
  try {
    // Only admins can verify bookings
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { bookingId } = req.body;

    if (!bookingId || typeof bookingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required.",
      });
    }

    const reservation = await Reservation.findOne({
      bookingId: bookingId.trim(),
    })
      .populate("studentId", "name email")
      .populate("tableId", "tableNumber");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Invalid booking. Reservation not found.",
      });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        success: true,
        valid: false,
        message: "This booking has been cancelled.",
      });
    }

    if (reservation.status === "completed") {
      return res.status(400).json({
        success: true,
        valid: false,
        message: "This booking has already been completed.",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: "Booking verified successfully.",
      booking: {
        bookingId: reservation.bookingId,
        studentName: reservation.studentId?.name || "Unknown",
        studentEmail: reservation.studentId?.email || "",
        tableNumber: reservation.tableId?.tableNumber || "—",
        chairNumber: reservation.chairNumber,
        reservationDate: reservation.reservationDate,
        reservationEnd: reservation.reservationEnd,
        status: reservation.status,
      },
    });
  } catch (error) {
    console.error("QR verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify booking.",
    });
  }
};