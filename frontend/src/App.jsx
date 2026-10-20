import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import SeatBooking from "./pages/SeatBooking";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import Complaints from "./pages/Complaints";
import Notifications from "./pages/Notifications";
import Books from "./pages/Books";

import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminTables from "./pages/AdminTables";
import AdminBookings from "./pages/AdminBookings";
import AdminComplaints from "./pages/AdminComplaints";
import AdminQRScanner from "./components/AdminQRScanner";
import AdminBooks from "./pages/AdminBooks";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/book-seat" element={<SeatBooking />} />

            <Route path="/my-bookings" element={<MyBookings />} />

            <Route path="/profile" element={<Profile />} />

            <Route path="/complaints" element={<Complaints />} />

            <Route
              path="/notifications"
              element={<Notifications />}
            />

            {/* Library Books */}
            <Route path="/books" element={<Books />} />
          </Route>

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Users */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* Admin Reservations */}
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute adminOnly>
                <AdminBookings />
              </ProtectedRoute>
            }
          />

          {/* Admin Tables */}
          <Route
            path="/admin/tables"
            element={
              <ProtectedRoute adminOnly>
                <AdminTables />
              </ProtectedRoute>
            }
          />

          {/* Admin Complaints */}
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute adminOnly>
                <AdminComplaints />
              </ProtectedRoute>
            }
          />

          {/* Admin QR Scanner */}
          <Route
            path="/admin/qr-scanner"
            element={
              <ProtectedRoute adminOnly>
                <AdminQRScanner />
              </ProtectedRoute>
            }
          />

          {/* Admin Book Management */}
          <Route
            path="/admin/books"
            element={
              <ProtectedRoute adminOnly>
                <AdminBooks />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;