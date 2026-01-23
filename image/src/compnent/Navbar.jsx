import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/navbar.css";

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Event Create", path: "/createEvent" },
    { name: "Pending Events", path: "/pendingEvent" },
    { name: "Missing Items", path: "/missingItem" },
    { name: "Summary", path: "/summary" },
  ];

  return (
    <nav className="navbar-container">
      <div className="logo-section">
        <Link to="/">
          <img
            src="/image/logo/logo.jpg" // Removed "./public" - Vite serves public from /
            alt="Imagine Entertainment Logo"
            className="navbar-logo"
          />
        </Link>
      </div>
      <div className="nav-links-wrapper">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`nav-link-item ${
              location.pathname === link.path ? "active-link" : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>
      <div className="profile-section">
        <button className="profile-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="profile-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
