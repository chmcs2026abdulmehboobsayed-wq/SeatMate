import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [complaints, setComplaints] = useState([]);
  const [complaintsError, setComplaintsError] = useState("");
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        setData(response.data);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    const loadComplaints = async () => {
      try {
        const response = await api.get("/complaints");

        const result = response.data;
        const list = Array.isArray(result)
          ? result
          : result.complaints || [];

        setComplaints(list);
        setComplaintsError("");
      } catch (err) {
        setComplaintsError(
          err.response?.data?.message ||
            "Unable to load complaint statistics."
        );
      } finally {
        setLoadingComplaints(false);
      }
    };

    loadDashboard();
    loadComplaints();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const complaintStats = [
    {
      title: "Pending Complaints",
      value: complaints.filter((c) => c.status === "Pending").length,
      icon: "🟠",
      color: "#f59e0b",
    },
    {
      title: "In Progress",
      value: complaints.filter((c) => c.status === "In Progress").length,
      icon: "🔵",
      color: "#60a5fa",
    },
    {
      title: "Resolved Complaints",
      value: complaints.filter((c) => c.status === "Resolved").length,
      icon: "🟢",
      color: "#34d399",
    },
  ];

  const stats = [
    {
      title: "Total Users",
      value: data?.totalUsers ?? 0,
      icon: "👥",
    },
    {
      title: "Total Tables",
      value: data?.totalTables ?? 0,
      icon: "🪑",
    },
    {
      title: "Total Reservations",
      value: data?.totalReservations ?? 0,
      icon: "📋",
    },
    {
      title: "Active Reservations",
      value: data?.activeReservations ?? 0,
      icon: "✓",
    },
  ];

  return (
    <div className="admin-shell">
      {/* Admin Navbar */}
      <header className="admin-navbar">
        <Link to="/admin" className="admin-brand">
          <span className="admin-brand-icon">S</span>
          <span>
            Seat<span className="admin-brand-gold">Mate</span>
          </span>
        </Link>

        <nav className="admin-nav-links">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>

          <NavLink to="/admin/users">Manage Users</NavLink>

          <NavLink to="/admin/tables">Manage Tables</NavLink>

          <NavLink to="/admin/bookings">Manage Reservations</NavLink>

          {/* NEW: Manage Books */}
          <NavLink to="/admin/books">Manage Books</NavLink>

          <NavLink to="/admin/complaints">Manage Complaints</NavLink>

          <NavLink to="/admin/qr-scanner">QR Scanner</NavLink>
        </nav>

        <button className="admin-nav-logout" onClick={handleLogout}>
          Logout ↗
        </button>
      </header>

      {/* Dashboard Content */}
      <main className="page-container admin-dashboard">
        <div className="admin-header">
          <div>
            <p className="admin-eyebrow">SEATMATE MANAGEMENT</p>
            <h1 className="gold-text">Admin Dashboard</h1>
            <p>
              Monitor users, tables, reservations, books and complaints.
            </p>
          </div>

          <span className="admin-online-badge">
            <span /> Admin Portal
          </span>
        </div>

        {error && <p className="notice">{error}</p>}

        {loading ? (
          <div className="glass-card admin-loading">
            Loading dashboard...
          </div>
        ) : data ? (
          <>
            {/* Main Statistics */}
            <section className="admin-stats-grid">
              {stats.map((stat) => (
                <div
                  className="glass-card admin-stat-card"
                  key={stat.title}
                >
                  <div className="admin-stat-top">
                    <span>{stat.title}</span>

                    <span className="admin-stat-icon">
                      {stat.icon}
                    </span>
                  </div>

                  <h2>{stat.value}</h2>
                  <p>{stat.title}</p>
                </div>
              ))}
            </section>

            {/* Complaint Statistics */}
            <section
              className="glass-card"
              style={{
                marginTop: "24px",
                padding: "24px",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <p className="admin-eyebrow">STUDENT SUPPORT</p>

                  <h2 style={{ margin: "8px 0" }}>
                    Complaint Overview
                  </h2>

                  <p style={{ margin: 0 }}>
                    Track student complaints and their progress.
                  </p>
                </div>

                <Link
                  to="/admin/complaints"
                  className="admin-management-card"
                  style={{
                    padding: "12px 18px",
                    textDecoration: "none",
                  }}
                >
                  Manage Complaints →
                </Link>
              </div>

              {loadingComplaints ? (
                <p>Loading complaint statistics...</p>
              ) : complaintsError ? (
                <p className="notice">{complaintsError}</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {complaintStats.map((stat) => (
                      <div
                        key={stat.title}
                        style={{
                          padding: "20px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${stat.color}55`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "14px" }}>
                            {stat.title}
                          </span>

                          <span style={{ fontSize: "22px" }}>
                            {stat.icon}
                          </span>
                        </div>

                        <h2
                          style={{
                            color: stat.color,
                            fontSize: "30px",
                            margin: "14px 0 0",
                          }}
                        >
                          {stat.value}
                        </h2>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: "18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <span>
                      Total Complaints:{" "}
                      <strong>{complaints.length}</strong>
                    </span>

                    <span>
                      Resolution Rate:{" "}
                      <strong>
                        {complaints.length
                          ? Math.round(
                              (complaintStats[2].value /
                                complaints.length) *
                                100
                            )
                          : 0}
                        %
                      </strong>
                    </span>
                  </div>
                </>
              )}
            </section>

            {/* Reservation Summary */}
            <section className="glass-card admin-overview">
              <div>
                <p className="admin-eyebrow">RESERVATION OVERVIEW</p>
                <h2>Booking Summary</h2>
              </div>

              <div className="admin-summary-row">
                <span>Total Reservations</span>
                <strong>{data.totalReservations}</strong>
              </div>

              <div className="admin-summary-row">
                <span>Active Reservations</span>
                <strong className="admin-active-value">
                  {data.activeReservations}
                </strong>
              </div>

              <div className="admin-summary-row">
                <span>Other Reservations</span>
                <strong>
                  {Math.max(
                    0,
                    data.totalReservations - data.activeReservations
                  )}
                </strong>
              </div>

              <div className="admin-progress-track">
                <div
                  className="admin-progress-fill"
                  style={{
                    width: `${
                      data.totalReservations > 0
                        ? Math.min(
                            100,
                            (data.activeReservations /
                              data.totalReservations) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p className="admin-progress-caption">
                {data.totalReservations > 0
                  ? Math.round(
                      (data.activeReservations /
                        data.totalReservations) *
                        100
                    )
                  : 0}
                % of reservations are active.
              </p>
            </section>

            {/* Management Cards */}
            <section className="glass-card admin-management">
              <p className="admin-eyebrow">MANAGEMENT</p>

              <h2>Manage SeatMate</h2>

              <p>Access the administration sections below.</p>

              <div className="admin-management-grid">
                {/* Manage Users */}
                <Link
                  to="/admin/users"
                  className="admin-management-card"
                >
                  <span>👥</span>
                  <h3>Manage Users</h3>
                  <p>
                    View registered users and their details.
                  </p>
                </Link>

                {/* Manage Tables */}
                <Link
                  to="/admin/tables"
                  className="admin-management-card"
                >
                  <span>🪑</span>
                  <h3>Manage Tables</h3>
                  <p>
                    View tables and chair availability.
                  </p>
                </Link>

                {/* Manage Reservations */}
                <Link
                  to="/admin/bookings"
                  className="admin-management-card"
                >
                  <span>📋</span>
                  <h3>Manage Reservations</h3>
                  <p>
                    Review and manage student reservations.
                  </p>
                </Link>

                {/* NEW: Manage Books */}
                <Link
                  to="/admin/books"
                  className="admin-management-card"
                >
                  <span>📚</span>
                  <h3>Manage Books</h3>
                  <p>
                    Add books, manage available copies, approve
                    student requests and process book returns.
                  </p>

                  <span
                    style={{
                      color: "#d4af37",
                      fontWeight: "600",
                    }}
                  >
                    Manage Library Books →
                  </span>
                </Link>

                {/* Manage Complaints */}
                <Link
                  to="/admin/complaints"
                  className="admin-management-card"
                >
                  <span>📝</span>
                  <h3>Manage Complaints</h3>
                  <p>
                    Review student complaints, update their status
                    and send responses.
                  </p>

                  <span
                    style={{
                      color: "#d4af37",
                      fontWeight: "600",
                    }}
                  >
                    Review Complaints →
                  </span>
                </Link>

                {/* QR Scanner */}
                <Link
                  to="/admin/qr-scanner"
                  className="admin-management-card admin-qr-card"
                >
                  <span>▦</span>
                  <h3>QR Scanner</h3>
                  <p>
                    Scan student booking QR codes and verify reservations.
                  </p>

                  <span className="admin-qr-action">
                    Open Scanner →
                  </span>
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          © {new Date().getFullYear()} SeatMate. Study smarter.
        </p>
      </footer>
    </div>
  );
}

export default AdminDashboard;