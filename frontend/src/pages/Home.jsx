import { Link } from "react-router-dom";
import "../App.css";

function Home() {
  return (
    <div className="home-page">
      <nav className="navbar">
        <Link to="/" className="logo">
          SEAT<span>MATE</span>
        </Link>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="login-btn">
            Login
          </Link>

          <Link to="/register" className="gold-button">
            Get Started
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <p className="eyebrow">✦ YOUR SPACE. YOUR FOCUS. ✦</p>

            <h1>
              ENTER YOUR
              <br />
              <span>SANCTUARY</span>
            </h1>

            <p className="hero-description">
              Discover your perfect study space. Reserve your seat,
              find your focus, and make every moment count.
            </p>

            <div className="hero-buttons">
              <Link to="/register" className="gold-button">
                Reserve Your Seat ↗
              </Link>

              <a href="#features" className="outline-button">
                Explore More
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <h3>28</h3>
                <p>Study Tables</p>
              </div>

              <div className="stat-divider"></div>

              <div>
                <h3>144</h3>
                <p>Seats Available</p>
              </div>

              <div className="stat-divider"></div>

              <div>
                <h3>24/7</h3>
                <p>Focus Mode</p>
              </div>
            </div>
          </div>

          <div className="hero-bottom">
            <span>DISCOVER YOUR SPACE</span>
            <span>✦</span>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <p className="eyebrow">✦ THE SEATMATE EXPERIENCE ✦</p>

            <h2>
              YOUR SPACE,
              <span> REIMAGINED</span>
            </h2>

            <p>
              Everything you need for a smarter, more peaceful
              study experience.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">♧</div>
              <h3>Smart Reservations</h3>
              <p>
                Find and reserve your preferred table and chair
                with our interactive seating layout.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">◇</div>
              <h3>Digital Access</h3>
              <p>
                Keep your booking details together in one convenient
                digital reservation ticket.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">✧</div>
              <h3>Live Availability</h3>
              <p>
                Check seat availability for your selected date
                before confirming your reservation.
              </p>
            </article>
          </div>
        </section>

        <section className="about-section" id="about">
          <p className="eyebrow">✦ BUILT FOR YOUR NEXT CHAPTER ✦</p>

          <h2>FIND YOUR FOCUS.</h2>

          <p>
            A better place to study starts with a seat that's
            waiting for you.
          </p>

          <Link to="/register" className="gold-button">
            Join SeatMate ↗
          </Link>
        </section>
      </main>

      <footer className="footer">
        <Link to="/" className="logo">
          SEAT<span>MATE</span>
        </Link>

        <p>Find your space. Focus on what matters.</p>

        <p>© 2026 SeatMate</p>
      </footer>
    </div>
  );
}

export default Home;