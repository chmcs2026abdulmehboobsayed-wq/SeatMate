import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const loadProfileBookings = async () => {
      if (!user?.id) {
        setMessage("Please log in again to view your profile.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/reservations/student/${user.id}`
        );

        const data = response.data;

        setBookings(
          Array.isArray(data) ? data : data.reservations || []
        );
      } catch (err) {
        setMessage(
          err.response?.data?.message ||
            "Unable to load your booking history."
        );
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    loadProfileBookings();
  }, [user?.id]);

  const startEditing = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setMessage("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setMessage("");
    setEditing(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!profileName.trim() || !profileEmail.trim()) {
      setMessage("Name and email are required.");
      setMessageType("error");
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage("Enter your current password to change it.");
      setMessageType("error");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setMessage("New password must be at least 8 characters.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: profileName.trim(),
        email: profileEmail.trim(),
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      // Calls the authenticated backend profile-update route.
      const response = await api.patch("/auth/profile", payload);

      const updatedUser = response.data?.user;

      if (!updatedUser) {
        throw new Error("Updated profile was not returned by the server.");
      }

      // Keep the saved login information synchronized.
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setProfileName(updatedUser.name || "");
      setProfileEmail(updatedUser.email || "");
      setCurrentPassword("");
      setNewPassword("");
      setEditing(false);

      setMessage("Profile updated successfully!");
      setMessageType("success");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    maxWidth: "450px",
    padding: "12px 14px",
    marginTop: "6px",
    marginBottom: "18px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "#111827",
    color: "#ffffff",
    fontSize: "15px",
    boxSizing: "border-box",
  };

  return (
    <main className="page-container">
      <Link to="/dashboard">← Dashboard</Link>

      <section
        className="glass-card profile-card"
        style={{ marginTop: "24px", padding: "28px" }}
      >
        <p className="dashboard-eyebrow">SEATMATE ACCOUNT</p>

        <h1 className="gold-text">My Profile</h1>

        {!editing ? (
          <>
            <div style={{ marginTop: "20px", lineHeight: "2.2" }}>
              <p>
                <strong>Name:</strong> {user?.name || "—"}
              </p>

              <p>
                <strong>Email:</strong> {user?.email || "—"}
              </p>

              <p>
                <strong>Role:</strong> {user?.role || "student"}
              </p>

              <p>
                <strong>Total Bookings:</strong> {bookings.length}
              </p>
            </div>

            <button
              type="button"
              className="gold-button"
              onClick={startEditing}
              style={{ marginTop: "18px", marginRight: "10px" }}
            >
              ✏️ Edit Profile
            </button>

            <button
              type="button"
              onClick={logout}
              style={{ marginTop: "18px", padding: "10px 18px" }}
            >
              Logout
            </button>
          </>
        ) : (
          <form
            onSubmit={handleProfileUpdate}
            style={{ marginTop: "24px" }}
          >
            <label htmlFor="profile-name">
              <strong>Full Name</strong>
            </label>

            <input
              id="profile-name"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              autoComplete="name"
              maxLength={100}
              required
              style={inputStyle}
            />

            <label htmlFor="profile-email">
              <strong>Email Address</strong>
            </label>

            <input
              id="profile-email"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              autoComplete="email"
              required
              style={inputStyle}
            />

            <h3 className="gold-text">Change Password (Optional)</h3>

            <p style={{ marginBottom: "18px", opacity: 0.8 }}>
              Leave both password fields empty if you do not want to
              change your password.
            </p>

            <label htmlFor="current-password">
              <strong>Current Password</strong>
            </label>

            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />

            <label htmlFor="new-password">
              <strong>New Password</strong>
            </label>

            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              style={inputStyle}
            />

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              <button
                type="submit"
                className="gold-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                style={{ padding: "10px 18px" }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {message && (
          <p
            role="status"
            style={{
              marginTop: "18px",
              padding: "12px",
              borderRadius: "8px",
              color: messageType === "success" ? "#4ade80" : "#f87171",
              background:
                messageType === "success"
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
            }}
          >
            {message}
          </p>
        )}
      </section>

      <section style={{ marginTop: "35px" }}>
        <h2 className="gold-text">My Booking History</h2>

        <p>Your reservations and booking QR tickets.</p>

        {loading ? (
          <p style={{ marginTop: "20px" }}>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <section
            className="glass-card"
            style={{ padding: "24px", marginTop: "18px" }}
          >
            <h3>No bookings yet</h3>

            <p>Book your first study seat to see it here.</p>

            <Link
              to="/book-seat"
              className="gold-button"
              style={{
                display: "inline-block",
                marginTop: "16px",
              }}
            >
              Book a Seat
            </Link>
          </section>
        ) : (
          <div className="table-grid" style={{ marginTop: "20px" }}>
            {bookings.map((booking) => {
              const table =
                booking.tableId &&
                typeof booking.tableId === "object"
                  ? booking.tableId
                  : booking.table;

              return (
                <article
                  className="glass-card booking-card"
                  key={booking._id}
                  style={{ padding: "22px" }}
                >
                  <h3 className="gold-text">SeatMate Booking</h3>

                  <p>
                    <strong>Booking ID:</strong>{" "}
                    {booking.bookingId || booking._id}
                  </p>

                  <p>
                    <strong>Table:</strong>{" "}
                    {table?.tableNumber || "—"}
                  </p>

                  <p>
                    <strong>Chair:</strong> {booking.chairNumber}
                  </p>

                  <p>
                    <strong>Date & Time:</strong>{" "}
                    {booking.reservationDate
                      ? new Date(
                          booking.reservationDate
                        ).toLocaleString()
                      : "—"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {booking.status || "reserved"}
                  </p>

                  {booking.qrCode ? (
                    <div style={{ marginTop: "16px" }}>
                      <p>Booking QR Code</p>

                      <img
                        src={booking.qrCode}
                        alt="Booking QR Code"
                        style={{
                          display: "block",
                          width: "180px",
                          height: "180px",
                          padding: "8px",
                          margin: "12px 0",
                          background: "#ffffff",
                          borderRadius: "8px",
                          objectFit: "contain",
                        }}
                      />

                      <button
                        type="button"
                        className="gold-button"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = booking.qrCode;
                          link.download = `${
                            booking.bookingId || "SeatMate"
                          }-QR.png`;
                          link.click();
                        }}
                      >
                        Download QR
                      </button>
                    </div>
                  ) : (
                    <p style={{ marginTop: "12px" }}>
                      QR code is not available for this booking.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Profile;