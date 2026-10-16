import Reservation from "../model/Reservation.js";
import Table from "../model/Table.js";

// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const { studentId, tableId, chairNumber, reservationDate } = req.body;

    if (!studentId || !tableId || !chairNumber || !reservationDate) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    const chair = table.chairs.find(
      (c) => c.chairNumber === Number(chairNumber)
    );

    if (!chair) {
      return res.status(404).json({
        message: "Chair not found",
      });
    }

    if (chair.status !== "available") {
      return res.status(409).json({
        message: "Chair is not available",
      });
    }

    const existingReservation = await Reservation.findOne({
      tableId,
      chairNumber: Number(chairNumber),
      reservationDate: new Date(reservationDate),
      status: "reserved",
    });

    if (existingReservation) {
      return res.status(409).json({
        message: "Chair is already reserved for this date and time",
      });
    }

    const reservation = await Reservation.create({
      studentId,
      tableId,
      chairNumber: Number(chairNumber),
      reservationDate: new Date(reservationDate),
    });

    chair.status = "reserved";
    await table.save();

    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create reservation",
      error: error.message,
    });
  }
};

// Get Student Reservations
export const getStudentReservations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const reservations = await Reservation.find({ studentId })
      .populate("tableId")
      .sort({ createdAt: -1 });

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reservations",
      error: error.message,
    });
  }
};
// Cancel Reservation
export const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);

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

    const table = await Table.findById(reservation.tableId);

    if (table) {
      const chair = table.chairs.find(
        (c) => c.chairNumber === reservation.chairNumber
      );

      if (chair) {
        chair.status = "available";
        await table.save();
      }
    }

    reservation.status = "cancelled";
    await reservation.save();

    res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    res.status(500).json({
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

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId: studentId,
      status: "reserved",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found or cannot check in",
      });
    }

    reservation.status = "checked-in";
    await reservation.save();

    res.status(200).json({
      message: "Check-in successful",
      reservation,
    });
  } catch (error) {
    res.status(500).json({
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

    const reservation = await Reservation.findOne({
      _id: reservationId,
      studentId: studentId,
      status: "checked-in",
    });

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found or check-in required first",
      });
    }

    reservation.status = "completed";
    await reservation.save();

    res.status(200).json({
      message: "Check-out successful",
      reservation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Check-out failed",
      error: error.message,
    });
  }
};