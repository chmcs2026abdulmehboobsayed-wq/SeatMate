import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    totalCopies: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    // Student reviews and ratings
    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Average rating calculated from submitted reviews
bookSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) {
    return 0;
  }

  const total = this.reviews.reduce(
    (sum, review) => sum + review.rating,
    0
  );

  return Number((total / this.reviews.length).toFixed(1));
});

bookSchema.virtual("reviewCount").get(function () {
  return this.reviews?.length || 0;
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

export default mongoose.models.Book ||
  mongoose.model("Book", bookSchema);