import Table from "../model/Table.js";
import Reservation from "../model/Reservation.js";

// GET ALL TABLES
// GET ALL TABLES WITH DATE-WISE AVAILABILITY
export const getTables = async (req, res) => {
    try {
        const { date } = req.query;

        const tables = await Table.find().sort({
            row: 1,
            position: 1
        }).lean();

        // If no date is provided, return tables as usual
        if (!date) {
            return res.status(200).json({
                success: true,
                count: tables.length,
                tables
            });
        }

        const reservationDate = new Date(date);

        if (isNaN(reservationDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid reservation date"
            });
        }

        const reservations = await Reservation.find({
            reservationDate,
            status: { $in: ["reserved", "checked-in"] }
        }).select("tableId chairNumber");

        for (const table of tables) {
            for (const chair of table.chairs) {
                const isBooked = reservations.some(reservation =>
                    reservation.tableId.toString() === table._id.toString() &&
                    reservation.chairNumber === chair.chairNumber
                );

                chair.status = isBooked ? "reserved" : "available";
            }
        }

        return res.status(200).json({
            success: true,
            count: tables.length,
            tables
        });

    } catch (error) {
        console.error("Get tables error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch tables"
        });
    }
};

// ADD TABLE
export const addTable = async (req, res) => {
    try {
        const {
            tableNumber,
            chairs,
            section,
            row,
            position
        } = req.body;

        if (
            tableNumber == null ||
            !Number.isInteger(tableNumber) ||
            tableNumber < 1 ||
            !Array.isArray(chairs) ||
            chairs.length === 0 ||
            row == null ||
            position == null
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid table number, chairs, row and position are required"
            });
        }

        const existingTable = await Table.findOne({ tableNumber });

        if (existingTable) {
            return res.status(409).json({
                success: false,
                message: "Table number already exists"
            });
        }

        const chairNumbers = chairs.map(chair => chair.chairNumber);

        if (
            chairNumbers.some(number =>
                !Number.isInteger(number) || number < 1
            ) ||
            new Set(chairNumbers).size !== chairNumbers.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Chair numbers must be unique positive integers"
            });
        }

        const table = await Table.create({
            tableNumber,
            chairs: chairs.map(chair => ({
                chairNumber: chair.chairNumber,
                status: "available"
            })),
            section: section || "student",
            row,
            position
        });

        return res.status(201).json({
            success: true,
            message: "Table added successfully",
            table
        });

    } catch (error) {
        console.error("Add table error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add table",
            error: error.message
        });
    }
};
// Update Table
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { section, row, position, chairs } = req.body;

    const table = await Table.findById(id);

    if (!table) {
      return res.status(404).json({
        message: "Table not found",
      });
    }

    if (section !== undefined) table.section = section;
    if (row !== undefined) table.row = row;
    if (position !== undefined) table.position = position;
    if (chairs !== undefined) table.chairs = chairs;

    await table.save();

    res.status(200).json({
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update table",
      error: error.message,
    });
  }
};