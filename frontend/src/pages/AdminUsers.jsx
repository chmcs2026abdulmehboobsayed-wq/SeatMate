import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/users")
      .then((response) => {
        setUsers(response.data.users || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Unable to load users."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-container admin-users">
      <Link to="/admin">← Admin Dashboard</Link>

      <h1 className="gold-text">Manage Users</h1>
      <p>View all registered SeatMate users.</p>

      <div className="glass-card admin-users-summary">
        <h2>Total Users: {users.length}</h2>
      </div>

      {error && <p className="notice">{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <section className="glass-card">
          <h3>No users found.</h3>
        </section>
      ) : (
        <div className="admin-bookings-table-wrapper">
          <table className="admin-bookings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered On</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user, index) => (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>{user.name || "—"}</td>
                  <td>{user.email || "—"}</td>
                  <td>
                    <span className="admin-booking-status">
                      {user.role || "student"}
                    </span>
                  </td>
                  <td>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default AdminUsers;