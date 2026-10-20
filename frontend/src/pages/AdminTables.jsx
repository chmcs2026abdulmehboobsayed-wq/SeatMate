import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../App.css";

function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/tables")
      .then((response) => setTables(response.data.tables || []))
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load tables.")
      )
      .finally(() => setLoading(false));
  }, []);

  const studentTables = tables.filter(
    (table) => table.section === "student"
  );

  const teacherTables = tables.filter(
    (table) => table.section === "teacher"
  );

  const availableChairs = tables.reduce(
    (total, table) =>
      total +
      table.chairs.filter((chair) => chair.status === "available").length,
    0
  );

  const reservedChairs = tables.reduce(
    (total, table) =>
      total +
      table.chairs.filter((chair) => chair.status === "reserved").length,
    0
  );

  const occupiedChairs = tables.reduce(
    (total, table) =>
      total +
      table.chairs.filter((chair) => chair.status === "occupied").length,
    0
  );

  const renderTableSection = (title, sectionTables) => (
    <section className="mt-section">
      <div className="mt-section-heading">
        <div>
          <span className="mt-eyebrow">SEATMATE MANAGEMENT</span>
          <h2>{title}</h2>
        </div>
        <span className="mt-count">{sectionTables.length} Tables</span>
      </div>

      {sectionTables.length === 0 ? (
        <div className="mt-empty">No tables found in this section.</div>
      ) : (
        <div className="mt-grid">
          {sectionTables.map((table) => {
            const available = table.chairs.filter(
              (chair) => chair.status === "available"
            ).length;

            const reserved = table.chairs.filter(
              (chair) => chair.status === "reserved"
            ).length;

            const occupied = table.chairs.filter(
              (chair) => chair.status === "occupied"
            ).length;

            return (
              <article className="mt-table-card" key={table._id}>
                <div className="mt-card-top">
                  <div className="mt-table-icon">▦</div>
                  <div>
                    <h3>Table {table.tableNumber}</h3>
                    <p>
                      {table.section === "teacher"
                        ? "Teacher Section"
                        : `Row ${table.row ?? "—"} · Position ${table.position}`}
                    </p>
                  </div>
                  <span className="mt-chair-total">
                    {table.chairs.length} chairs
                  </span>
                </div>

                <div className="mt-chair-visual">
                  {table.chairs.map((chair) => (
                    <div
                      key={chair._id || chair.chairNumber}
                      className={`mt-chair ${chair.status}`}
                      title={`Chair ${chair.chairNumber}: ${chair.status}`}
                    >
                      {chair.chairNumber}
                    </div>
                  ))}
                </div>

                <div className="mt-card-stats">
                  <div>
                    <span className="mt-dot available-dot" />
                    <span>Available</span>
                    <strong>{available}</strong>
                  </div>
                  <div>
                    <span className="mt-dot reserved-dot" />
                    <span>Reserved</span>
                    <strong>{reserved}</strong>
                  </div>
                  <div>
                    <span className="mt-dot occupied-dot" />
                    <span>Occupied</span>
                    <strong>{occupied}</strong>
                  </div>
                </div>

                <div className="mt-availability">
                  <div className="mt-progress-track">
                    <div
                      className="mt-progress-fill"
                      style={{
                        width: `${
                          table.chairs.length
                            ? (available / table.chairs.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span>
                    {available} of {table.chairs.length} chairs available
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <main className="mt-page">
      <header className="mt-header">
        <div>
          <Link to="/admin" className="mt-back">
            ← Back to Dashboard
          </Link>
          <span className="mt-eyebrow">ADMINISTRATION / TABLES</span>
          <h1>
            Manage <span>Tables.</span>
          </h1>
          <p>
            Monitor table arrangements and real-time chair availability.
          </p>
        </div>

        <div className="mt-live-badge">
          <span /> LIVE OVERVIEW
        </div>
      </header>

      {error && <div className="mt-error">{error}</div>}

      {loading ? (
        <div className="mt-loading">Loading table information...</div>
      ) : (
        <>
          <div className="mt-summary-grid">
            <div className="mt-summary-card">
              <span className="mt-summary-icon">▦</span>
              <p>Total Tables</p>
              <h2>{tables.length}</h2>
              <span className="mt-summary-note">Across all sections</span>
            </div>

            <div className="mt-summary-card">
              <span className="mt-summary-icon">◉</span>
              <p>Available Chairs</p>
              <h2>{availableChairs}</h2>
              <span className="mt-summary-note">Ready for booking</span>
            </div>

            <div className="mt-summary-card">
              <span className="mt-summary-icon">◷</span>
              <p>Reserved Chairs</p>
              <h2>{reservedChairs}</h2>
              <span className="mt-summary-note">Currently reserved</span>
            </div>

            <div className="mt-summary-card">
              <span className="mt-summary-icon">✓</span>
              <p>Occupied Chairs</p>
              <h2>{occupiedChairs}</h2>
              <span className="mt-summary-note">Currently occupied</span>
            </div>
          </div>

          <div className="mt-section-overview">
            <div>
              <span className="mt-eyebrow">SECTION OVERVIEW</span>
              <h2>Space Distribution</h2>
            </div>

            <div className="mt-section-pills">
              <span>Student: {studentTables.length} tables</span>
              <span>Teacher: {teacherTables.length} tables</span>
            </div>
          </div>

          {renderTableSection("Student Section", studentTables)}
          {renderTableSection("Teacher Section", teacherTables)}

          <div className="mt-legend">
            <span><i className="mt-dot available-dot" /> Available</span>
            <span><i className="mt-dot reserved-dot" /> Reserved</span>
            <span><i className="mt-dot occupied-dot" /> Occupied</span>
          </div>
        </>
      )}
    </main>
  );
}

export default AdminTables;