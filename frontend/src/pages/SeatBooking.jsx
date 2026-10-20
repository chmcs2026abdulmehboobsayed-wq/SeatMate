import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function SeatBooking() {
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reservedSeats, setReservedSeats] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Search and filters
  const [searchTable, setSearchTable] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Library timing: 10 AM to 5 PM
  const timeSlots = [
    { label: "10:00 AM - 11:00 AM", start: "10:00" },
    { label: "11:00 AM - 12:00 PM", start: "11:00" },
    { label: "12:00 PM - 1:00 PM", start: "12:00" },
    { label: "1:00 PM - 2:00 PM", start: "13:00" },
    { label: "2:00 PM - 3:00 PM", start: "14:00" },
    { label: "3:00 PM - 4:00 PM", start: "15:00" },
    { label: "4:00 PM - 5:00 PM", start: "16:00" },
  ];

  // Format local date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const minDate = formatDate(today);

  const maxDateObject = new Date();
  maxDateObject.setDate(maxDateObject.getDate() + 7);
  const maxDate = formatDate(maxDateObject);

  // Load tables
  const loadTables = async () => {
    try {
      const response = await api.get("/tables");
      const data = response.data;

      setTables(Array.isArray(data) ? data : data.tables || []);
    } catch (err) {
      setMessage("Unable to load tables. Please check the backend.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Load reserved seats for selected date and slot
  const loadAvailability = async (date, slot) => {
    if (!date || !slot) {
      setReservedSeats([]);
      return;
    }

    try {
      setAvailabilityLoading(true);

      const reservationDate = new Date(
        `${date}T${slot}:00`
      ).toISOString();

      const response = await api.get("/reservations/availability", {
        params: { reservationDate },
      });

      setReservedSeats(response.data.reservedSeats || []);
    } catch (err) {
      setReservedSeats([]);
      setMessage(
        err.response?.data?.message ||
          "Unable to check seat availability."
      );
      setMessageType("error");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // Check whether a seat is reserved in the selected slot
  const isSeatReserved = (table, chairNumber) => {
    return reservedSeats.some(
      (seat) =>
        String(seat.tableId?._id || seat.tableId) ===
          String(table._id || table.id) &&
        Number(seat.chairNumber) === Number(chairNumber)
    );
  };

  // Check whether a table has an available chair
  const tableHasAvailableSeat = (table) => {
    return (table.chairs || []).some((chair, index) => {
      const number = chair.chairNumber ?? index + 1;
      const status = String(chair.status || "available").toLowerCase();

      return status === "available" && !isSeatReserved(table, number);
    });
  };

  // Select date and prevent Sunday bookings
  const handleDateChange = (e) => {
    const date = e.target.value;

    if (!date) {
      setSelectedDate("");
      setSelectedSlot("");
      setSelected(null);
      setReservedSeats([]);
      setMessage("");
      return;
    }

    const [year, month, day] = date.split("-").map(Number);
    const chosenDate = new Date(year, month - 1, day);

    if (chosenDate.getDay() === 0) {
      setMessage("Sunday is a library holiday. Please select another day.");
      setMessageType("error");
      setSelectedDate("");
      setSelectedSlot("");
      setSelected(null);
      setReservedSeats([]);
      return;
    }

    setSelectedDate(date);
    setSelectedSlot("");
    setSelected(null);
    setReservedSeats([]);
    setMessage("");
  };

  // Check whether the selected slot is in the future
  const isSlotInFuture = (date, start) => {
    if (!date || !start) return false;

    const slotDateTime = new Date(`${date}T${start}:00`);
    return slotDateTime.getTime() > Date.now();
  };

  // Select a time slot
  const handleSlotChange = (slot) => {
    if (!selectedDate) {
      setMessage("Please select a booking date first.");
      setMessageType("error");
      return;
    }

    if (!isSlotInFuture(selectedDate, slot.start)) {
      setMessage("Please select a future time slot.");
      setMessageType("error");
      return;
    }

    setSelectedSlot(slot.start);
    setSelected(null);
    setMessage("");
    loadAvailability(selectedDate, slot.start);
  };

  // Select a chair
  const selectSeat = (table, chair, number) => {
    if (!selectedDate || !selectedSlot) {
      setMessage("Please select your booking date and time slot first.");
      setMessageType("error");
      return;
    }

    const status = String(chair.status || "available").toLowerCase();

    if (status !== "available" || isSeatReserved(table, number)) {
      setMessage("This chair is not available.");
      setMessageType("error");
      return;
    }

    setSelected({
      tableId: table._id || table.id,
      tableNumber: table.tableNumber || table._id,
      section: table.section || "Student Section",
      chairNumber: number,
    });

    setMessage("");
  };

  // Confirm booking
  const bookSeat = async () => {
    if (booking) return;

    if (!selectedDate || !selectedSlot) {
      setMessage("Please select your booking date and time slot.");
      setMessageType("error");
      return;
    }

    if (!selected) {
      setMessage("Please select an available chair first.");
      setMessageType("error");
      return;
    }

    const [year, month, day] = selectedDate.split("-").map(Number);
    const chosenDate = new Date(year, month - 1, day);

    if (chosenDate.getDay() === 0) {
      setMessage("Sunday is a library holiday.");
      setMessageType("error");
      return;
    }

    const reservationDate = new Date(
      `${selectedDate}T${selectedSlot}:00`
    );

    if (reservationDate.getTime() <= Date.now()) {
      setMessage("This time slot has already passed. Select another slot.");
      setMessageType("error");
      return;
    }

    setBooking(true);
    setMessage("");

    try {
      await api.post("/reservations", {
        tableId: selected.tableId,
        chairNumber: selected.chairNumber,
        reservationDate: reservationDate.toISOString(),
      });

      setMessage(
        `Booking successful! Table ${selected.tableNumber}, Chair ${selected.chairNumber}.`
      );
      setMessageType("success");

      setSelected(null);
      setSelectedDate("");
      setSelectedSlot("");
      setReservedSeats([]);

      await loadTables();
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Booking failed. This seat may already be reserved."
      );
      setMessageType("error");
    } finally {
      setBooking(false);
    }
  };

  // Search and filter tables
  const filteredTables = tables.filter((table) => {
    const tableNumber = String(
      table.tableNumber || table._id || ""
    ).toLowerCase();

    const matchesSearch = tableNumber.includes(
      searchTable.trim().toLowerCase()
    );

    const section = String(table.section || "student").toLowerCase();

    const matchesSection =
      sectionFilter === "all" || section === sectionFilter;

    const hasAvailableSeat = tableHasAvailableSeat(table);

    return (
      matchesSearch &&
      matchesSection &&
      (!availableOnly || hasAvailableSeat)
    );
  });

  const filteredStudentTables = filteredTables.filter(
    (table) =>
      String(table.section || "student").toLowerCase() === "student"
  );

  const filteredTeacherTables = filteredTables.filter(
    (table) =>
      String(table.section || "").toLowerCase() === "teacher"
  );

  // Display tables and chairs
  const renderTables = (tableList) =>
    tableList.map((table) => (
      <section
        className="glass-card table-card"
        key={table._id || table.id || table.tableNumber}
      >
        <div className="seat-table-heading">
          <div>
            <h3>Table {table.tableNumber || table._id}</h3>
            <p>{table.section || "Student Section"}</p>
          </div>

          <span className="seat-count">
            {(table.chairs || []).filter((chair, index) => {
              const number = chair.chairNumber ?? index + 1;
              const status = String(
                chair.status || "available"
              ).toLowerCase();

              return (
                status === "available" && !isSeatReserved(table, number)
              );
            }).length}{" "}
            available
          </span>
        </div>

        <div className="chair-grid">
          {(table.chairs || []).map((chair, index) => {
            const number = chair.chairNumber ?? index + 1;
            const status = String(
              chair.status || "available"
            ).toLowerCase();

            const isAvailable =
              status === "available" && !isSeatReserved(table, number);

            const isSelected =
              String(selected?.tableId) ===
                String(table._id || table.id) &&
              Number(selected?.chairNumber) === Number(number);

            return (
              <button
                key={number}
                type="button"
                disabled={!isAvailable}
                className={`chair ${
                  isAvailable ? "available" : "unavailable"
                } ${isSelected ? "selected" : ""}`}
                onClick={() => selectSeat(table, chair, number)}
                title={`${status} — Chair ${number}`}
                aria-label={`Table ${table.tableNumber}, chair ${number}, ${status}`}
              >
                {number}
              </button>
            );
          })}
        </div>
      </section>
    ));

  if (loading) {
    return (
      <main className="page-container seat-loading">
        <p className="dashboard-eyebrow">SEATMATE RESERVATIONS</p>
        <h1 className="gold-text">Finding Available Seats...</h1>
        <p>Please wait while we load the tables.</p>
      </main>
    );
  }

  return (
    <main className="page-container seat-booking-page">
      <Link to="/dashboard" className="seat-back-link">
        ← Back to Dashboard
      </Link>

      <section className="seat-booking-hero">
        <p className="dashboard-eyebrow">YOUR PERSONAL STUDY SPACE</p>
        <h1 className="gold-text">Reserve Your Seat</h1>
        <p>
          Select your date, time slot, and preferred chair to reserve
          your study space.
        </p>
      </section>

      <section className="seat-legend">
        <div>
          <span className="legend-dot legend-available"></span>
          Available
        </div>
        <div>
          <span className="legend-dot legend-selected"></span>
          Selected
        </div>
        <div>
          <span className="legend-dot legend-unavailable"></span>
          Unavailable
        </div>
      </section>

      {message && (
        <div
          className={`seat-message ${
            messageType === "success"
              ? "seat-message-success"
              : "seat-message-error"
          }`}
          role="status"
        >
          {message}
        </div>
      )}

      {/* DATE AND TIME SELECTION */}
      <section
        className="glass-card"
        style={{ padding: "24px", margin: "24px 0" }}
      >
        <p className="dashboard-eyebrow">PLAN YOUR VISIT</p>
        <h2 className="gold-text">Select Booking Date</h2>

        <p style={{ margin: "10px 0" }}>
          Library Hours: 10:00 AM - 5:00 PM
        </p>

        <p style={{ marginBottom: "18px" }}>Sunday: Holiday</p>

        <label
          htmlFor="bookingDate"
          style={{ display: "block", marginBottom: "8px" }}
        >
          Choose Date
        </label>

        <input
          id="bookingDate"
          type="date"
          value={selectedDate}
          min={minDate}
          max={maxDate}
          onChange={handleDateChange}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "350px",
            marginBottom: "12px",
          }}
        />

        {selectedDate && (
          <>
            <h3 className="gold-text" style={{ marginBottom: "14px" }}>
              Select Time Slot
            </h3>

            {availabilityLoading && (
              <p role="status">Checking seat availability...</p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "12px",
              }}
            >
              {timeSlots.map((slot) => {
                const isPast = !isSlotInFuture(
                  selectedDate,
                  slot.start
                );

                return (
                  <button
                    type="button"
                    key={slot.start}
                    disabled={isPast || availabilityLoading}
                    className={
                      selectedSlot === slot.start
                        ? "gold-button"
                        : "glass-card"
                    }
                    onClick={() => handleSlotChange(slot)}
                    style={{
                      padding: "14px",
                      opacity: isPast ? 0.45 : 1,
                      cursor: isPast ? "not-allowed" : "pointer",
                      color:
                        selectedSlot === slot.start
                          ? "#080d0a"
                          : "#f5f0df",
                      border:
                        selectedSlot === slot.start
                          ? "1px solid #c9a64b"
                          : "1px solid #354c3b",
                    }}
                  >
                    {slot.label}
                    {isPast ? " (Passed)" : ""}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* SEARCH AND FILTER */}
      <section
        className="glass-card"
        style={{
          padding: "22px",
          margin: "24px 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          alignItems: "end",
        }}
      >
        <div>
          <label
            htmlFor="searchTable"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Search Table
          </label>

          <input
            id="searchTable"
            type="text"
            placeholder="Enter table number..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label
            htmlFor="sectionFilter"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Filter Section
          </label>

          <select
            id="sectionFilter"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            style={{ width: "100%", padding: "12px" }}
          >
            <option value="all">All Sections</option>
            <option value="student">Student Area</option>
            <option value="teacher">Teacher Area</option>
          </select>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 0",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Available Seats Only
        </label>

        <button
          type="button"
          className="gold-button"
          onClick={() => {
            setSearchTable("");
            setSectionFilter("all");
            setAvailableOnly(false);
          }}
          style={{ padding: "12px" }}
        >
          Clear Filters
        </button>
      </section>

      {/* TABLE SELECTION */}
      {tables.length === 0 ? (
        <div className="glass-card seat-empty">
          <h2>No Tables Found</h2>
          <p>No tables are currently available to display.</p>
          <button className="gold-button" onClick={loadTables}>
            Refresh Tables
          </button>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="glass-card seat-empty">
          <h2>No Matching Tables Found</h2>
          <p>Try changing your search or filters.</p>
          <button
            className="gold-button"
            onClick={() => {
              setSearchTable("");
              setSectionFilter("all");
              setAvailableOnly(false);
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {filteredStudentTables.length > 0 && (
            <section className="seat-section">
              <div className="seat-section-heading">
                <div>
                  <p className="dashboard-eyebrow">STUDENT AREA</p>
                  <h2>Choose Your Table</h2>
                </div>
                <span>{filteredStudentTables.length} tables</span>
              </div>

              <div className="table-grid">
                {renderTables(filteredStudentTables)}
              </div>
            </section>
          )}

          {filteredTeacherTables.length > 0 && (
            <section className="seat-section">
              <div className="seat-section-heading">
                <div>
                  <p className="dashboard-eyebrow">TEACHER AREA</p>
                  <h2>Teacher Tables</h2>
                </div>
                <span>{filteredTeacherTables.length} tables</span>
              </div>

              <div className="table-grid">
                {renderTables(filteredTeacherTables)}
              </div>
            </section>
          )}
        </>
      )}

      {/* BOOKING CONFIRMATION */}
      <section className="seat-confirm-panel">
        <div>
          <p className="dashboard-eyebrow">YOUR SELECTION</p>

          {selected ? (
            <>
              <h2>
                Table {selected.tableNumber} · Chair {selected.chairNumber}
              </h2>

              <p>{selected.section}</p>

              <p>
                Date: {selectedDate} | Slot:{" "}
                {timeSlots.find((slot) => slot.start === selectedSlot)?.label}
              </p>
            </>
          ) : (
            <>
              <h2>No Seat Selected</h2>
              <p>Select a date, time slot, and available chair.</p>
            </>
          )}
        </div>

        <button
          type="button"
          className="gold-button seat-confirm-button"
          onClick={bookSeat}
          disabled={!selected || !selectedDate || !selectedSlot || booking}
        >
          {booking ? "Confirming..." : "Confirm Booking →"}
        </button>
      </section>
    </main>
  );
}

export default SeatBooking;