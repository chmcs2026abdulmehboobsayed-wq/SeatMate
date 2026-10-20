import express from "express";

import {
  getBooks,
  addBook,
  deleteBook,
  requestBook,
  getMyBookIssues,
  getAllBookIssues,
  updateBookIssue,
  returnBook,
  updateReadingInterests,
  getReadingInterests,
  getRecommendedBooks,
  getWishlist,
  toggleWishlist,
  getBookReviews,
  addBookReview,
} from "../controller/bookController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Admin access required",
  });
}

// Books
router.get("/", protect, getBooks);
router.post("/", protect, adminOnly, addBook);
router.delete("/:id", protect, adminOnly, deleteBook);

// Book issuance
router.post("/request", protect, requestBook);
router.get("/my-issues", protect, getMyBookIssues);
router.get("/issues", protect, adminOnly, getAllBookIssues);
router.patch("/issues/:id", protect, adminOnly, updateBookIssue);
router.patch("/issues/:id/return", protect, adminOnly, returnBook);

// Reading interests
router.get("/interests", protect, getReadingInterests);
router.put("/interests", protect, updateReadingInterests);

// Recommendations
router.get("/recommended", protect, getRecommendedBooks);

// Wishlist
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/toggle", protect, toggleWishlist);

// Ratings and reviews
router.get("/:id/reviews", protect, getBookReviews);
router.post("/:id/reviews", protect, addBookReview);

export default router;