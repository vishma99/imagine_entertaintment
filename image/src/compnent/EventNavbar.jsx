import { Link } from "react-router-dom";
import "../css/navbar.css";

export default function EventNavbar() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return (
    <nav className="navbar-container">
      <div className="logo-section">
        <Link to="/" className="logo-link" onClick={scrollToTop}>
          <img
            src="/image/logo/logo.jpg"
            alt="Imagine Entertainment Logo"
            className="navbar-logo"
          />
        </Link>
      </div>
    </nav>
  );
}
