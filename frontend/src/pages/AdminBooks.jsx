import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "General",
    description: "",
    totalCopies: 1,
  });

  const loadData = async () => {
    try {
      setError("");

      const [booksRes, issuesRes] = await Promise.all([
        api.get("/books"),
        api.get("/books/issues"),
      ]);

      setBooks(booksRes.data);
      setIssues(issuesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load admin data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addBook = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const res = await api.post("/books", {
        ...form,
        totalCopies: Number(form.totalCopies),
      });

      setMessage(res.data.message);

      setForm({
        title: "",
        author: "",
        category: "General",
        description: "",
        totalCopies: 1,
      });

      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add book");
    }
  };

  const deleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const res = await api.delete(`/books/${id}`);

      setMessage(res.data.message);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete book");
    }
  };

  const updateIssue = async (id, status) => {
    try {
      setError("");
      setMessage("");

      const res = await api.patch(`/books/issues/${id}`, { status });

      setMessage(res.data.message);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update request");
    }
  };

  const returnBook = async (id) => {
    try {
      setError("");
      setMessage("");

      const res = await api.patch(`/books/issues/${id}/return`);

      setMessage(res.data.message);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to return book");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: 11,
    borderRadius: 7,
    border: "1px solid #404040",
    background: "#171717",
    color: "white",
    boxSizing: "border-box",
    marginTop: 6,
  };

  const cardStyle = {
    background: "#171717",
    border: "1px solid #303030",
    borderRadius: 12,
    padding: 18,
    color: "#f5f5f5",
  };

  const buttonStyle = {
    padding: "9px 13px",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    margin: "4px 6px 4px 0",
    fontWeight: "bold",
  };

  return (
    <div style={{ padding: 24, color: "#f5f5f5" }}>
      <h1>📚 Manage Library Books</h1>

      {message && (
        <p style={{ color: "#34d399" }}>{message}</p>
      )}

      {error && (
        <p style={{ color: "#f87171" }}>{error}</p>
      )}

      <form
        onSubmit={addBook}
        style={{
          ...cardStyle,
          maxWidth: 600,
          marginTop: 22,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add New Book</h2>

        <label>
          Book Title
          <input
            style={inputStyle}
            required
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />
        </label>

        <label>
          Author
          <input
            style={inputStyle}
            required
            value={form.author}
            onChange={(e) =>
              setForm({ ...form, author: e.target.value })
            }
          />
        </label>

        <label>
          Category
          <input
            style={inputStyle}
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          />
        </label>

        <label>
          Description
          <textarea
            style={inputStyle}
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </label>

        <label>
          Total Copies
          <input
            style={inputStyle}
            type="number"
            min="1"
            required
            value={form.totalCopies}
            onChange={(e) =>
              setForm({ ...form, totalCopies: e.target.value })
            }
          />
        </label>

        <button
          type="submit"
          style={{
            ...buttonStyle,
            background: "#10b981",
            color: "#06130e",
            marginTop: 16,
          }}
        >
          Add Book
        </button>
      </form>

      <h2 style={{ marginTop: 35 }}>All Books</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 15,
        }}
      >
        {books.map((book) => (
          <div key={book._id} style={cardStyle}>
            <h3>{book.title}</h3>
            <p>Author: {book.author}</p>
            <p>Category: {book.category}</p>
            <p>
              Copies: {book.availableCopies} available / {book.totalCopies} total
            </p>

            <button
              onClick={() => deleteBook(book._id)}
              style={{
                ...buttonStyle,
                background: "#ef4444",
                color: "white",
              }}
            >
              Delete Book
            </button>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>Book Issue Requests</h2>

      {issues.length === 0 && (
        <p style={{ color: "#a3a3a3" }}>No book requests found.</p>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {issues.map((issue) => (
          <div key={issue._id} style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>
              {issue.book?.title || "Book unavailable"}
            </h3>

            <p>
              Student: {issue.student?.name || "Unknown"}
            </p>

            <p>
              Email: {issue.student?.email || "Not available"}
            </p>

            <p>
              Status: <strong>{issue.status.toUpperCase()}</strong>
            </p>

            {issue.dueDate && (
              <p>
                Due Date:{" "}
                {new Date(issue.dueDate).toLocaleDateString()}
              </p>
            )}

            {issue.status === "pending" && (
              <>
                <button
                  onClick={() => updateIssue(issue._id, "issued")}
                  style={{
                    ...buttonStyle,
                    background: "#10b981",
                    color: "#06130e",
                  }}
                >
                  Approve & Issue
                </button>

                <button
                  onClick={() => updateIssue(issue._id, "rejected")}
                  style={{
                    ...buttonStyle,
                    background: "#ef4444",
                    color: "white",
                  }}
                >
                  Reject
                </button>
              </>
            )}

            {issue.status === "issued" && (
              <button
                onClick={() => returnBook(issue._id)}
                style={{
                  ...buttonStyle,
                  background: "#fbbf24",
                  color: "#171717",
                }}
              >
                Mark as Returned
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}