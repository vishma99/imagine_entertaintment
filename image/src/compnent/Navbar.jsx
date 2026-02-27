import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/navbar.css";

const Navbar = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const role = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Event Create", path: "/createEvent" },
    { name: "Pending Events", path: "/pendingEvent" },
    { name: "Missing Items", path: "/missingItem" },
    { name: "Member", path: "/member" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  return (
    <nav className="navbar-container">
      <div className="logo-section">
        <Link to="/" className="logo-link" onClick={scrollToTop}>
          <img
            src="/image/logo/logo.jpg"
            alt="Imagine Logo"
            className="navbar-logo"
          />
          <span className="brand-name">
            IMAGINE <small>ENT.</small>
          </span>
        </Link>
      </div>

      <div className={`nav-links-wrapper ${isMobileOpen ? "active" : ""}`}>
        {role === "Admin" && (
          <Link
            to="/adminDashboard"
            className={`nav-link-item ${location.pathname === "/adminDashboard" ? "active-link" : ""}`}
            onClick={() => setIsMobileOpen(false)}
          >
            Admin Dashboard
          </Link>
        )}

        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`nav-link-item ${location.pathname === link.path ? "active-link" : ""}`}
            onClick={() => setIsMobileOpen(false)}
          >
            {link.name}
          </Link>
        ))}

        <div className="dropdown">
          <button
            className={`nav-link-item dropbtn ${location.pathname.toLowerCase().includes("summary") ? "active-link" : ""}`}
            // අවම වශයෙන් mobile view එකේදී Summary ක්ලික් කළ විට dropdown එක පෙනේ
          >
            Summary ▾
          </button>
          <div className="dropdown-content">
            <Link
              to="/summary"
              onClick={() => setIsMobileOpen(false)}
              className={
                location.pathname === "/summary" ? "dropdown-active" : ""
              }
            >
              Event Summary
            </Link>
            <Link
              to="/itemSummary"
              onClick={() => setIsMobileOpen(false)}
              className={
                location.pathname === "/itemSummary" ? "dropdown-active" : ""
              }
            >
              Item Summary
            </Link>
          </div>
        </div>
      </div>

      <div className="profile-section">
        {userName ? (
          <div
            className="user-profile-wrapper"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="user-details-text">
              <span className="user-name">{userName}</span>
              <span className="user-role-badge">{role}</span>
            </div>

            <div className="user-avatar">
              {getInitial(userName)}
              <div
                className={`online-status ${showMenu ? "active" : ""}`}
              ></div>
            </div>

            {showMenu && (
              <div className="profile-floating-menu">
                <div className="menu-header">
                  <p>Signed in as</p>
                  <strong>{userName}</strong>
                </div>
                <hr />
                <button onClick={handleLogout} className="logout-action-btn">
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-btn-professional">
            Login
          </Link>
        )}
        <div
          className="mobile-menu-icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <span className={isMobileOpen ? "bar open" : "bar"}></span>
          <span className={isMobileOpen ? "bar open" : "bar"}></span>
          <span className={isMobileOpen ? "bar open" : "bar"}></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
