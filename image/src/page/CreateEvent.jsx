import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/eventCreate.css";
import EventNavbar from "../compnent/EventNavbar";

const EventCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: "",
    eventName: "",
    location: "",
    clientName: "",
    contractNumber: "",
    quotationNumber: "",
    categories: { led: false, light: false, sound: false, stage: false },
    setupDate: "",
    setupTime: "",
    eventDate: "",
    eventTime: "",
    endDate: "",
    endTime: "",
  });

  // New State for the Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Show our beautiful custom modal instead of an alert
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        alert("Error: " + errorData.message);
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Could not connect to the server.");
    }
  };

  // Close modal and redirect
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/");
  };

  return (
    <>
      <EventNavbar />
      <div className="form-page-container">
        <div className="form-card">
          <h1 className="form-title">Create New Event</h1>

          <form className="event-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Company Name :</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Event Name :</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Location :</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Client Name :</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Contract Number :</label>
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Quotation Number :</label>
              <input
                type="text"
                name="quotationNumber"
                value={formData.quotationNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="categories-section">
              <label className="main-label">Categories</label>
              <div className="category-grid">
                {["led", "light", "sound", "stage"].map((cat) => (
                  <label className="category-item" key={cat}>
                    {cat.toUpperCase()} :{" "}
                    <input
                      type="checkbox"
                      className="small-input"
                      name={cat}
                      checked={formData.categories[cat]}
                      onChange={handleChange}
                    />
                  </label>
                ))}
              </div>
            </div>

            {[
              { label: "Setup Date and Time", prefix: "setup" },
              { label: "Event Date and Time", prefix: "event" },
              { label: "End Date and Time", prefix: "end" },
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

            <button type="submit" className="submit-btn">
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* --- BEAUTIFUL SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-checkmark">
              <div className="check-icon"></div>
            </div>
            <h2>Success!</h2>
            <p>Your event has been created successfully.</p>
            <button className="success-btn" onClick={handleCloseModal}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCreate;
