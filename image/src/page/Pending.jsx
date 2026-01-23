import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/pending.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const PendingEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // --- STATUS MODAL STATES ---
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const statusOptions = [
    "Pending",
    "Despatch",
    "Ongoing",
    "Return",
    "Completed",
  ];

  // Success Message State
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/events");
      const data = await response.json();
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleRowClick = (item) => {
    // --- RESTRICTION LOGIC ---
    // Only allow editing if status is Pending or Despatch
    if (item.status === "Pending" || item.status === "Despatch") {
      setSelectedEvent({ ...item });
      setIsModalOpen(true);
    } else {
      console.log("Editing is locked for status:", item.status);
      // Optional: alert("Only Pending or Despatch events can be edited.");
    }
  };

  const handleStatusClick = (e, item) => {
    e.stopPropagation();
    setSelectedEvent({ ...item });
    setIsStatusModalOpen(true);
  };

  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setSelectedEvent((prev) => ({
        ...prev,
        categories: { ...prev.categories, [name]: checked },
      }));
    } else {
      setSelectedEvent((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    try {
      const dataToSave = {
        ...selectedEvent,
        contractNumber: Number(selectedEvent.contractNumber),
        quotationNumber: Number(selectedEvent.quotationNumber),
      };

      const response = await fetch(
        `http://localhost:5001/api/events/${selectedEvent._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        },
      );

      if (response.ok) {
        setIsModalOpen(false);
        setIsStatusModalOpen(false);
        setShowUpdateSuccess(true);
        fetchEvents();
      }
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  // --- NAVIGATION LOGIC ---
  const handleScan = (e, item, category) => {
    e.stopPropagation();
    if (item.status === "Ongoing") return;

    const eventId = item._id;
    const cat = category.toLowerCase();

    if (item.status === "Return" || item.status === "Completed") {
      navigate(`/returnitem/${eventId}/${cat}`);
    } else {
      navigate(`/additem/${eventId}/${cat}`);
    }
  };

  // --- HELPER: CHECK IF CATEGORY HAS MISSING ITEMS ---
  const checkMissingByCategory = (event, category) => {
    if (!event.equipmentList) return false;
    return event.equipmentList.some(
      (equipment) =>
        equipment.category.toLowerCase() === category.toLowerCase() &&
        equipment.isMissing === true,
    );
  };

  const getButtonConfig = (item, cat) => {
    const equipment = item.equipmentList || [];
    const catEquipment = equipment.filter(
      (e) => e.category.toLowerCase() === cat.toLowerCase(),
    );

    const isOngoing = item.status === "Ongoing";
    const isInReturnMode =
      item.status === "Return" || item.status === "Completed";
    const hasMissing = checkMissingByCategory(item, cat);
    const isSuccessfullyReturned = isInReturnMode && catEquipment.length === 0;

    if (isOngoing) return { text: "Ongoing", color: "#90EE90", disabled: true };
    if (isSuccessfullyReturned)
      return { text: "Successfully", color: "#065f46", disabled: true };
    if (hasMissing)
      return { text: "Missing", color: "#ec0404", disabled: false };
    if (isInReturnMode)
      return { text: "Return Item", color: "#f59e0b", disabled: false };
    return { text: "Add Item", color: "#2563eb", disabled: false };
  };

  return (
    <>
      <Navbar />
      <main className="pending-page">
        <h1 className="page-header">Event Status Management</h1>
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
                  <td colSpan="13" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : (
                events.map((item) => {
                  const isCompleted = item.status === "Completed";
                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleRowClick(item)}
                      className="clickable-row"
                      style={{
                        backgroundColor: isCompleted
                          ? "#dcfce7"
                          : "transparent",
                        cursor:
                          item.status === "Pending" ||
                          item.status === "Despatch"
                            ? "pointer"
                            : "default",
                      }}
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
                      {["led", "light", "sound", "stage"].map((cat) => {
                        const config = getButtonConfig(item, cat);
                        return (
                          <td key={cat}>
                            {item.categories?.[cat] ? (
                              <button
                                disabled={config.disabled}
                                style={{
                                  backgroundColor: config.color,
                                  color: "#ffffff",
                                  cursor: config.disabled
                                    ? "not-allowed"
                                    : "pointer",
                                  border: "none",
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  fontWeight: "bold",
                                  width: "100px",
                                  transition: "0.3s",
                                }}
                                onClick={(e) => handleScan(e, item, cat)}
                              >
                                {config.text}
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                      <td className="status-cell">
                        <span
                          className={`status-badge status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}
                          onClick={(e) => handleStatusClick(e, item)}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- EDIT MODAL --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Edit Schedule & Categories</h2>
              <p style={{ fontSize: "12px", color: "#666" }}>
                Status: {selectedEvent?.status}
              </p>
              <form onSubmit={handleUpdate} className="edit-form">
                <div className="form-group">
                  <label>Setup Date & Time</label>
                  <div className="input-row">
                    <input
                      type="date"
                      name="setupDate"
                      value={selectedEvent.setupDate || ""}
                      onChange={handleModalChange}
                    />
                    <input
                      type="time"
                      name="setupTime"
                      value={selectedEvent.setupTime || ""}
                      onChange={handleModalChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Event Date & Time</label>
                  <div className="input-row">
                    <input
                      type="date"
                      name="eventDate"
                      value={selectedEvent.eventDate || ""}
                      onChange={handleModalChange}
                    />
                    <input
                      type="time"
                      name="eventTime"
                      value={selectedEvent.eventTime || ""}
                      onChange={handleModalChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>End Date & Time</label>
                  <div className="input-row">
                    <input
                      type="date"
                      name="endDate"
                      value={selectedEvent.endDate || ""}
                      onChange={handleModalChange}
                    />
                    <input
                      type="time"
                      name="endTime"
                      value={selectedEvent.endTime || ""}
                      onChange={handleModalChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Categories</label>
                  <div className="category-edit-grid">
                    {["led", "light", "sound", "stage"].map((cat) => (
                      <label key={cat} className="checkbox-label">
                        <input
                          type="checkbox"
                          name={cat}
                          checked={!!selectedEvent.categories?.[cat]}
                          onChange={handleModalChange}
                        />
                        {cat.toUpperCase()}
                      </label>
                    ))}
                  </div>
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

        {/* --- STATUS UPDATE MODAL --- */}
        {isStatusModalOpen && (
          <div className="modal-overlay">
            <div className="status-update-modal">
              <div className="status-icon-header">⚙️</div>
              <h2>Update Progress Status</h2>
              <p>
                Current Status: <strong>{selectedEvent.status}</strong>
              </p>
              <div className="status-selection-box">
                <select
                  name="status"
                  value={selectedEvent.status}
                  onChange={handleModalChange}
                  className="status-dropdown-select"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions-horizontal">
                <button className="update-status-btn" onClick={handleUpdate}>
                  Update Status
                </button>
                <button
                  className="cancel-status-btn"
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showUpdateSuccess && (
          <div className="success-overlay">
            <div className="success-modal">
              <div className="success-checkmark">
                <div className="check-icon"></div>
              </div>
              <h2>Successfully Updated!</h2>
              <button
                className="success-btn"
                onClick={() => setShowUpdateSuccess(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default PendingEvents;
