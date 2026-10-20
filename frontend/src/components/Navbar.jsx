import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import "../App.css";

function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
  const token = localStorage.getItem("token");

  const fetchUnreadCount = useCallback(async () => {
    if (!token || isAdmin) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get("/notifications");

      setUnreadCount(
        Number(response.data?.unreadCount) || 0
      );
    } catch (error) {
      console.error(
        "Failed to fetch notification count:",
        error.response?.data?.message || error.message
      );
    }
  }, [token, isAdmin]);

  useEffect(() => {
    fetchUnreadCount();

    if (!token || isAdmin) return undefined;

    const interval = setInterval(fetchUnreadCount, 15000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, token, isAdmin]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUnreadCount(0);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sm-navbar">
      <Link
        to={isAdmin ? "/admin" : "/dashboard"}
        className="sm-brand"
        onClick={closeMenu}
      >
        <span className="sm-brand-icon">S</span>
        <span>
          Seat<span className="sm-brand-gold">Mate</span>
        </span>
      </Link>

      <button
        className="sm-menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div
        className={`sm-nav-content ${menuOpen ? "sm-nav-open" : ""}`}
      >
        <div className="sm-nav-links">
          {isAdmin ? (
            <>
              <NavLink to="/admin" onClick={closeMenu}>
                Dashboard
              </NavLink>

              <NavLink to="/admin/users" onClick={closeMenu}>
                Manage Users
              </NavLink>

              <NavLink to="/admin/tables" onClick={closeMenu}>
                Manage Tables
              </NavLink>

              <NavLink to="/admin/bookings" onClick={closeMenu}>
                Manage Reservations
              </NavLink>

              <NavLink to="/admin/complaints" onClick={closeMenu}>
                Manage Complaints
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" onClick={closeMenu}>
                Home
              </NavLink>

              <NavLink to="/dashboard" onClick={closeMenu}>
                Dashboard
              </NavLink>

              <NavLink to="/book-seat" onClick={closeMenu}>
                Book Seat
              </NavLink>

              <NavLink to="/my-bookings" onClick={closeMenu}>
                My Bookings
              </NavLink>

              <NavLink to="/profile" onClick={closeMenu}>
                Profile
              </NavLink>

              <NavLink
                to="/notifications"
                onClick={closeMenu}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span>🔔 Notifications</span>

                {unreadCount > 0 && (
                  <span
                    style={{
                      minWidth: "20px",
                      height: "20px",
                      padding: "0 6px",
                      borderRadius: "20px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "800",
                      display: "inline-flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/complaints" onClick={closeMenu}>
                Complaints
              </NavLink>
            </>
          )}
        </div>

        <button className="sm-logout-btn" onClick={logout}>
          Logout <span>↗</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;