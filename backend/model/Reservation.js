import mongoose from "mongoose";



const reservationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    chairNumber: {
      type: Number,
      required: true,
    },

    reservationDate: {
      type: Date,
      required: true,
    },

   status: {
  type: String,
  enum: ["reserved", "checked-in", "completed", "cancelled"],
  default: "reserved",
},
  },
  { timestamps: true }
);

reservationSchema.index(
  { tableId: 1, chairNumber: 1, reservationDate: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["reserved", "checked-in"] }
    }
  }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;