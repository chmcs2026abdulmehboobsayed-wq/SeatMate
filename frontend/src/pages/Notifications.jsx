import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/notifications");

      setNotifications(response.data?.notifications || []);
      setUnreadCount(Number(response.data?.unreadCount) || 0);
    } catch (err) {
      console.error("Notifications error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
      alert(
        err.response?.data?.message ||
          "Could not mark notification as read."
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
      alert(
        err.response?.data?.message ||
          "Could not mark all notifications as read."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pageStyle = {
    minHeight: "100vh",
    padding: "32px 18px",
    background: "#080b10",
    color: "#f8fafc",
    boxSizing: "border-box",
  };

  const cardStyle = {
    background: "#111720",
    border: "1px solid #26313e",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "14px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    padding: "9px 13px",
    borderRadius: "8px",
    border: "1px solid #d4af37",
    background: "#d4af37",
    color: "#111827",
    fontWeight: "700",
    cursor: "pointer",
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 10px", fontSize: "30px" }}>
              🔔 Notifications
            </h1>

            <p style={{ margin: 0, color: "#a3adbb" }}>
              You have {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"}.
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loading}
            style={{
              ...buttonStyle,
              opacity: unreadCount === 0 || loading ? 0.5 : 1,
              cursor:
                unreadCount === 0 || loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Mark All as Read
          </button>
        </div>

        {loading ? (
          <div style={cardStyle}>Loading notifications...</div>
        ) : error ? (
          <div style={cardStyle}>
            <p style={{ color: "#f87171" }}>{error}</p>

            <button onClick={fetchNotifications} style={buttonStyle}>
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: "45px 20px",
            }}
          >
            <div style={{ fontSize: "45px" }}>🔕</div>

            <h2>No Notifications Yet</h2>

            <p style={{ color: "#a3adbb" }}>
              Your booking and complaint updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...cardStyle,
                borderLeft: notification.isRead
                  ? "4px solid #475569"
                  : "4px solid #d4af37",
                background: notification.isRead
                  ? "#111720"
                  : "#17202b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ margin: "0 0 12px", fontSize: "18px" }}>
                  {notification.title}
                </h3>

                {!notification.isRead && (
                  <span
                    style={{
                      color: "#facc15",
                      fontSize: "12px",
                      fontWeight: "800",
                    }}
                  >
                    ● NEW
                  </span>
                )}
              </div>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.7,
                  margin: "0 0 14px",
                  overflowWrap: "anywhere",
                }}
              >
                {notification.message}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                  {formatDate(notification.createdAt)}
                </span>

                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    style={buttonStyle}
                  >
                    ✓ Mark as Read
                  </button>
                )}

                {notification.isRead && (
                  <span style={{ color: "#86efac", fontSize: "13px" }}>
                    ✓ Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;