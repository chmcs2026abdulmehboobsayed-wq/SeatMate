import { useEffect, useState } from "react";
import api from "../api/axios";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px 20px",
    background: "#080b0a",
    color: "#f5f5f5",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  heading: {
    color: "#d6b56d",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#a1a1aa",
    marginBottom: "28px",
  },
  card: {
    background: "#111715",
    border: "1px solid #26352e",
    borderRadius: "14px",
    padding: "22px",
    marginBottom: "18px",
    overflowWrap: "anywhere",
  },
  label: {
    display: "block",
    marginTop: "14px",
    marginBottom: "8px",
    color: "#d4d4d8",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "11px",
    boxSizing: "border-box",
    border: "1px solid #37443d",
    borderRadius: "8px",
    background: "#090e0c",
    color: "white",
    fontSize: "14px",
  },
  button: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#10b981",
    color: "#04130d",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    border: "1px solid #37443d",
    borderRadius: "8px",
    background: "#18211c",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  error: {
    padding: "12px",
    borderRadius: "8px",
    background: "#3b1515",
    color: "#fca5a5",
    marginBottom: "18px",
  },
  success: {
    padding: "12px",
    borderRadius: "8px",
    background: "#123c2b",
    color: "#6ee7b7",
    marginBottom: "18px",
  },
};

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [edits, setEdits] = useState({});

  const loadComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/complaints");

      const list = Array.isArray(response.data)
        ? response.data
        : response.data.complaints || [];

      setComplaints(list);

      setEdits((previous) => {
        const updated = { ...previous };

        list.forEach((complaint) => {
          if (!updated[complaint._id]) {
            updated[complaint._id] = {
              status: complaint.status || "Pending",
              adminResponse: complaint.adminResponse || "",
            };
          }
        });

        return updated;
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load complaints. Please check your admin login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleEdit = (id, field, value) => {
    setEdits((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (id) => {
    const edit = edits[id];

    if (!edit) return;

    setSavingId(id);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(`/complaints/${id}`, {
        status: edit.status,
        adminResponse: edit.adminResponse,
      });

      const updatedComplaint = response.data.complaint;

      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint._id === id
            ? { ...complaint, ...updatedComplaint }
            : complaint
        )
      );

      setMessage("Complaint updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update complaint."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <p
              style={{
                color: "#10b981",
                fontSize: "12px",
                letterSpacing: "2px",
                fontWeight: "bold",
              }}
            >
              SEATMATE MANAGEMENT
            </p>

            <h1 style={styles.heading}>Manage Complaints</h1>

            <p style={styles.subtitle}>
              Review student complaints and update their status.
            </p>
          </div>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={loadComplaints}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        {!loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {[
              {
                label: "Total",
                value: complaints.length,
                color: "#f5f5f5",
              },
              {
                label: "Pending",
                value: complaints.filter((c) => c.status === "Pending").length,
                color: "#facc15",
              },
              {
                label: "In Progress",
                value: complaints.filter((c) => c.status === "In Progress")
                  .length,
                color: "#93c5fd",
              },
              {
                label: "Resolved",
                value: complaints.filter((c) => c.status === "Resolved")
                  .length,
                color: "#6ee7b7",
              },
            ].map((item) => (
              <div key={item.label} style={styles.card}>
                <p style={{ color: "#a1a1aa", margin: "0 0 10px" }}>
                  {item.label}
                </p>

                <h2 style={{ color: item.color, margin: 0 }}>
                  {item.value}
                </h2>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={styles.card}>Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={styles.card}>
            No complaints found.
          </div>
        ) : (
          complaints.map((complaint) => {
            const edit = edits[complaint._id] || {
              status: complaint.status || "Pending",
              adminResponse: complaint.adminResponse || "",
            };

            return (
              <article key={complaint._id} style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 style={{ marginTop: 0, color: "#f5f5f5" }}>
                      {complaint.subject}
                    </h2>

                    <p style={{ color: "#a1a1aa", fontSize: "13px" }}>
                      ID: {complaint._id}
                    </p>
                  </div>

                  <span
                    style={{
                      alignSelf: "flex-start",
                      padding: "7px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background:
                        complaint.status === "Resolved"
                          ? "#123c2b"
                          : complaint.status === "In Progress"
                          ? "#19395b"
                          : "#493c1d",
                      color:
                        complaint.status === "Resolved"
                          ? "#6ee7b7"
                          : complaint.status === "In Progress"
                          ? "#93c5fd"
                          : "#facc15",
                    }}
                  >
                    {complaint.status || "Pending"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "10px",
                    margin: "18px 0",
                  }}
                >
                  <p>
                    <strong>Student:</strong>{" "}
                    {complaint.student?.name || "Student"}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {complaint.student?.email || "Not available"}
                  </p>

                  <p>
                    <strong>Category:</strong> {complaint.category}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {complaint.createdAt
                      ? new Date(complaint.createdAt).toLocaleString()
                      : "Not available"}
                  </p>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "#090e0c",
                    marginBottom: "20px",
                  }}
                >
                  <strong>Description</strong>

                  <p
                    style={{
                      color: "#d4d4d8",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {complaint.description}
                  </p>
                </div>

                <label
                  htmlFor={`status-${complaint._id}`}
                  style={styles.label}
                >
                  Update Status
                </label>

                <select
                  id={`status-${complaint._id}`}
                  value={edit.status}
                  onChange={(event) =>
                    handleEdit(
                      complaint._id,
                      "status",
                      event.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <label
                  htmlFor={`response-${complaint._id}`}
                  style={styles.label}
                >
                  Admin Response
                </label>

                <textarea
                  id={`response-${complaint._id}`}
                  value={edit.adminResponse}
                  onChange={(event) =>
                    handleEdit(
                      complaint._id,
                      "adminResponse",
                      event.target.value
                    )
                  }
                  placeholder="Write a response for the student..."
                  rows={3}
                  maxLength={2000}
                  style={{
                    ...styles.input,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleUpdate(complaint._id)}
                  disabled={savingId === complaint._id}
                  style={{
                    ...styles.button,
                    marginTop: "16px",
                    opacity: savingId === complaint._id ? 0.6 : 1,
                  }}
                >
                  {savingId === complaint._id
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}

export default AdminComplaints;