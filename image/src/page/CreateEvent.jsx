import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/eventCreate.css";
import EventNavbar from "../compnent/EventNavbar";

const EventCreate = () => {
  const navigate = useNavigate();

  // State for raw members from Database
  const scrollToTop = () => {
    navigate("/");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const [dbMembers, setDbMembers] = useState([]);
  const userRole = localStorage.getItem("userRole");

  const [formData, setFormData] = useState({
    companyName: "",
    eventName: "",
    location: "",
    clientName: "",
    contractNumber: "",
    quotationNumber: "",
    categories: {
      led: false,
      light: false,
      sound: false,
      stage: false,
      truss: false,
    },
    operators: {
      led: { Operator: [], Labors: [], Other: [] },
      light: { Operator: [], Labors: [], Other: [] },
      sound: { Operator: [], Labors: [], Other: [] },
      stage: { Operator: [], Labors: [], Other: [] },
      truss: { Operator: [], Labors: [], Other: [] },
    },
    setupDate: "",
    setupTime: "",
    rehearsalDate: "",
    rehearsalTime: "",
    eventDate: "",
    eventTime: "",
    endDate: "",
    endTime: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOpModal, setShowOpModal] = useState(false);
  const [currentCat, setCurrentCat] = useState(null);
  const [activeRolePopup, setActiveRolePopup] = useState(null);
  const [allEvents, setAllEvents] = useState([]);

  // 1. Fetch members from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Members fetch කිරීම
        const resMembers = await fetch("http://localhost:5001/api/members");
        const membersData = await resMembers.json();
        setDbMembers(membersData);

        const resEvents = await fetch("http://localhost:5001/api/events");
        const eventsData = await resEvents.json();
        setAllEvents(eventsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);
  const getMemberCurrentEvent = (memberName) => {
    const activeEvents = allEvents.filter((ev) => ev.status !== "Completed");

    for (const ev of activeEvents) {
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
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        categories: { ...prev.categories, [name]: checked },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiToggle = (role, name) => {
    const currentList = formData.operators[currentCat][role] || [];
    const newList = currentList.includes(name)
      ? currentList.filter((n) => n !== name)
      : [...currentList, name];

    setFormData((prev) => ({
      ...prev,
      operators: {
        ...prev.operators,
        [currentCat]: { ...prev.operators[currentCat], [role]: newList },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) setShowSuccessModal(true);
    } catch (error) {
      alert("Connection Error.");
    }
  };

  // Helper to filter and sort members (Available/OnEvent first, On Leave last)
  function getStaffListFromDB(role) {
    const roleMap = {
      Operator: "Operator",
      Labors: "Labor",
      Other: "Other",
    };
    const dbRole = roleMap[role] || role;

    const filtered = dbMembers.filter(
      (m) =>
        m.category.toUpperCase() === currentCat.toUpperCase() &&
        m.position === dbRole,
    );

    // Sort Logic: Available සහ On-Event අයව ඉහළින් තබා On Leave අයව පහළට දමයි
    return filtered.sort((a, b) => {
      const aStatus = a.isAvailable || a.isOnEvent ? 1 : 0;
      const bStatus = b.isAvailable || b.isOnEvent ? 1 : 0;
      return bStatus - aStatus;
    });
  }

  return (
    <>
      <EventNavbar />
      <div className="form-page-container">
        <div className="form-card">
          <h1 className="form-title">Create New Event</h1>
          <form className="event-form" onSubmit={handleSubmit}>
            {[
              "companyName",
              "eventName",
              "location",
              "clientName",
              "contractNumber",
              "quotationNumber",
            ].map((field) => (
              <div className="input-group" key={field}>
                <label>
                  {field
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}{" "}
                  :
                </label>
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div className="categories-section">
              <label className="main-label">Categories & Operators</label>
              <div className="category-grid">
                {["led", "light", "sound", "stage", "truss"].map((cat) => (
                  <div key={cat} className="category-card">
                    <label className="category-item">
                      <span className="cat-text">{cat.toUpperCase()} :</span>
                      <input
                        type="checkbox"
                        className="small-input"
                        name={cat}
                        checked={formData.categories[cat]}
                        onChange={handleChange}
                      />
                    </label>
                    {formData.categories[cat] && (
                      <button
                        type="button"
                        className="op-assign-button"
                        onClick={() => {
                          setCurrentCat(cat);
                          setShowOpModal(true);
                        }}
                      >
                        {formData.operators[cat].Operator.length > 0
                          ? `${formData.operators[cat].Operator.length} assigned`
                          : "Assign Team +"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {[
              { label: "Setup Date and Time", prefix: "setup" },
              { label: "Rehearsal Date and Time", prefix: "rehearsal" },
              { label: "Event Date and Time", prefix: "event" },
              { label: "Event End Date and Time", prefix: "end" },
            ].map((section) => (
              <div className="datetime-section" key={section.prefix}>
                <label className="main-label">{section.label}</label>
                <div className="datetime-row">
                  <div className="datetime-field">
                    <span>Date :</span>
                    <input
                      type="date"
                      className="date-input"
                      onChange={handleChange}
                      name={`${section.prefix}Date`}
                      value={formData[`${section.prefix}Date`]}
                    />
                  </div>
                  <div className="datetime-field">
                    <span>Time :</span>
                    <input
                      type="time"
                      className="time-input"
                      onChange={handleChange}
                      name={`${section.prefix}Time`}
                      value={formData[`${section.prefix}Time`]}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="submit-btn"
              disabled={!(userRole === "Admin" || userRole === "Marketing")}
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {showOpModal && (
        <div className="op-modal-overlay">
          <div className="op-modal large-modal">
            <h3>Assign Team for {currentCat.toUpperCase()}</h3>
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
                  {formData.operators[currentCat][role]?.length || 0} Selected +
                </button>
              </div>
            ))}
            <button
              className="op-done-btn"
              onClick={() => setShowOpModal(false)}
            >
              Save Team Details
            </button>
          </div>
        </div>
      )}

      {activeRolePopup && (
        <div className="role-modal-overlay">
          <div className="role-modal">
            <h4>
              Select {currentCat.toUpperCase()} {activeRolePopup}s
            </h4>
            <div className="selection-list">
              {getStaffListFromDB(activeRolePopup).map((member) => {
                const onLeave =
                  member.isAvailable === false && !member.isOnEvent;
                const assignedEventName = getMemberCurrentEvent(member.name); // වෙනත් Event එකක සිටීදැයි බලයි

                return (
                  <label
                    key={member._id}
                    className={`selection-item ${onLeave ? "on-leave" : ""}`}
                    style={{
                      // පසුබිම් වර්ණ පාලනය
                      backgroundColor: onLeave
                        ? "#f3f4f6"
                        : assignedEventName
                          ? "#fef9c3"
                          : "transparent",
                      opacity: onLeave ? 0.6 : 1,
                      cursor: onLeave ? "not-allowed" : "pointer",
                      display: "flex",
                      flexDirection: "column",
                      padding: "10px",
                      borderBottom: "1px solid #eee",
                      borderLeft: assignedEventName
                        ? "5px solid #facc15"
                        : "none", // පැත්තකින් කහ ඉරක්
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
                        disabled={onLeave}
                        checked={formData.operators[currentCat][
                          activeRolePopup
                        ].includes(member.name)}
                        onChange={() =>
                          handleMultiToggle(activeRolePopup, member.name)
                        }
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: assignedEventName ? "bold" : "normal",
                          }}
                        >
                          {member.name}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: onLeave
                              ? "#d32f2f"
                              : assignedEventName
                                ? "#854d0e"
                                : "#2e7d32",
                          }}
                        >
                          {onLeave
                            ? "On Leave ❌"
                            : assignedEventName
                              ? "On Another Event ⚠️"
                              : "Available ✅"}
                        </span>
                      </div>
                    </div>

                    {assignedEventName && !onLeave && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#a16207",
                          marginLeft: "25px",
                          marginTop: "4px",
                          fontStyle: "italic",
                        }}
                      >
                        📍 Busy with: <strong>{assignedEventName}</strong>
                      </div>
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

      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-checkmark">
              <div className="check-icon"></div>
            </div>
            <h2>Success!</h2>
            <p>New Event Create!</p>
            <button className="success-btn" onClick={scrollToTop}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCreate;
