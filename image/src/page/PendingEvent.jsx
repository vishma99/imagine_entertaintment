import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/pending.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const PendingEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Pop-up / Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/events");
      const data = await response.json();
      // Only showing events with 'Pending' status
      const pendingEvents = data.filter((event) => event.status === "Pending");
      setEvents(pendingEvents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setLoading(false);
    }
  };

  // Open Pop-up when row is clicked
  const handleRowClick = (item) => {
    setSelectedEvent({ ...item });
    setIsModalOpen(true);
  };

  // Handle changes inside the Modal inputs
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setSelectedEvent((prev) => ({ ...prev, [name]: value }));
  };

  // Save updated data to MongoDB
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5001/api/events/${selectedEvent._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedEvent),
        }
      );

      if (response.ok) {
        alert("Event Updated Successfully!");
        setIsModalOpen(false);
        fetchEvents(); // Refresh the table data
      }
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update event.");
    }
  };

  const handleScan = (e, eventId, category) => {
    e.stopPropagation(); // 🛑 Stops the row click (Pop-up) from opening
    navigate(`/scan/${eventId}/${category.toLowerCase()}`);
  };

  return (
    <>
      <Navbar />
      <main className="pending-page">
        <h1 className="page-header">Pending Events</h1>

        <div className="table-container">
          <table className="events-table">
            <thead>
              <tr className="main-header">
                <th rowSpan="2">Company Name</th>
                <th rowSpan="2">Event Name</th>
                <th rowSpan="2">Location</th>
                <th rowSpan="2">Client Name</th>
                <th rowSpan="2">Contract #</th>
                <th colSpan="3">Date & Time</th>
                <th colSpan="4">Categories</th>
                <th rowSpan="2">Status</th>
              </tr>
              <tr className="sub-header">
                <th>Setup</th>
                <th>Event</th>
                <th>End</th>
                <th>LED</th>
                <th>Light</th>
                <th>Sound</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="13"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Loading your events...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => handleRowClick(item)}
                    className="clickable-row"
                  >
                    <td>{item.companyName}</td>
                    <td>{item.eventName}</td>
                    <td>{item.location}</td>
                    <td>{item.clientName}</td>
                    <td>{item.contractNumber}</td>
                    <td className="date-cell">
                      {item.setupDate} <br /> {item.setupTime}
                    </td>
                    <td className="date-cell">
                      {item.eventDate} <br /> {item.eventTime}
                    </td>
                    <td className="date-cell">
                      {item.endDate} <br /> {item.endTime}
                    </td>

                    {["led", "light", "sound", "stage"].map((cat) => (
                      <td key={cat}>
                        {item.categories?.[cat] ? (
                          <button
                            className="scan-btn"
                            onClick={(e) => handleScan(e, item._id, cat)}
                          >
                            Scan
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    ))}

                    <td className="status-cell">
                      <span className="status-badge">{item.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="13"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No pending events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- EDIT MODAL (Pop-up) --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Edit Event Details</h2>
              <form onSubmit={handleUpdate} className="edit-form">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    name="companyName"
                    value={selectedEvent.companyName}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Event Name</label>
                  <input
                    name="eventName"
                    value={selectedEvent.eventName}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    name="location"
                    value={selectedEvent.location}
                    onChange={handleModalChange}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={selectedEvent.status}
                    onChange={handleModalChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In progress">In progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="update-btn">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default PendingEvents;
