import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/home.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const Home = () => {
  const navigate = useNavigate();

  // Navigation data matching your HomePage.png design
  const dashboardItems = [
    { title: "Create Event", path: "/createEvent" },
    { title: "Pending Events", path: "/pendingEvent" },
    { title: "Missing Items", path: "/missingItem" },
    { title: "Summary", path: "/summary" },
  ];

  return (
    <>
      <Navbar />
      <main className="home-container">
        <div className="home-contact">
          <h1 className="home-title">Imagine Entertainment</h1>

          <div className="dashboard-grid">
            {dashboardItems.map((item) => (
              <button
                key={item.title}
                className="grid-card"
                onClick={() => navigate(item.path)}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Home;
