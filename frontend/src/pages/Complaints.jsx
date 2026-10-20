import { useEffect, useState } from "react";
import api from "../api/axios";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px 16px",
    background: "#080b0a",
    color: "#f5f5f5",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  heading: {
    color: "#10b981",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#a1a1aa",
    marginBottom: "28px",
  },
  panel: {
    background: "#111715",
    border: "1px solid #26352e",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginTop: "16px",
    marginBottom: "8px",
    color: "#d4d4d8",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px",
    boxSizing: "border-box",
    border: "1px solid #37443d",
    borderRadius: "8px",
    background: "#090e0c",
    color: "white",
    fontSize: "15px",
  },
  button: {
    marginTop: "20px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#10b981",
    color: "#04130d",
    fontWeight: "bold",
    cursor: "pointer",
  },
  card: {
    background: "#111715",
    border: "1px solid #26352e",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "14px",
    overflowWrap: "anywhere",
  },
  status: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#493c1d",
    color: "#facc15",
    fontSize: "12px",
    fontWeight: "bold",
  },
  message: {
    color: "#34d399",
    marginTop: "14px",
  },
};

function Complaints() {
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "Other",
  });

  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadComplaints = async () => {
    try {
      const response = await api.get("/complaints/my");
      setComplaints(response.data.complaints || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to load complaints."
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await api.post("/complaints", form);

      setMessage("Complaint submitted successfully!");

      setForm({
        subject: "",
        description: "",
        category: "Other",
      });

      await loadComplaints();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to submit complaint."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Complaint Management</h1>

        <p style={styles.subtitle}>
          Submit an issue and track your complaint status.
        </p>

        <form style={styles.panel} onSubmit={handleSubmit}>
          <h2>Submit a Complaint</h2>

          <label htmlFor="category" style={styles.label}>
            Category
          </label>

          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="Seating">Seating</option>
            <option value="Booking">Booking</option>
            <option value="Facilities">Facilities</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="subject" style={styles.label}>
            Subject
          </label>

          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="Enter complaint subject"
            value={form.subject}
            onChange={handleChange}
            maxLength={120}
            required
            style={styles.input}
          />

          <label htmlFor="description" style={styles.label}>
            Description
          </label>

          <textarea
            id="description"
            name="description"
            placeholder="Explain your issue..."
            value={form.description}
            onChange={handleChange}
            maxLength={2000}
            required
            rows={5}
            style={{
              ...styles.input,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>

          {message && (
            <p role="status" style={styles.message}>
              {message}
            </p>
          )}
        </form>

        <section>
          <h2>My Complaints</h2>

          {fetching ? (
            <p>Loading complaints...</p>
          ) : complaints.length === 0 ? (
            <p style={{ color: "#a1a1aa" }}>
              No complaints submitted yet.
            </p>
          ) : (
            complaints.map((complaint) => (
              <article key={complaint._id} style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <h3 style={{ margin: "0", color: "#f5f5f5" }}>
                    {complaint.subject}
                  </h3>

                  <span
                    style={{
                      ...styles.status,
                      ...(complaint.status === "Resolved"
                        ? {
                            background: "#123c2b",
                            color: "#6ee7b7",
                          }
                        : complaint.status === "In Progress"
                        ? {
                            background: "#19395b",
                            color: "#93c5fd",
                          }
                        : {}),
                    }}
                  >
                    {complaint.status}
                  </span>
                </div>

                <p style={{ color: "#d4d4d8", lineHeight: 1.6 }}>
                  {complaint.description}
                </p>

                <p>
                  <strong>Category:</strong> {complaint.category}
                </p>

                <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
                  <strong>Submitted:</strong>{" "}
                  {complaint.createdAt
                    ? new Date(complaint.createdAt).toLocaleString()
                    : "Date unavailable"}
                </p>

                {complaint.adminResponse && (
                  <div
                    style={{
                      padding: "14px",
                      background: "#0a2118",
                      borderLeft: "3px solid #10b981",
                      borderRadius: "5px",
                    }}
                  >
                    <strong style={{ color: "#34d399" }}>
                      Admin Response
                    </strong>

                    <p>{complaint.adminResponse}</p>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default Complaints;