import Table from "../model/Table.js";

// GET ALL TABLES
export const getTables = async (req, res) => {
    try {
        const tables = await Table.find().sort({
            row: 1,
            position: 1
        });

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