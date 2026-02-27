import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/home.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const Home = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    events: 0,
    members: 0,
    missing: 0,
    ongoing: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resEvents = await fetch("http://localhost:5001/api/events");
        const events = await resEvents.json();

        const resMembers = await fetch("http://localhost:5001/api/members");
        const members = await resMembers.json();

        const totalMissing = events.reduce((acc, event) => {
          const missingCount =
            event.equipmentList?.filter((item) => item.isMissing).length || 0;
          return acc + missingCount;
        }, 0);

        setStats({
          events: events.length,
          members: members.filter((m) => m.isAvailable).length,
          ongoing: events.filter((e) => e.status === "Ongoing").length,
          missing: totalMissing,
        });

        const filteredUpcoming = events
          .filter(
            (e) =>
              e.status === "Pending" ||
              e.status === "Despatch" ||
              e.status === "Ongoing",
          )
          .map((e) => ({
            name: e.eventName,
            date: e.eventDate,
            venue: e.location,
          }))
          .reverse();

        setUpcomingEvents(filteredUpcoming);
      } catch (err) {
        console.log("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  const quickStats = [
    {
      label: "Active Events",
      value: stats.ongoing.toString().padStart(2, "0"),
      color: "#1e40af",
    },
    {
      label: "Staff Available",
      value: stats.members.toString().padStart(2, "0"),
      color: "#10b981",
    },
    {
      label: "Missing Assets",
      value: stats.missing.toString().padStart(2, "0"),
      color: "#ef4444",
    },
  ];

  const dashboardItems = [
    {
      title: "Create Event",
      path: "/createEvent",
      icon: "➕",
      desc: "Plan and launch new events",
    },
    {
      title: "Pending Events",
      path: "/pendingEvent",
      icon: "⏳",
      desc: "Track events awaiting approval",
    },
    {
      title: "Missing Items",
      path: "/missingItem",
      icon: "⚠️",
      desc: "Monitor lost or missing assets",
    },
    {
      title: "Members",
      path: "/member",
      icon: "👥",
      desc: "Staff directory & availability",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="home-container">
        <div className="home-content-wrapper">
          <section className="welcome-banner">
            <div className="welcome-text">
              <h1 className="home-title">Imagine Entertainment</h1>
              <p className="home-subtitle">Operational Control Panel</p>
            </div>

            <div className="quick-stats-container">
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className="stat-box"
                  style={{ borderColor: stat.color }}
                >
                  <span className="stat-value" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="dashboard-grid">
            {dashboardItems.map((item) => (
              <div
                key={item.title}
                className="grid-card"
                onClick={() => navigate(item.path)}
              >
                <div className="card-icon">{item.icon}</div>
                <div className="card-text">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                <div className="card-arrow">→</div>
              </div>
            ))}
          </div>
        </div>

        <div className="upcoming-events-ticker">
          <div className="ticker-label">UPCOMING EVENTS</div>
          <div className="ticker-wrap">
            <div className="ticker-move">
              {upcomingEvents.length > 0 ? (
                [...upcomingEvents, ...upcomingEvents].map((event, index) => (
                  <div key={index} className="ticker-item">
                    <span className="event-date">{event.date}</span>
                    <span className="event-name">{event.name}</span>
                    <span className="event-venue">@{event.venue}</span>
                    <span className="event-divider">|</span>
                  </div>
                ))
              ) : (
                <div className="ticker-item">
                  No upcoming events scheduled at the moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Home;
