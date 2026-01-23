import React from "react";
import { Link } from "react-router-dom";
import "../css/footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Branding Section */}
        <div className="footer-brand">
          <img src="./public/image/logo/logo.jpg" alt="" />
          <div className="footer-text">
            <h2 className="footer-title">Imagine Entertainment</h2>
            <p className="footer-slogan">"We give you the best"</p>
          </div>
        </div>

        {/* Footer Sub-Links */}
        <div className="footer-links">
          <Link to="/" className="footer-link-item">
            Home
          </Link>
          <Link to="/createEvent" className="footer-link-item ">
            Event Create
          </Link>
          <Link to="/pendingEvent" className="footer-link-item">
            Pending Events
          </Link>
          <Link to="/missingItem" className="footer-link-item">
            Missing Items
          </Link>
          <Link to="/summary" className="footer-link-item">
            Summary
          </Link>
        </div>

        <p className="footer-copyright">
          © 2026 Imagine Entertainment. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
