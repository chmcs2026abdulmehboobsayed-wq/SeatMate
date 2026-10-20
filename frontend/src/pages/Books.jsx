import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const CATEGORIES = [
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

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function Books() {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("browse");

  const [interests, setInterests] = useState(() =>
    readStorage("seatmateReadingInterests", [])
  );

  const [wishlist, setWishlist] = useState(() =>
    readStorage("seatmateBookWishlist", [])
  );

  const [reviews, setReviews] = useState(() =>
    readStorage("seatmateBookReviews", {})
  );

  const [reviewBook, setReviewBook] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setError("");

      const [booksRes, issuesRes] = await Promise.all([
        api.get("/books"),
        api.get("/books/my-issues"),
      ]);

      setBooks(
        Array.isArray(booksRes.data) ? booksRes.data : []
      );

      setIssues(
        Array.isArray(issuesRes.data) ? issuesRes.data : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load books."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "seatmateReadingInterests",
      JSON.stringify(interests)
    );
  }, [interests]);

  useEffect(() => {
    localStorage.setItem(
      "seatmateBookWishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(
      "seatmateBookReviews",
      JSON.stringify(reviews)
    );
  }, [reviews]);

  const requestBook = async (bookId) => {
    try {
      setMessage("");
      setError("");

      const res = await api.post("/books/request", { bookId });

      setMessage(res.data.message || "Book request submitted!");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Book request failed."
      );
    }
  };

  const requestedBookIds = issues
    .filter((issue) =>
      ["pending", "issued"].includes(issue.status)
    )
    .map((issue) => issue.book?._id)
    .filter(Boolean);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        books.map((book) => book.category || "General")
      ),
    ];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const text =
        `${book.title} ${book.author} ${book.category}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || book.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [books, search, category]);

  const recommendedBooks = useMemo(() => {
    if (interests.length === 0) return [];

    return books.filter((book) =>
      interests.some(
        (interest) =>
          (book.category || "General").toLowerCase() ===
          interest.toLowerCase()
      )
    );
  }, [books, interests]);

  const wishlistBooks = books.filter((book) =>
    wishlist.includes(book._id)
  );

  const toggleInterest = (interest) => {
    setInterests((previous) =>
      previous.includes(interest)
        ? previous.filter((item) => item !== interest)
        : [...previous, interest]
    );
  };

  const toggleWishlist = (bookId) => {
    setWishlist((previous) =>
      previous.includes(bookId)
        ? previous.filter((id) => id !== bookId)
        : [...previous, bookId]
    );

    setMessage(
      wishlist.includes(bookId)
        ? "Book removed from your wishlist."
        : "Book added to your wishlist."
    );
  };

  const submitReview = (event) => {
    event.preventDefault();

    if (!reviewBook) return;

    if (!reviewText.trim()) {
      setError("Please write a review before submitting.");
      return;
    }

    const bookId = reviewBook._id;

    setReviews((previous) => ({
      ...previous,
      [bookId]: {
        rating: Number(reviewRating),
        text: reviewText.trim(),
        date: new Date().toISOString(),
      },
    }));

    setReviewBook(null);
    setReviewRating(5);
    setReviewText("");
    setError("");
    setMessage("Your review has been saved in this browser.");
  };

  const cardStyle = {
    background: "#171717",
    border: "1px solid #303030",
    borderRadius: "14px",
    padding: "20px",
    color: "#f5f5f5",
  };

  const buttonStyle = {
    background: "#10b981",
    color: "#06130e",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const secondaryButtonStyle = {
    background: "#262626",
    color: "#f5f5f5",
    border: "1px solid #404040",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  };

  const tabStyle = (tab) => ({
    ...secondaryButtonStyle,
    background: activeTab === tab ? "#10b981" : "#262626",
    color: activeTab === tab ? "#06130e" : "#f5f5f5",
    borderColor: activeTab === tab ? "#10b981" : "#404040",
    fontWeight: "bold",
  });

  const bookCard = (book) => {
    const alreadyRequested = requestedBookIds.includes(book._id);
    const isWishlisted = wishlist.includes(book._id);

    return (
      <div key={book._id} style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 30 }}>📚</span>

          <button
            onClick={() => toggleWishlist(book._id)}
            style={{
              ...secondaryButtonStyle,
              padding: "6px 10px",
              height: "fit-content",
            }}
            title={
              isWishlisted
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
          >
            {isWishlisted ? "❤️ Saved" : "♡ Wishlist"}
          </button>
        </div>

        <h3>{book.title}</h3>

        <p style={{ color: "#a3a3a3" }}>
          Author: {book.author}
        </p>

        <p>
          Category: <strong>{book.category || "General"}</strong>
        </p>

        {book.description && (
          <p style={{ color: "#d4d4d4", lineHeight: 1.6 }}>
            {book.description}
          </p>
        )}

        <p>
          Available Copies:{" "}
          <strong>{book.availableCopies}</strong>
        </p>

        {reviews[book._id] && (
          <div
            style={{
              marginBottom: 12,
              color: "#fbbf24",
            }}
          >
            {"★".repeat(reviews[book._id].rating)}
            {"☆".repeat(5 - reviews[book._id].rating)}
            <p style={{ color: "#d4d4d4", marginBottom: 0 }}>
              {reviews[book._id].text}
            </p>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          {alreadyRequested ? (
            <button disabled style={{
              ...buttonStyle,
              background: "#404040",
              color: "#d4d4d4",
              cursor: "not-allowed",
            }}>
              Already Requested / Issued
            </button>
          ) : (
            <button
              disabled={book.availableCopies < 1}
              onClick={() => requestBook(book._id)}
              style={{
                ...buttonStyle,
                opacity: book.availableCopies < 1 ? 0.5 : 1,
              }}
            >
              {book.availableCopies < 1
                ? "Currently Unavailable"
                : "Request Book"}
            </button>
          )}

          <button
            style={secondaryButtonStyle}
            onClick={() => {
              setReviewBook(book);
              setReviewRating(reviews[book._id]?.rating || 5);
              setReviewText(reviews[book._id]?.text || "");
            }}
          >
            ⭐ Rate / Review
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 25, color: "white" }}>
        Loading Library & Reading Hub...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        color: "#f5f5f5",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>
        📚 Library & Reading Hub
      </h1>

      <p style={{ color: "#a3a3a3", marginBottom: 24 }}>
        Discover books, save your favourites and manage your book requests.
      </p>

      {message && (
        <div
          role="status"
          style={{
            padding: 12,
            background: "#064e3b",
            borderRadius: 8,
            marginBottom: 14,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            background: "#450a0a",
            color: "#fecaca",
            borderRadius: 8,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Library navigation */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 25,
        }}
      >
        <button
          style={tabStyle("browse")}
          onClick={() => setActiveTab("browse")}
        >
          📚 Browse Books
        </button>

        <button
          style={tabStyle("interests")}
          onClick={() => setActiveTab("interests")}
        >
          ❤️ Reading Interests
        </button>

        <button
          style={tabStyle("recommended")}
          onClick={() => setActiveTab("recommended")}
        >
          ✨ Recommended
        </button>

        <button
          style={tabStyle("wishlist")}
          onClick={() => setActiveTab("wishlist")}
        >
          🔖 Wishlist ({wishlist.length})
        </button>

        <button
          style={tabStyle("issues")}
          onClick={() => setActiveTab("issues")}
        >
          📋 My Issuance ({issues.length})
        </button>
      </div>

      {/* Browse books */}
      {activeTab === "browse" && (
        <section>
          <h2>Browse Books</h2>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              margin: "18px 0 25px",
            }}
          >
            <input
              type="text"
              placeholder="Search title, author or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{
                flex: "1 1 250px",
                maxWidth: 450,
                padding: 13,
                borderRadius: 8,
                border: "1px solid #404040",
                background: "#171717",
                color: "white",
                boxSizing: "border-box",
              }}
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid #404040",
                background: "#171717",
                color: "white",
              }}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Categories" : item}
                </option>
              ))}
            </select>
          </div>

          <p style={{ color: "#a3a3a3" }}>
            {filteredBooks.length} book(s) found
          </p>

          {filteredBooks.length === 0 ? (
            <p style={{ color: "#a3a3a3" }}>
              No books found. Try another search or category.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 18,
              }}
            >
              {filteredBooks.map(bookCard)}
            </div>
          )}
        </section>
      )}

      {/* Reading interests */}
      {activeTab === "interests" && (
        <section style={cardStyle}>
          <h2>❤️ My Reading Interests</h2>

          <p style={{ color: "#a3a3a3" }}>
            Select the categories you enjoy. Matching books will appear
            in Recommended Books.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 22,
            }}
          >
            {CATEGORIES.map((item) => {
              const selected = interests.includes(item);

              return (
                <button
                  key={item}
                  onClick={() => toggleInterest(item)}
                  aria-pressed={selected}
                  style={{
                    ...secondaryButtonStyle,
                    background: selected ? "#064e3b" : "#262626",
                    borderColor: selected ? "#10b981" : "#404040",
                    textAlign: "left",
                    padding: 15,
                  }}
                >
                  {selected ? "✅ " : "＋ "}
                  {item}
                </button>
              );
            })}
          </div>

          <p style={{ marginTop: 20 }}>
            Selected interests: <strong>{interests.length}</strong>
          </p>

          <button
            style={buttonStyle}
            onClick={() => {
              setActiveTab("recommended");
              setMessage("Your reading interests have been saved.");
            }}
          >
            View Recommended Books →
          </button>
        </section>
      )}

      {/* Recommendations */}
      {activeTab === "recommended" && (
        <section>
          <h2>✨ Recommended Books</h2>

          <p style={{ color: "#a3a3a3", marginBottom: 20 }}>
            Recommendations are based on your selected reading interests.
          </p>

          {interests.length === 0 ? (
            <div style={cardStyle}>
              <p>
                You haven't selected any reading interests yet.
              </p>

              <button
                style={buttonStyle}
                onClick={() => setActiveTab("interests")}
              >
                Select Interests
              </button>
            </div>
          ) : recommendedBooks.length === 0 ? (
            <div style={cardStyle}>
              <p>
                No matching books found for your selected categories.
              </p>

              <p style={{ color: "#a3a3a3" }}>
                Try selecting another category or ask the admin to add
                books in your preferred categories.
              </p>

              <button
                style={secondaryButtonStyle}
                onClick={() => setActiveTab("interests")}
              >
                Change Interests
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 18,
              }}
            >
              {recommendedBooks.map(bookCard)}
            </div>
          )}
        </section>
      )}

      {/* Wishlist */}
      {activeTab === "wishlist" && (
        <section>
          <h2>🔖 My Wishlist</h2>

          <p style={{ color: "#a3a3a3", marginBottom: 20 }}>
            Books you saved to read or request later.
          </p>

          {wishlistBooks.length === 0 ? (
            <div style={cardStyle}>
              <p>Your wishlist is empty.</p>

              <button
                style={buttonStyle}
                onClick={() => setActiveTab("browse")}
              >
                Browse Books
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 18,
              }}
            >
              {wishlistBooks.map(bookCard)}
            </div>
          )}
        </section>
      )}

      {/* Book issuance and history */}
      {activeTab === "issues" && (
        <section>
          <h2>📋 My Book Issuance</h2>

          <p style={{ color: "#a3a3a3", marginBottom: 20 }}>
            Track your requests, issued books, due dates and returns.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 22,
            }}
          >
            {[
              {
                label: "Pending",
                count: issues.filter((i) => i.status === "pending").length,
              },
              {
                label: "Issued",
                count: issues.filter((i) => i.status === "issued").length,
              },
              {
                label: "Rejected",
                count: issues.filter((i) => i.status === "rejected").length,
              },
              {
                label: "Returned",
                count: issues.filter((i) => i.status === "returned").length,
              },
            ].map((item) => (
              <div key={item.label} style={cardStyle}>
                <p style={{ color: "#a3a3a3", marginTop: 0 }}>
                  {item.label}
                </p>

                <h2 style={{ marginBottom: 0 }}>{item.count}</h2>
              </div>
            ))}
          </div>

          {issues.length === 0 ? (
            <div style={cardStyle}>
              <p>You have no book requests yet.</p>

              <button
                style={buttonStyle}
                onClick={() => setActiveTab("browse")}
              >
                Find a Book
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {issues.map((issue) => {
                const status = (issue.status || "pending").toLowerCase();

                const overdue =
                  status === "issued" &&
                  issue.dueDate &&
                  new Date(issue.dueDate) < new Date();

                const statusColor = overdue
                  ? "#f87171"
                  : status === "issued"
                  ? "#34d399"
                  : status === "rejected"
                  ? "#f87171"
                  : status === "returned"
                  ? "#60a5fa"
                  : "#fbbf24";

                return (
                  <div key={issue._id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <h3 style={{ marginTop: 0 }}>
                        {issue.book?.title || "Book unavailable"}
                      </h3>

                      <span
                        style={{
                          color: statusColor,
                          fontWeight: "bold",
                        }}
                      >
                        {overdue ? "OVERDUE" : status.toUpperCase()}
                      </span>
                    </div>

                    {issue.book?.author && (
                      <p style={{ color: "#a3a3a3" }}>
                        Author: {issue.book.author}
                      </p>
                    )}

                    <p>
                      Request Date:{" "}
                      {issue.requestDate
                        ? new Date(issue.requestDate).toLocaleDateString()
                        : "—"}
                    </p>

                    {issue.issueDate && (
                      <p>
                        Issue Date:{" "}
                        {new Date(issue.issueDate).toLocaleDateString()}
                      </p>
                    )}

                    {issue.dueDate && (
                      <p style={{ color: overdue ? "#f87171" : "#f5f5f5" }}>
                        Due Date:{" "}
                        {new Date(issue.dueDate).toLocaleDateString()}
                      </p>
                    )}

                    {issue.returnDate && (
                      <p>
                        Return Date:{" "}
                        {new Date(issue.returnDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Review editor */}
      {reviewBook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rate and review book"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <form
            onSubmit={submitReview}
            style={{
              ...cardStyle,
              width: "100%",
              maxWidth: 450,
            }}
          >
            <h2>⭐ Rate & Review</h2>

            <h3>{reviewBook.title}</h3>

            <label
              htmlFor="book-rating"
              style={{ display: "block", marginBottom: 8 }}
            >
              Rating
            </label>

            <select
              id="book-rating"
              value={reviewRating}
              onChange={(event) =>
                setReviewRating(Number(event.target.value))
              }
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 16,
                borderRadius: 8,
                background: "#262626",
                color: "white",
              }}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {"★".repeat(rating)} ({rating}/5)
                </option>
              ))}
            </select>

            <label
              htmlFor="book-review"
              style={{ display: "block", marginBottom: 8 }}
            >
              Your Review
            </label>

            <textarea
              id="book-review"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="What did you think of this book?"
              maxLength={1000}
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 12,
                borderRadius: 8,
                background: "#262626",
                color: "white",
                border: "1px solid #404040",
                marginBottom: 16,
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={buttonStyle}>
                Save Review
              </button>

              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => setReviewBook(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}