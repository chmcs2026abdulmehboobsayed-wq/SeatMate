import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) {
        setLoadingBookings(false);
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
      } catch (error) {
        console.error("Unable to load dashboard bookings:", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, [user?.id]);

  const totalBookings = bookings.length;

  const upcomingBookings = bookings.filter(
    (booking) =>
      ["reserved", "checked-in"].includes(booking.status) &&
      new Date(booking.reservationDate).getTime() > Date.now()
  ).length;

  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.reservationDate) -
        new Date(a.createdAt || a.reservationDate)
    )
    .slice(0, 3);

  return (
    <div className="dashboard-page">
      {/* Navigation */}
      <nav className="dashboard-navbar">
        <Link to="/" className="logo">
          SEAT<span>MATE</span>
        </Link>

        <div className="dashboard-nav-actions">
          <Link to="/profile" className="dashboard-profile-link">
            My Profile
          </Link>

          <button className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-container">
        {/* Welcome Section */}
        <section className="dashboard-welcome">
          <p className="dashboard-eyebrow">
            YOUR PERSONAL STUDY SPACE
          </p>

          <h1>
            Welcome back, <span>{user?.name || "Student"}</span>!
          </h1>

          <p>
            Your study space is waiting. Book your seat and focus on what
            matters most.
          </p>
        </section>

        {/* Booking Statistics */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">YOUR ACTIVITY</p>
              <h2>Booking Overview</h2>
            </div>
          </div>

          <div className="dashboard-action-grid">
            <div className="dashboard-action-card">
              <div className="dashboard-card-icon">▤</div>
              <h3>Total Bookings</h3>
              <p>{loadingBookings ? "Loading..." : totalBookings}</p>
            </div>

            <div className="dashboard-action-card">
              <div className="dashboard-card-icon">◷</div>
              <h3>Upcoming Bookings</h3>
              <p>{loadingBookings ? "Loading..." : upcomingBookings}</p>
            </div>

            <div className="dashboard-action-card">
              <div className="dashboard-card-icon">✓</div>
              <h3>Completed Bookings</h3>
              <p>{loadingBookings ? "Loading..." : completedBookings}</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">QUICK ACCESS</p>
              <h2>Manage Your Space</h2>
            </div>
          </div>

          <div className="dashboard-action-grid">
            <Link to="/book-seat" className="dashboard-action-card">
              <div className="dashboard-card-icon">♙</div>
              <h3>Book a Seat</h3>
              <p>Find an available study seat and reserve your space.</p>
              <span className="dashboard-card-link">
                Explore Seats →
              </span>
            </Link>

            <Link to="/my-bookings" className="dashboard-action-card">
              <div className="dashboard-card-icon">▤</div>
              <h3>My Bookings</h3>
              <p>View your reservations and QR tickets.</p>
              <span className="dashboard-card-link">
                View Bookings →
              </span>
            </Link>

            <Link to="/profile" className="dashboard-action-card">
              <div className="dashboard-card-icon">♙</div>
              <h3>My Profile</h3>
              <p>View your account information.</p>
              <span className="dashboard-card-link">
                View Profile →
              </span>
            </Link>

            {/* NEW: Complaints Card */}
            <Link to="/complaints" className="dashboard-action-card">
              <div className="dashboard-card-icon">📝</div>
              <h3>Complaints & Feedback</h3>
              <p>
                Report seating problems, booking issues or other
                difficulties. Track your complaint status and admin
                responses.
              </p>
              <span className="dashboard-card-link">
                Manage Complaints →
              </span>
            </Link>
          </div>
        </section>

        {/* Recent Bookings */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">YOUR RESERVATIONS</p>
              <h2>Recent Bookings</h2>
            </div>

            <Link to="/my-bookings" className="dashboard-card-link">
              View All →
            </Link>
          </div>

          {loadingBookings ? (
            <div className="dashboard-info-card">
              <p>Loading your recent bookings...</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="dashboard-info-card">
              <div>
                <h2>No Bookings Yet</h2>
                <p>
                  Your recent reservations will appear here after you
                  book a seat.
                </p>
              </div>

              <Link to="/book-seat" className="gold-button">
                Book a Seat
              </Link>
            </div>
          ) : (
            <div className="dashboard-action-grid">
              {recentBookings.map((booking) => {
                const table =
                  booking.tableId &&
                  typeof booking.tableId === "object"
                    ? booking.tableId
                    : booking.table;

                return (
                  <div
                    className="dashboard-action-card"
                    key={booking._id}
                  >
                    <h3>{booking.bookingId || "SeatMate Booking"}</h3>

                    <p>Table: {table?.tableNumber || "—"}</p>
                    <p>Chair: {booking.chairNumber}</p>

                    <p>
                      Date:{" "}
                      {booking.reservationDate
                        ? new Date(
                            booking.reservationDate
                          ).toLocaleDateString("en-IN")
                        : "—"}
                    </p>

                    <p>Status: {booking.status || "reserved"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Study Information */}
        <section className="dashboard-info-card">
          <div>
            <p className="dashboard-eyebrow">STUDY SMARTER</p>
            <h2>Your space. Your focus. Your success.</h2>
            <p>
              Keep your study routine organized with SeatMate. Manage your
              reservations from one convenient place.
            </p>
          </div>

          <Link to="/book-seat" className="gold-button">
            Reserve Your Seat
          </Link>
        </section>

        {/* Admin Access */}
        {user?.role === "admin" && (
          <section className="dashboard-admin-section">
            <h2>Administrator Access</h2>
            <p>Manage SeatMate through the administration panel.</p>

            <Link to="/admin" className="gold-button">
              Open Admin Panel
            </Link>
          </section>
        )}
      </main>

      <footer className="dashboard-footer">
        <Link to="/" className="logo">
          SEAT<span>MATE</span>
        </Link>

        <p>Made for better study sessions.</p>
      </footer>
    </div>
  );
}

export default Dashboard;