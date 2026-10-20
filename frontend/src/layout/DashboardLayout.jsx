import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import "./DashboardLayout.css";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function DashboardLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get("/notifications");
      setUnreadCount(Number(response.data?.unreadCount) || 0);
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error.response?.data?.message || error.message
      );
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 15000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <div className="dashboard-layout">
      <aside
        className={`dashboard-sidebar ${
          menuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <h2>
            Seat<span>Mate</span>
          </h2>
          <p>Your Personal Study Space</p>
        </div>

        <nav className="sidebar-navigation">
          <NavLink to="/dashboard" end onClick={closeMenu}>
            <span>⌂</span> Dashboard
          </NavLink>

          <NavLink to="/book-seat" onClick={closeMenu}>
            <span>▦</span> Book a Seat
          </NavLink>

          <NavLink to="/my-bookings" onClick={closeMenu}>
            <span>▤</span> My Bookings
          </NavLink>

          {/* Library Books */}
          <NavLink to="/books" onClick={closeMenu}>
            <span>📚</span> Library Books
          </NavLink>

          <NavLink to="/profile" onClick={closeMenu}>
            <span>♙</span> My Profile
          </NavLink>

          {/* Notifications */}
          <NavLink
            to="/notifications"
            onClick={closeMenu}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span>🔔</span>
              Notifications
            </span>

            {unreadCount > 0 && (
              <span
                style={{
                  minWidth: "22px",
                  height: "22px",
                  padding: "0 6px",
                  borderRadius: "20px",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/complaints" onClick={closeMenu}>
            <span>✉</span> Complaints
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <p>SEATMATE</p>
          <span>Find your focus.</span>

          <button onClick={handleLogout} className="sidebar-logout">
            ↪ Logout
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        ></div>
      )}

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            className="dashboard-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          <NavLink to="/dashboard" className="topbar-brand">
            Seat<span>Mate</span>
          </NavLink>

          <div className="topbar-heading">
            <p className="topbar-eyebrow">WELCOME TO SEATMATE</p>
            <h3>Your Space. Your Focus.</h3>
          </div>

          <div className="topbar-status">
            <span className="status-indicator"></span>
            Student Portal
          </div>

          <button
            onClick={handleLogout}
            className="topbar-logout"
          >
            Logout ↗
          </button>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>

        <footer className="dashboard-footer">
          <p>
            © {new Date().getFullYear()} SeatMate. Study smarter.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;