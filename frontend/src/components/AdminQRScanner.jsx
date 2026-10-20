import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";


const AdminQRScanner = () => {
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 230, height: 230 },
        aspectRatio: 1,
      },
      false
    );

    const handleScan = async (decodedText) => {
      try {
        await scanner.clear();
      } catch (error) {
        console.error("Scanner cleanup:", error);
      }

      setLoading(true);
      setMessage("");
      setBooking(null);
      setIsError(false);

      try {
        const qrData = JSON.parse(decodedText);

        if (!qrData.bookingId) {
          setIsError(true);
          setMessage("Invalid QR code. Booking ID is missing.");
          return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
          setIsError(true);
          setMessage("Please log in to your admin account.");
          return;
        }

        const response = await axios.post(
          "http://localhost:5000/api/reservations/verify-qr",
          { bookingId: qrData.bookingId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data.valid) {
          setIsError(true);
          setMessage(response.data.message || "Booking is invalid.");
          return;
        }

        setBooking(response.data.booking);
        setMessage(response.data.message || "Booking verified successfully.");
      } catch (error) {
        setIsError(true);
        setMessage(
          error.response?.data?.message ||
            "Unable to verify booking. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    scanner.render(handleScan, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanKey]);

  const scanAgain = () => {
    setBooking(null);
    setMessage("");
    setIsError(false);
    setLoading(false);
    setScanKey((key) => key + 1);
  };

  return (
    <div className="admin-shell qr-page">
      {/* Navbar */}
      <header className="admin-navbar">
        <Link to="/admin" className="admin-brand">
          <span className="admin-brand-icon">S</span>
          <span>
            Seat<span className="admin-brand-gold">Mate</span>
          </span>
        </Link>

        <nav className="admin-nav-links">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/users">Manage Users</Link>
          <Link to="/admin/tables">Manage Tables</Link>
          <Link to="/admin/bookings">Manage Reservations</Link>
        </nav>

        <Link to="/admin" className="qr-back-button">
          ← Dashboard
        </Link>
      </header>

      {/* Main Content */}
      <main className="page-container qr-main">
        <section className="qr-page-heading">
          <p className="admin-eyebrow">SEATMATE MANAGEMENT</p>
          <h1 className="gold-text">QR Code Scanner</h1>
          <p>
            Scan a student's reservation QR code to verify their booking
            details.
          </p>
        </section>

        <div className="qr-layout">
          {/* Scanner Card */}
          <section className="glass-card qr-scanner-card">
            <div className="qr-card-heading">
              <div>
                <span className="qr-small-label">CAMERA SCANNER</span>
                <h2>Scan Reservation</h2>
              </div>

              <span className="qr-camera-icon">▦</span>
            </div>

            <div className="qr-instructions">
              <span>1</span>
              <p>Allow camera access and hold the booking QR code in frame.</p>
            </div>

            <div className="qr-scanner-frame">
              <div id="qr-reader" />
            </div>

            {loading && (
              <div className="qr-message qr-message-loading" role="status">
                <span className="qr-spinner" />
                Verifying booking...
              </div>
            )}

            {!loading && message && (
              <div
                className={`qr-message ${
                  isError ? "qr-message-error" : "qr-message-success"
                }`}
                role="status"
              >
                <span>{isError ? "!" : "✓"}</span>
                {message}
              </div>
            )}

            {(booking || message) && !loading && (
              <button className="qr-scan-again" onClick={scanAgain}>
                Scan Another QR Code ↻
              </button>
            )}

            <p className="qr-security-note">
              🔒 Booking information is checked against the SeatMate database.
            </p>
          </section>

          {/* Booking Details */}
          <section className="glass-card qr-details-card">
            <div className="qr-card-heading">
              <div>
                <span className="qr-small-label">VERIFICATION RESULT</span>
                <h2>Booking Details</h2>
              </div>
              <span className="qr-details-icon">✓</span>
            </div>

            {!booking ? (
              <div className="qr-empty-state">
                <div className="qr-empty-icon">▦</div>
                <h3>Waiting for scan</h3>
                <p>
                  Verified student and reservation information will appear
                  here after scanning.
                </p>
              </div>
            ) : (
              <>
                <div className="qr-verified-banner">
                  <span>✓</span>
                  <div>
                    <strong>Booking Verified</strong>
                    <p>Reservation record found</p>
                  </div>
                </div>

                <div className="qr-booking-id">
                  <span>BOOKING ID</span>
                  <strong>{booking.bookingId}</strong>
                </div>

                <div className="qr-detail-row">
                  <span>Student Name</span>
                  <strong>{booking.studentName}</strong>
                </div>

                <div className="qr-detail-row">
                  <span>Email</span>
                  <strong className="qr-email">{booking.studentEmail || "—"}</strong>
                </div>

                <div className="qr-detail-row">
                  <span>Table Number</span>
                  <strong>{booking.tableNumber}</strong>
                </div>

                <div className="qr-detail-row">
                  <span>Chair Number</span>
                  <strong>{booking.chairNumber}</strong>
                </div>

                <div className="qr-detail-row">
                  <span>Status</span>
                  <strong className="qr-status">{booking.status}</strong>
                </div>

                <div className="qr-detail-row">
                  <span>Start Time</span>
                  <strong>
                    {new Date(booking.reservationDate).toLocaleString()}
                  </strong>
                </div>

                <div className="qr-detail-row">
                  <span>End Time</span>
                  <strong>
                    {new Date(booking.reservationEnd).toLocaleString()}
                  </strong>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} SeatMate. Study smarter.</p>
      </footer>
    </div>
  );
};

export default AdminQRScanner;