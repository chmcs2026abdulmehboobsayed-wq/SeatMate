import Book from "../model/Book.js";
import BookIssue from "../model/BookIssue.js";
import User from "../model/user.js";

// Available reading categories
const ALLOWED_CATEGORIES = [
  "Fiction",
  "Technology",
  "Programming",
  "Science",
  "Self-Help",
  "Mystery",
  "Thriller",
  "Business",
  "Biography",
  "General",
];

// Get all books
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .select("-reviews")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add book - Admin
export const addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      description,
      totalCopies,
    } = req.body;

    const copies = Number(totalCopies);

    if (
      !title?.trim() ||
      !author?.trim() ||
      !Number.isInteger(copies) ||
      copies < 1
    ) {
      return res.status(400).json({
        message: "Title, author and a valid number of copies are required",
      });
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      category: category?.trim() || "General",
      description: description?.trim() || "",
      totalCopies: copies,
      availableCopies: copies,
    });

    res.status(201).json({
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete book - Admin
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const activeIssues = await BookIssue.findOne({
      book: book._id,
      status: { $in: ["pending", "issued"] },
    });

    if (activeIssues) {
      return res.status(400).json({
        message:
          "Cannot delete a book with pending requests or active issues",
      });
    }

    await book.deleteOne();

    // Remove deleted book from students' wishlists
    await User.updateMany(
      { bookWishlist: book._id },
      { $pull: { bookWishlist: book._id } }
    );

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student requests a book
export const requestBook = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        message: "Book ID is required",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const existingRequest = await BookIssue.findOne({
      book: bookId,
      student: studentId,
      status: { $in: ["pending", "issued"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          "You already have a pending request or issued copy of this book",
      });
    }

    if (book.availableCopies < 1) {
      return res.status(400).json({
        message: "This book is currently unavailable",
      });
    }

    const issue = await BookIssue.create({
      book: bookId,
      student: studentId,
    });

    res.status(201).json({
      message: "Book request submitted successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student views own requests and issued books
export const getMyBookIssues = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const issues = await BookIssue.find({
      student: studentId,
    })
      .populate("book")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin views all requests and issues
export const getAllBookIssues = async (req, res) => {
  try {
    const issues = await BookIssue.find()
      .populate("book")
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin approves or rejects a request
export const updateBookIssue = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["issued", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be issued or rejected",
      });
    }

    const issue = await BookIssue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Book request not found",
      });
    }

    if (issue.status !== "pending") {
      return res.status(400).json({
        message: "This request has already been processed",
      });
    }

    const book = await Book.findById(issue.book);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (status === "issued") {
      if (book.availableCopies < 1) {
        return res.status(400).json({
          message: "No copies are currently available",
        });
      }

      book.availableCopies -= 1;
      await book.save();

      const issueDate = new Date();
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);

      issue.issueDate = issueDate;
      issue.dueDate = dueDate;
    }

    issue.status = status;
    await issue.save();

    res.status(200).json({
      message:
        status === "issued"
          ? "Book issued successfully"
          : "Book request rejected",
      issue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin marks a book as returned
export const returnBook = async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Book issue not found",
      });
    }

    if (issue.status !== "issued") {
      return res.status(400).json({
        message: "Only issued books can be returned",
      });
    }

    const book = await Book.findById(issue.book);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.availableCopies = Math.min(
      book.totalCopies,
      book.availableCopies + 1
    );

    await book.save();

    issue.status = "returned";
    issue.returnDate = new Date();

    await issue.save();

    res.status(200).json({
      message: "Book returned successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save student reading interests
export const updateReadingInterests = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        message: "Interests must be an array",
      });
    }

    const cleanInterests = [
      ...new Set(
        interests
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) =>
            ALLOWED_CATEGORIES.some(
              (category) =>
                category.toLowerCase() === item.toLowerCase()
            )
          )
          .map((item) =>
            ALLOWED_CATEGORIES.find(
              (category) =>
                category.toLowerCase() === item.toLowerCase()
            )
          )
      ),
    ];

    const user = await User.findByIdAndUpdate(
      studentId,
      { $set: { readingInterests: cleanInterests } },
      { new: true, runValidators: true }
    ).select("readingInterests");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Reading interests saved successfully",
      interests: user.readingInterests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's reading interests
export const getReadingInterests = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const user = await User.findById(studentId).select(
      "readingInterests"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.readingInterests || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recommendations based on interests
export const getRecommendedBooks = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const user = await User.findById(studentId).select(
      "readingInterests"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const interests = user.readingInterests || [];

    let books;

    if (interests.length > 0) {
      books = await Book.find({
        category: { $in: interests },
      })
        .select("-reviews")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      books = await Book.find()
        .select("-reviews")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    res.status(200).json({
      interests,
      books,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's wishlist
export const getWishlist = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const user = await User.findById(studentId)
      .populate({
        path: "bookWishlist",
        select: "-reviews",
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.bookWishlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add or remove a book from wishlist
export const toggleWishlist = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const { bookId } = req.body;

    if (!bookId || !mongooseIsValidId(bookId)) {
      return res.status(400).json({
        message: "A valid book ID is required",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = await User.findById(studentId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadySaved = user.bookWishlist.some(
      (id) => id.toString() === bookId
    );

    if (alreadySaved) {
      user.bookWishlist.pull(bookId);
    } else {
      user.bookWishlist.addToSet(bookId);
    }

    await user.save();

    res.status(200).json({
      message: alreadySaved
        ? "Book removed from wishlist"
        : "Book added to wishlist",
      wishlisted: !alreadySaved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ratings and reviews for a book
export const getBookReviews = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("reviews.student", "name");

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const reviews = book.reviews.map((review) => ({
      _id: review._id,
      student: review.student,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    const averageRating =
      reviews.length === 0
        ? 0
        : Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            ).toFixed(1)
          );

    res.status(200).json({
      averageRating,
      reviewCount: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add or update a review
export const addBookReview = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const { rating, comment = "" } = req.body;
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    if (typeof comment !== "string" || comment.length > 1000) {
      return res.status(400).json({
        message: "Review must be a text of at most 1000 characters",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const existingReview = book.reviews.find(
      (review) => review.student.toString() === studentId.toString()
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment.trim();
    } else {
      book.reviews.push({
        student: studentId,
        rating: numericRating,
        comment: comment.trim(),
      });
    }

    await book.save();

    res.status(200).json({
      message: "Review saved successfully",
      averageRating:
        book.reviews.length === 0
          ? 0
          : Number(
              (
                book.reviews.reduce(
                  (sum, review) => sum + review.rating,
                  0
                ) / book.reviews.length
              ).toFixed(1)
            ),
      reviewCount: book.reviews.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check MongoDB ObjectId
function mongooseIsValidId(id) {
  return /^[a-f\d]{24}$/i.test(String(id));
}
