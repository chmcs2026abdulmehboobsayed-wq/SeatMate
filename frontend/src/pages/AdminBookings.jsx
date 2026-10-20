import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/reservations");
      setBookings(response.data.reservations || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reservations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (booking) => {
    const confirmed = window.confirm(
      `Cancel reservation for ${booking.studentId?.name || "this student"}?`
    );

    if (!confirmed) return;

    try {
      setCancelling(booking._id);

      await api.patch(
        `/admin/reservations/${booking._id}/cancel`
      );

      setBookings((previous) =>
        previous.map((item) =>
          item._id === booking._id
            ? { ...item, status: "cancelled" }
            : item
        )
      );
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to cancel reservation."
      );
    } finally {
      setCancelling("");
    }
  };

  const reservedCount = bookings.filter(
    (booking) => booking.status === "reserved"
  ).length;

  const checkedInCount = bookings.filter(
    (booking) => booking.status === "checked-in"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  const getStatusClass = (status) =>
    String(status || "unknown").toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">SEATMATE ADMINISTRATION</p>
          <h1>Manage Reservations</h1>
          <p>Monitor and manage student seat reservations.</p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={fetchBookings}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>Total Reservations</span>
          <h2>{bookings.length}</h2>
        </div>

        <div className="admin-stat-card">
          <span>Reserved</span>
          <h2>{reservedCount}</h2>
        </div>

        <div className="admin-stat-card">
          <span>Checked In</span>
          <h2>{checkedInCount}</h2>
        </div>

        <div className="admin-stat-card">
          <span>Cancelled</span>
          <h2>{cancelledCount}</h2>
        </div>
      </div>

      <section className="admin-table-card">
        <div className="admin-table-heading">
          <div>
            <h2>All Reservations</h2>
            <p>Review booking details and reservation status.</p>
          </div>
        </div>

        {loading ? (
          <p className="admin-message">Loading reservations...</p>
        ) : error ? (
          <div className="admin-error">
            <p>{error}</p>
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={fetchBookings}
            >
              Try Again
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <p className="admin-message">No reservations found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Table</th>
                  <th>Section</th>
                  <th>Chair</th>
                  <th>Status</th>
                  <th>Booking Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.studentId?.name || "Unknown"}</td>
                    <td>{booking.studentId?.email || "—"}</td>
                    <td>{booking.tableId?.tableNumber || "—"}</td>
                    <td className="reservation-section">
                      {booking.tableId?.section || "—"}
                    </td>
                    <td>
                      {booking.chairNumber ??
                        booking.seatNumber ??
                        "—"}
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      {booking.createdAt
                        ? new Date(
                            booking.createdAt
                          ).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      {["reserved", "checked-in"].includes(
                        booking.status
                      ) ? (
                        <button
                          type="button"
                          className="admin-cancel-btn"
                          disabled={cancelling === booking._id}
                          onClick={() => cancelBooking(booking)}
                        >
                          {cancelling === booking._id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      ) : (
                        <span className="admin-no-action">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminBookings;