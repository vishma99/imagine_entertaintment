import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/pending.css";
import "../css/eventCreate.css"; // Modal styles සඳහා අත්‍යවශ්‍යයි
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const PendingEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbMembers, setDbMembers] = useState([]);

  const userRole = localStorage.getItem("userRole");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  // --- TEAM POPUP STATES (From EventCreate) ---
  const [showOpModal, setShowOpModal] = useState(false);
  const [currentCat, setCurrentCat] = useState(null);
  const [activeRolePopup, setActiveRolePopup] = useState(null);

  const statusOptions = [
    "Pending",
    "Despatch",
    "Ongoing",
    "Return",
    "Completed",
  ];

  useEffect(() => {
    fetchEvents();
    fetchStaff();
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

  const fetchStaff = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/members");
      const data = await response.json();
      setDbMembers(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  // --- TEAM ASSIGNMENT LOGIC ---
  const getStaffListFromDB = (role) => {
    const roleMap = {
      Operator: "Operator",
      Labors: "Labor",
      Other: "Other",
    };
    const dbRole = roleMap[role] || role;
    return dbMembers.filter(
      (m) =>
        m.category.toLowerCase() === currentCat?.toLowerCase() &&
        m.position === dbRole,
    );
  };

  const handleMultiToggle = (role, name) => {
    const currentList = selectedEvent.operators?.[currentCat]?.[role] || [];
    const newList = currentList.includes(name)
      ? currentList.filter((n) => n !== name)
      : [...currentList, name];

    setSelectedEvent((prev) => ({
      ...prev,
      operators: {
        ...prev.operators,
        [currentCat]: { ...prev.operators[currentCat], [role]: newList },
      },
    }));
  };

  // --- ORIGINAL HANDLERS (Unchanged) ---
  const handleRowClick = (item) => {
    if (userRole === "Admin" || userRole === "Marketing") {
      if (item.status === "Pending" || item.status === "Despatch") {
        setSelectedEvent({ ...item });
        setIsModalOpen(true);
      }
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
        setShowOpModal(false); // Team modal එකත් වසා දමන්න
        setShowUpdateSuccess(true);
        fetchEvents();
      }
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

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

  const checkMissingByCategory = (event, category) => {
    if (!event.equipmentList) return false;
    return event.equipmentList.some(
      (eq) =>
        eq.category.toLowerCase() === category.toLowerCase() &&
        eq.isMissing === true,
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
  const getMemberCurrentEvent = (memberName) => {
    const otherEvents = events.filter(
      (ev) => ev._id !== selectedEvent._id && ev.status !== "Completed",
    );

    for (const ev of otherEvents) {
      if (!ev.operators) continue;

      for (const cat of Object.values(ev.operators)) {
        for (const staffList of Object.values(cat)) {
          if (Array.isArray(staffList) && staffList.includes(memberName)) {
            return ev.eventName;
          }
        }
      }
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <main className="pending-page">
        <h1 className="page-header">Event Status Management</h1>
        <div className="table-container">
          <table className="events-table">
            <thead className="sticky-thead">
              <tr className="main-header" style={{ height: "40px" }}>
                <th rowSpan="2">Company Name</th>
                <th rowSpan="2">Event Name</th>
                <th rowSpan="2">Location</th>
                <th rowSpan="2">Client Name</th>
                <th rowSpan="2">Contract #</th>
                <th colSpan="4">Date & Time</th>
                <th colSpan="5">Categories</th>
                <th rowSpan="2">Member</th>
                <th rowSpan="2">Status</th>
              </tr>
              <tr className="sub-header" style={{ height: "40px" }}>
                <th>Setup</th>
                <th>Rehearsal</th>
                <th>Event</th>
                <th>End</th>
                <th>LED</th>
                <th>Light</th>
                <th>Sound</th>
                <th>Stage</th>
                <th>Truss</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="16" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : (
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
                      <div>{item.setupDate}</div>
                      <div style={{ color: "#666" }}>{item.setupTime}</div>
                    </td>
                    <td className="date-cell">
                      <div>{item.rehearsalDate}</div>
                      <div style={{ color: "#666" }}>{item.rehearsalTime}</div>
                    </td>
                    <td className="date-cell">
                      <div>{item.eventDate}</div>
                      <div style={{ color: "#666" }}>{item.eventTime}</div>
                    </td>
                    <td className="date-cell">
                      <div>{item.endDate}</div>
                      <div style={{ color: "#666" }}>{item.endTime}</div>
                    </td>
                    {["led", "light", "sound", "stage", "truss"].map((cat) => {
                      const config = getButtonConfig(item, cat);
                      return (
                        <td key={cat}>
                          {item.categories?.[cat] ? (
                            <button
                              className="member-btn"
                              disabled={
                                config.disabled ||
                                !(
                                  userRole === "Admin" ||
                                  userRole === "Section User"
                                )
                              }
                              style={{
                                backgroundColor: config.color,
                                color: "#fff",
                                border: "none",
                                padding: "8px",
                                borderRadius: "6px",
                                width: "100px",
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
                    <td>
                      <button
                        className="member-btn"
                        disabled={
                          !(
                            userRole === "Admin" ||
                            userRole === "Marketing" ||
                            userRole === "Section User"
                          ) ||
                          item.status === "Return" ||
                          item.status === "Completed"
                        }
                        style={{
                          padding: "8px 12px",
                          background:
                            item.status === "Return" ||
                            item.status === "Completed"
                              ? "#9ca3af"
                              : "#4b5563",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",

                          cursor:
                            item.status === "Return" ||
                            item.status === "Completed"
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const hasActiveCategories = Object.values(
                            item.categories || {},
                          ).some((val) => val === true);

                          if (!hasActiveCategories) {
                            alert(
                              "Please select at least one category for this event before assigning members.",
                            );
                            return;
                          }
                          setSelectedEvent(item);
                          const firstAvailableCat = Object.keys(
                            item.categories || {},
                          ).find((cat) => item.categories[cat] === true);
                          setCurrentCat(firstAvailableCat || "led");
                          setShowOpModal(true);
                        }}
                      >
                        Member
                      </button>
                    </td>
                    <td className="status-cell">
                      <span
                        className={`status-badge status-${item.status.toLowerCase().replace(/\s+/g, "-")}${!(userRole === "Admin" || userRole === "Section User") ? "disabled-badge" : ""}`}
                        onClick={(e) => {
                          if (
                            userRole === "Admin" ||
                            userRole === "Section User"
                          ) {
                            handleStatusClick(e, item);
                          }
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- TEAM DASHBOARD POPUP (From Member Button) --- */}
        {showOpModal && selectedEvent && (
          <div className="op-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="op-modal large-modal">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <h3>Assign Team for Category</h3>
                <select
                  value={currentCat}
                  onChange={(e) => setCurrentCat(e.target.value)}
                  style={{ padding: "5px" }}
                >
                  {Object.keys(selectedEvent.categories || {})
                    .filter((c) => selectedEvent.categories[c] === true) // False Categories ඉවත් කරයි
                    .map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>
              {["Operator", "Labors", "Other"].map((role, idx) => (
                <div className="role-selection-row" key={role}>
                  <label>
                    {idx + 1}. {role}s:
                  </label>
                  <button
                    type="button"
                    className="role-pop-btn"
                    onClick={() => setActiveRolePopup(role)}
                  >
                    {selectedEvent.operators?.[currentCat]?.[role]?.length || 0}{" "}
                    Selected +
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button className="op-done-btn" onClick={handleUpdate}>
                  Save & Close
                </button>
                <button
                  className="op-done-btn"
                  style={{ background: "#6b7280" }}
                  onClick={() => setShowOpModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MEMBER SELECTION LIST --- */}
        {/* --- MEMBER SELECTION LIST --- */}
        {activeRolePopup && (
          <div className="role-modal-overlay" style={{ zIndex: 1200 }}>
            <div className="role-modal">
              <h4>
                Select {currentCat.toUpperCase()} {activeRolePopup}s
              </h4>
              <div className="selection-list">
                {getStaffListFromDB(activeRolePopup).map((m) => {
                  const assignedEventName = getMemberCurrentEvent(m.name);
                  const isOnLeave = m.isAvailable === false;

                  return (
                    <label
                      key={m._id}
                      className={`selection-item ${isOnLeave ? "disabled-member" : ""}`}
                      style={{
                        backgroundColor: isOnLeave
                          ? "#ef9898"
                          : assignedEventName
                            ? "#fef08a"
                            : "transparent",
                        padding: "8px",
                        borderRadius: "5px",
                        marginBottom: "4px",
                        display: "flex",
                        flexDirection: "column",

                        border: assignedEventName
                          ? "1px solid #eab308"
                          : "1px solid #eee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={isOnLeave}
                          checked={selectedEvent.operators?.[currentCat]?.[
                            activeRolePopup
                          ]?.includes(m.name)}
                          onChange={() =>
                            handleMultiToggle(activeRolePopup, m.name)
                          }
                        />
                        <span
                          style={{
                            fontWeight: assignedEventName ? "bold" : "normal",
                          }}
                        >
                          {m.name} {m.isAvailable ? "✅" : "❌"}
                        </span>
                      </div>

                      {assignedEventName && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#854d0e",
                            marginLeft: "25px",
                            marginTop: "2px",
                          }}
                        >
                          📍 Currently in: <strong>{assignedEventName}</strong>
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <button
                className="role-close-btn"
                onClick={() => setActiveRolePopup(null)}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* --- ORIGINAL EDIT MODAL (Unchanged) --- */}
        {isModalOpen && selectedEvent && (
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
                  <label>Rehearsal Date & Time</label>
                  <div className="input-row">
                    <input
                      type="date"
                      name="rehearsalDate"
                      value={selectedEvent.rehearsalDate || ""}
                      onChange={handleModalChange}
                    />
                    <input
                      type="time"
                      name="rehearsalTime"
                      value={selectedEvent.rehearsalTime || ""}
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
                    {["led", "light", "sound", "stage", "truss"].map((cat) => (
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
                  {statusOptions
                    .filter((opt) => {
                      // දැනට තියෙන Status එක "Return" නම්
                      if (selectedEvent.status === "Return") {
                        // Return සහ Completed පමණක් පෙන්වන්න (Pending, Despatch, Ongoing ඉවත් වේ)
                        return opt === "Return" || opt === "Completed";
                      }
                      // දැනට තියෙන Status එක "Completed" නම්
                      if (selectedEvent.status === "Completed") {
                        // Completed පමණක් පෙන්වන්න
                        return opt === "Completed";
                      }
                      // වෙනත් ඕනෑම අවස්ථාවක (Pending, Despatch, Ongoing) සියල්ල පෙන්වන්න
                      return true;
                    })
                    .map((opt) => (
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

        {/* --- SUCCESS MESSAGE --- */}
        {showUpdateSuccess && (
          <div className="success-overlay">
            <div className="success-modal">
              <div className="success-checkmark">
                <div className="check-icon"></div>
              </div>
              <h2>Successfully Updated!</h2>
              <p>New Status Updated successfully.</p>
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
