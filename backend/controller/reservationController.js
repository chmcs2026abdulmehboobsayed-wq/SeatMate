import mongoose from "mongoose";
import Reservation from "../model/Reservation.js";
import Table from "../model/Table.js";
import QRCode from "qrcode";
import Notification from "../model/Notification.js";

const LIBRARY_OPEN_HOUR = 10;
const LIBRARY_CLOSE_HOUR = 17;
const MAX_ADVANCE_DAYS = 7;

const ACTIVE_STATUSES = ["reserved", "checked-in"];
const ONE_HOUR = 60 * 60 * 1000;

// Get local date in YYYY-MM-DD format
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Get logged-in user's ID
const getUserId = (req) => req.user.id || req.user._id;

// Check whether role is valid for student/teacher booking
const isBookingRole = (role) => ["student", "teacher"].includes(role);

// Validate library slot
// Validate library slot using India timezone
const LIBRARY_TIME_ZONE = "Asia/Kolkata";

const isValidLibrarySlot = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LIBRARY_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  // Library is closed on Sunday
  if (values.weekday === "Sun") {
    return false;
  }

  const hour = Number(values.hour);

  // Valid booking slots: 10 AM to 4 PM
  // Each booking is for one hour, ending by 5 PM
  return (
    hour >= LIBRARY_OPEN_HOUR &&
    hour < LIBRARY_CLOSE_HOUR &&
    Number(values.minute) === 0 &&
    Number(values.second) === 0 &&
    date.getUTCMilliseconds() === 0
  );
};
// Check advance booking window
const isWithinAdvanceWindow = (date) => {
  const now = new Date();

  const today = getLocalDateString(now);
  const selectedDay = getLocalDateString(date);

  const maximumDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + MAX_ADVANCE_DAYS
  );

  return (
    selectedDay >= today &&
    selectedDay <= getLocalDateString(maximumDate)
  );
};

// Find overlapping active reservations for a chair
const findConflictingReservation = ({
  tableId,
  chairNumber,
  start,
  end,
  excludeReservationId,
}) => {
  const query = {
    tableId,
    chairNumber: Number(chairNumber),
    status: { $in: ACTIVE_STATUSES },
    reservationDate: { $lt: end },
    reservationEnd: { $gt: start },
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  return Reservation.findOne(query);
};

// =====================================================
// CREATE RESERVATION - STUDENT AND TEACHER
// =====================================================

export const createReservation = async (req, res) => {
  try {
    const { tableId, chairNumber, reservationDate } = req.body;

    const userId = getUserId(req);
    const userRole = req.user.role;

    if (!isBookingRole(userRole)) {
      return res.status(403).json({
        message: "Only students and teachers can book seats",
      });
    }

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
        message:
          "Library is open Monday to Saturday, 10 AM to 5 PM",
      });
    }

    if (!isWithinAdvanceWindow(date)) {
      return res.status(400).json({
        message:
          "Reservations can only be made up to 7 days in advance",
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    // Students can book student tables; teachers can book teacher tables.
    if (table.section !== userRole) {
      return res.status(403).json({
        message: "You cannot book seats in this section",
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

    if (
      String(chair.status || "available").toLowerCase() ===
      "occupied"
    ) {
      return res.status(409).json({
        message: "This chair is currently unavailable",
      });
    }

    const reservationEnd = new Date(date.getTime() + ONE_HOUR);

    const existingReservation = await findConflictingReservation({
      tableId: table._id,
      chairNumber: number,
      start: date,
      end: reservationEnd,
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
      studentId: userId,
      tableId: table._id,
      chairNumber: number,
      reservationDate: date,
      reservationEnd,
    });

    // Generate QR code
    try {
      const qrData = JSON.stringify({
        bookingId: reservation.bookingId,
        reservationId: reservation._id.toString(),
        studentId: String(userId),
        tableId: String(table._id),
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

    // Booking confirmation notification
    try {
      await Notification.create({
        recipient: userId,
        title: "Booking Confirmed! 🎉",
        message: `Your booking ${reservation.bookingId} is confirmed. Chair ${number} has been reserved successfully.`,
        type: "booking_confirmation",
        relatedId: reservation._id,
      });
    } catch (notificationError) {
      console.error("Booking notification error:", notificationError);
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

// =====================================================
// GET SLOT AVAILABILITY - ROLE-BASED
// =====================================================

export const getSlotAvailability = async (req, res) => {
  try {
    const { reservationDate } = req.query;
    const userRole = req.user.role;

    if (!isBookingRole(userRole)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

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
        message:
          "Invalid slot. Library hours are 10 AM to 5 PM, Monday to Saturday",
      });
    }

    const slotEnd = new Date(date.getTime() + ONE_HOUR);

    const allowedTables = await Table.find({
      section: userRole,
    }).select("_id");

    const allowedTableIds = allowedTables.map((table) => table._id);

    const reservations = await Reservation.find({
      tableId: { $in: allowedTableIds },
      reservationDate: { $lt: slotEnd },
      reservationEnd: { $gt: date },
      status: { $in: ACTIVE_STATUSES },
    }).select("tableId chairNumber");

    return res.status(200).json({
      reservationDate: date.toISOString(),
      reservedSeats: reservations.map((reservation) => ({
        tableId: String(reservation.tableId),
        chairNumber: Number(reservation.chairNumber),
      })),
    });
  } catch (error) {
    console.error("Availability error:", error);

    return res.status(500).json({
      message: "Failed to fetch slot availability",
    });
  }
};

// =====================================================
// GET MY RESERVATIONS - STUDENT AND TEACHER
// Existing route: GET /student/:studentId
// =====================================================

export const getStudentReservations = async (req, res) => {
  try {
    const { studentId } = req.params;
    const loggedInUserId = getUserId(req);

    if (!isBookingRole(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Users can only view their own bookings.
    if (String(studentId) !== String(loggedInUserId)) {
      return res.status(403).json({
        message: "You can only view your own reservations",
      });
    }

    const reservations = await Reservation.find({
      studentId: loggedInUserId,
    })
      .populate("tableId")
      .sort({ createdAt: -1 });

    return res.status(200).json(reservations);
  } catch (error) {
    console.error("Fetch reservations error:", error);

    return res.status(500).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL RESERVATION - STUDENT AND TEACHER
// =====================================================

export const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserId(req);

    if (!isBookingRole(req.user.role)) {
      return res.status(403).json({
        message: "Only students and teachers can cancel bookings",
      });
    }

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId: userId,
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (reservation.status !== "reserved") {
      return res.status(400).json({
        message: "Only reserved bookings can be cancelled",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    console.error("Cancellation error:", error);

    return res.status(500).json({
      message: "Failed to cancel reservation",
      error: error.message,
    });
  }
};

// =====================================================
// CHECK-IN
// =====================================================

export const checkInReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserId(req);

    if (!isBookingRole(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId: userId,
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
    console.error("Check-in error:", error);

    return res.status(500).json({
      message: "Check-in failed",
      error: error.message,
    });
  }
};

// =====================================================
// CHECK-OUT
// =====================================================

export const checkOutReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserId(req);

    if (!isBookingRole(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId: userId,
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
    console.error("Check-out error:", error);

    return res.status(500).json({
      message: "Check-out failed",
      error: error.message,
    });
  }
};

// =====================================================
// EXTEND RESERVATION BY ONE HOUR
// =====================================================

export const extendReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserId(req);

    if (!isBookingRole(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (!mongoose.isValidObjectId(reservationId)) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId: userId,
      status: "checked-in",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Active checked-in reservation not found",
      });
    }

    const currentEnd = new Date(reservation.reservationEnd);
    const nextEnd = new Date(currentEnd.getTime() + ONE_HOUR);

    if (
      currentEnd.getHours() < LIBRARY_OPEN_HOUR ||
      nextEnd.getHours() > LIBRARY_CLOSE_HOUR ||
      (nextEnd.getHours() === LIBRARY_CLOSE_HOUR &&
        (nextEnd.getMinutes() !== 0 ||
          nextEnd.getSeconds() !== 0 ||
          nextEnd.getMilliseconds() !== 0))
    ) {
      return res.status(400).json({
        message: "Cannot extend beyond library closing time (5 PM)",
      });
    }

    if (
      currentEnd.getDay() === 0 ||
      nextEnd.getDay() === 0
    ) {
      return res.status(400).json({
        message: "Library is closed on Sunday",
      });
    }

    const conflictingReservation = await findConflictingReservation({
      tableId: reservation.tableId,
      chairNumber: reservation.chairNumber,
      start: currentEnd,
      end: nextEnd,
      excludeReservationId: reservation._id,
    });

    if (conflictingReservation) {
      return res.status(409).json({
        message: "The next hour is already booked. Extension unavailable.",
      });
    }

    reservation.reservationEnd = nextEnd;

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

// =====================================================
// ADMIN QR BOOKING VERIFICATION
// =====================================================

export const verifyBookingQR = async (req, res) => {
  try {
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
