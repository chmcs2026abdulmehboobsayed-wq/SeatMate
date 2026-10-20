import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function MyBookings() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [reminder, setReminder] = useState(null);
  const [notificationPermission, setNotificationPermission] =
    useState(
      "Notification" in window
        ? Notification.permission
        : "unsupported"
    );

  const loadBookings = async () => {
    if (!user?.id && !user?._id) {
      setMessage("Please log in again to view your bookings.");
      setLoading(false);
      return;
    }

    try {
      const studentId = user.id || user._id;
      const response = await api.get(
        `/reservations/student/${studentId}`
      );

      const data = response.data;

      setBookings(
        Array.isArray(data) ? data : data.reservations || []
      );

      setMessage("");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Ask permission only after the user clicks the button.
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setMessage("Your browser does not support notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        setMessage("Browser notifications enabled!");
      } else {
        setMessage(
          "Notifications were not enabled. Website reminders will still work while this page is open."
        );
      }
    } catch {
      setMessage("Unable to enable browser notifications.");
    }
  };

  // Reminder 10 minutes before a checked-in session ends.
  useEffect(() => {
    const notified = new Set();

    const checkReminders = () => {
      const now = Date.now();

      const activeBooking = bookings.find((booking) => {
        if (booking.status !== "checked-in" || !booking.reservationEnd) {
          return false;
        }

        const endTime = new Date(booking.reservationEnd).getTime();
        const timeLeft = endTime - now;

        return timeLeft > 0 && timeLeft <= 10 * 60 * 1000;
      });

      if (!activeBooking) {
        setReminder(null);
        return;
      }

      const reminderKey = `${activeBooking._id}-${activeBooking.reservationEnd}`;

      setReminder((current) =>
        current?.key === reminderKey
          ? current
          : {
            key: reminderKey,
            booking: activeBooking,
          }
      );

      if (!notified.has(reminderKey)) {
        notified.add(reminderKey);

        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification("SeatMate: Session ending soon", {
              body: "Your booking ends in 10 minutes or less. Extend your session if available, or check out.",
            });
          } catch (error) {
            console.error("Browser notification failed:", error);
          }
        }
      }
    };

    checkReminders();

    const intervalId = window.setInterval(checkReminders, 15000);

    return () => window.clearInterval(intervalId);
  }, [bookings]);

  const cancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setActionLoading(id);

    try {
      await api.patch(`/reservations/${id}/cancel`);
      setMessage("Booking cancelled successfully.");
      await loadBookings();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Cancellation failed."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleCheckIn = async (id) => {
    setActionLoading(id);

    try {
      await api.patch(`/reservations/${id}/checkin`);
      setMessage("Check-in successful!");
      await loadBookings();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Check-in failed."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleCheckOut = async (id) => {
    if (!window.confirm("Are you sure you want to finish your session?")) {
      return;
    }

    setActionLoading(id);

    try {
      await api.patch(`/reservations/${id}/checkout`);
      setMessage("Check-out successful! Your session is completed.");
      setReminder(null);
      await loadBookings();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Check-out failed."
      );
    } finally {
      setActionLoading("");
    }
  };
  const handleExtendBooking = async (id) => {
    if (!window.confirm("Extend your booking by 1 hour?")) {
      return;
    }

    setActionLoading(id);

    try {
      const response = await api.patch(
        `/reservations/${id}/extend`
      );

      setMessage(
        response.data.message || "Booking extended by 1 hour!"
      );

      await loadBookings();
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        "Unable to extend booking."
      );
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <main className="page-container">
        <h1 className="gold-text">Loading Bookings...</h1>
      </main>
    );
  }

  return (
    <main className="page-container">
      <Link to="/dashboard">← Dashboard</Link>

      <h1 className="gold-text">My Bookings</h1>
      <p>View your reservations and booking QR tickets.</p>

      <section className="glass-card" style={{ padding: "16px", margin: "20px 0" }}>
        <h3 className="gold-text">Booking Reminders</h3>

        <p>
          Get a reminder 10 minutes before your checked-in session ends.
        </p>

        {notificationPermission === "granted" ? (
          <p>✓ Browser notifications enabled</p>
        ) : notificationPermission === "unsupported" ? (
          <p>Your browser does not support notifications.</p>
        ) : (
          <button
            type="button"
            className="gold-button"
            onClick={enableNotifications}
          >
            Enable Browser Notifications
          </button>
        )}
      </section>

      {message && <p className="notice">{message}</p>}

      {reminder && (
        <section
          className="glass-card"
          role="alert"
          style={{
            padding: "20px",
            margin: "20px 0",
            border: "1px solid #c9a64b",
          }}
        >
          <h2 className="gold-text">⏰ Your session is ending soon!</h2>

          <p>
            Booking {reminder.booking.bookingId} ends at{" "}
            {new Date(
              reminder.booking.reservationEnd
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>

          <p>
            Your session is nearly over. You can extend by one hour if the
            next slot is available, or finish your session now.
          </p>

          <button
            type="button"
            className="booking-checkin-btn"
            disabled={actionLoading === reminder.booking._id}
            onClick={() => handleExtendBooking(reminder.booking._id)}
          >
            {actionLoading === reminder.booking._id
              ? "Please wait..."
              : "Extend +1 Hour"}
          </button>

          <button
            type="button"
            className="booking-checkout-btn"
            style={{ marginLeft: "10px" }}
            disabled={actionLoading === reminder.booking._id}
            onClick={() => handleCheckOut(reminder.booking._id)}
          >
            {actionLoading === reminder.booking._id
              ? "Please wait..."
              : "Finish Booking"}
          </button>

          <button
            type="button"
            className="booking-cancel-btn"
            style={{ marginLeft: "10px" }}
            onClick={() => setReminder(null)}
          >
            Dismiss
          </button>
        </section>
      )}

      {bookings.length === 0 ? (
        <section className="glass-card booking-card">
          <h3>No Bookings Found</h3>
          <p>Your confirmed reservations will appear here.</p>

          <Link to="/book-seat" className="gold-button">
            Book a Seat
          </Link>
        </section>
      ) : (
        <div className="table-grid">
          {bookings.map((booking) => {
            const table =
              booking.tableId && typeof booking.tableId === "object"
                ? booking.tableId
                : booking.table;

            const busy = actionLoading === booking._id;

            return (
              <section
                className="glass-card booking-card"
                key={booking._id}
              >
                <h2 className="gold-text">SeatMate Ticket</h2>

                <p>
                  <strong>Booking ID:</strong>{" "}
                  {booking.bookingId || booking._id}
                </p>

                <p>
                  <strong>Table:</strong> {table?.tableNumber || "—"}
                </p>

                <p>
                  <strong>Chair:</strong> {booking.chairNumber}
                </p>

                <p>
                  <strong>Start:</strong>{" "}
                  {booking.reservationDate
                    ? new Date(booking.reservationDate).toLocaleString()
                    : "—"}
                </p>

                <p>
                  <strong>End:</strong>{" "}
                  {booking.reservationEnd
                    ? new Date(booking.reservationEnd).toLocaleString()
                    : "—"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span className="booking-status">
                    {booking.status || "reserved"}
                  </span>
                </p>

                {booking.qrCode && (
                  <div className="booking-qr">
                    <p>Show this QR code for your booking:</p>

                    <img
                      src={booking.qrCode}
                      alt="Booking QR Code"
                      className="booking-qr-image"
                    />

                    <button
                      className="gold-button"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = booking.qrCode;
                        link.download = `${booking.bookingId || "SeatMate"}-QR.png`;
                        link.click();
                      }}
                    >
                      Download QR
                    </button>
                  </div>
                )}

                <div className="booking-actions">
                  {booking.status === "reserved" && (
                    <>
                      <button
                        className="booking-checkin-btn"
                        disabled={busy}
                        onClick={() => handleCheckIn(booking._id)}
                      >
                        {busy ? "Please wait..." : "Check In"}
                      </button>

                      <button
                        className="booking-cancel-btn"
                        disabled={busy}
                        onClick={() => cancelBooking(booking._id)}
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}

                  {booking.status === "checked-in" && (
                    <>
                      <button
                        className="booking-checkin-btn"
                        disabled={busy}
                        onClick={() => handleExtendBooking(booking._id)}
                      >
                        {busy ? "Please wait..." : "Extend +1 Hour"}
                      </button>

                      <button
                        className="booking-checkout-btn"
                        disabled={busy}
                        onClick={() => handleCheckOut(booking._id)}
                      >
                        {busy ? "Please wait..." : "Check Out"}
                      </button>
                    </>
                  )}
                  {booking.status === "completed" && (
                    <p className="booking-completed">
                      ✓ Session Completed
                    </p>
                  )}

                  {booking.status === "cancelled" && (
                    <p className="booking-cancelled">
                      Booking Cancelled
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default MyBookings;