import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true
    },

    section: {
      type: String,
      enum: ["student", "teacher"],
      required: true
    },

    row: {
      type: Number,
      default: null
    },

    position: {
      type: Number,
      required: true
    },

    chairs: [
      {
        chairNumber: {
          type: Number,
          required: true
        },

        status: {
          type: String,
          enum: ["available", "reserved", "occupied"],
          default: "available"
        }
      }
    ]
  },
  { timestamps: true }
);

const Table = mongoose.model("Table", tableSchema);

export default Table;