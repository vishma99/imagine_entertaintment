import React, { useState, useEffect } from "react";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";
import "../css/member.css";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- Modal States ---
  const [showMemberModal, setShowMemberModal] = useState(false); // New Member Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false); // Leave Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const userRole = localStorage.getItem("userRole");

  const [newMember, setNewMember] = useState({
    name: "",
    nic: "",
    category: "",
    position: "",
  });
  const [leaveData, setLeaveData] = useState({
    category: "",
    position: "",
    memberId: "",
  });

  const categories = [
    "LED",
    "Light",
    "Sound",
    "Stage",
    "Truss",

    "Office",
    "Driver",
    "Cleaning",
  ];
  const techCategories = ["LED", "Light", "Sound", "Stage", "Truss"];
  const techPositions = ["Operator", "Labor", "Other"];
  const officePositions = ["Admin", "HR", "Marketing", "Supervisor", "Normal"];
  const categoryIcons = {
    LED: "🖥️",
    Light: "💡",
    Sound: "🔊",
    Stage: "🏗️",
    Truss: "🛠️",
    Supervisor: "👨‍💼",
    Office: "🏢",
    Driver: "🚛",
    Cleaning: "🧹",
  };
  const categoryColors = {
    LED: "#1e40af",
    Light: "#f59e0b",
    Sound: "#10b981",
    Stage: "#ef4444",
    Truss: "#8b5cf6",
    Supervisor: "#6b7280",
    Office: "#3b82f6",
    Driver: "#14b8a6",
    Cleaning: "#ec4899",
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/members");
      const data = await response.json();
      setMembers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 1. ADD NEW MEMBER FUNCTION
  const handleAddMember = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5001/api/members/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newMember, isAvailable: true }),
      });

      if (response.ok) {
        setShowMemberModal(false);
        setShowSuccessModal(true);
        setNewMember({ name: "", nic: "", category: "", position: "" });
        fetchMembers();
      }
    } catch (err) {
      alert("Error adding member");
    }
  };

  // 2. LEAVE UPDATE FUNCTION
  const handleLeaveUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5001/api/members/update-status/${leaveData.memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable: false }),
        },
      );

      if (response.ok) {
        setShowLeaveModal(false);
        setShowSuccessModal(true);
        setLeaveData({ category: "", position: "", memberId: "" });
        fetchMembers();
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const getStatsForCategory = (cat) => {
    const catMembers = members.filter((m) => m.category === cat);
    return {
      total: catMembers.length,
      available: catMembers.filter((m) => m.isAvailable).length,
      color: categoryColors[cat] || "#1e3c72",
    };
  };

  const getTeamDetails = (cat) => {
    const catMembers = members.filter((m) => m.category === cat);
    if (cat === "Office") {
      return {
        Staffs: catMembers.filter((m) => m.position !== "Supervisor"),
        Supervisors: catMembers.filter((m) => m.position === "Supervisor"),
      };
    }
    const normalCategories = ["Driver", "Cleaning"];
    if (normalCategories.includes(cat)) return { allMembers: catMembers };
    return {
      operators: catMembers.filter((m) => m.position === "Operator"),
      labors: catMembers.filter((m) => m.position === "Labor"),
      others: catMembers.filter((m) => m.position === "Other"),
    };
  };

  if (loading) return <div className="loading">Loading Team Data...</div>;

  return (
    <div className="members-page">
      <Navbar />
      <main className="members-container">
        <h1 className="members-title">Team Availability</h1>
        <div className="members-header-container">
          {(userRole == "Admin" || userRole == "HR") && (
            <div className="header-button-group">
              <button
                className="leave-update-main-btn"
                onClick={() => setShowLeaveModal(true)}
              >
                📅 Leave Update
              </button>

              <button
                className="admin-style-add-btn"
                onClick={() => setShowMemberModal(true)}
              >
                + Add New Member
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {categories.map((cat) => {
            const stats = getStatsForCategory(cat);
            return (
              <div
                key={cat}
                className="stats-card"
                style={{ borderTop: `6px solid ${stats.color}` }}
                onClick={() => setSelectedCategory(cat)}
              >
                <div
                  className="cat-icon"
                  style={{ fontSize: "40px", marginBottom: "10px" }}
                >
                  {categoryIcons[cat] || "👥"}
                </div>
                <h2 className="cat-name">{cat}</h2>
                <div className="stat-row">
                  <span>Total:</span>
                  <span>{stats.total}</span>
                </div>
                <div className="stat-row highlight">
                  <span>Available:</span>
                  <span>{stats.available}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(stats.available / (stats.total || 1)) * 100}%`,
                      backgroundColor: stats.color,
                    }}
                  ></div>
                </div>
                <p className="click-hint">Click to view details</p>
              </div>
            );
          })}
        </div>

        {selectedCategory && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedCategory(null)}
          >
            <div className="team-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedCategory} Team Details</h2>
                <button
                  className="close-x"
                  onClick={() => setSelectedCategory(null)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body-vertical">
                {Object.entries(getTeamDetails(selectedCategory)).map(
                  ([role, staff]) => (
                    <div className="role-group" key={role}>
                      <h3 className="role-title-bar">
                        {role === "allMembers" ? "Staff" : role}
                      </h3>
                      <ul className="member-list-clean">
                        {staff.length > 0 ? (
                          staff.map((m) => (
                            <li key={m._id} className="member-list-item">
                              <span
                                className={`status-dot ${m.isAvailable ? "available" : "leave"}`}
                              ></span>
                              <span className="member-name-text">
                                {m.name}{" "}
                                {m.isAvailable ? "(Available)" : "(On Leave)"}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="no-staff-text">No {role} found</li>
                        )}
                      </ul>
                    </div>
                  ),
                )}
              </div>
              <button
                className="modal-close-btn-full"
                onClick={() => setSelectedCategory(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* --- 2. ADD NEW MEMBER MODAL (Admin Dashboard එකේ වගේම) --- */}
        {showMemberModal && (
          <div className="modal-overlay">
            <div className="admin-modal">
              <div className="modal-header">
                <h2>Add New Staff Member</h2>
                <button
                  className="close-x"
                  onClick={() => setShowMemberModal(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>NIC Number</label>
                  <input
                    type="text"
                    required
                    value={newMember.nic}
                    onChange={(e) =>
                      setNewMember({ ...newMember, nic: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    required
                    value={newMember.category}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        category: e.target.value,
                        position: "",
                      })
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {techCategories.includes(newMember.category) && (
                  <div className="form-group">
                    <label>Position</label>
                    <select
                      required
                      value={newMember.position}
                      onChange={(e) =>
                        setNewMember({ ...newMember, position: e.target.value })
                      }
                    >
                      <option value="">Select Position</option>
                      {techPositions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {newMember.category === "Office" && (
                  <div className="form-group">
                    <label>Office Position</label>
                    <select
                      required
                      value={newMember.position}
                      onChange={(e) =>
                        setNewMember({ ...newMember, position: e.target.value })
                      }
                    >
                      <option value="">Select Position</option>
                      {officePositions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" className="save-btn">
                  Save Member
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- 3. LEAVE UPDATE MODAL --- */}
        {showLeaveModal && (
          <div className="modal-overlay">
            <div className="admin-modal leave-modal">
              <div className="modal-header">
                <h2>Mark Member on Leave</h2>
                <button
                  className="close-x"
                  onClick={() => setShowLeaveModal(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleLeaveUpdate}>
                {/* 1. Category Selection */}
                <div className="form-group">
                  <label>Select Category</label>
                  <select
                    required
                    value={leaveData.category}
                    onChange={(e) =>
                      setLeaveData({
                        ...leaveData,
                        category: e.target.value,
                        position: "",
                        memberId: "",
                      })
                    }
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Position Selection (For Tech Categories) */}
                {techCategories.includes(leaveData.category) && (
                  <div className="form-group">
                    <label>Select Position</label>
                    <select
                      required
                      value={leaveData.position}
                      onChange={(e) =>
                        setLeaveData({
                          ...leaveData,
                          position: e.target.value,
                          memberId: "",
                        })
                      }
                    >
                      <option value="">-- Choose Position --</option>
                      {techPositions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Position Selection (NEW: Specifically for Office Category) */}
                {leaveData.category === "Office" && (
                  <div className="form-group">
                    <label>Select Staff Type</label>
                    <select
                      required
                      value={leaveData.position}
                      onChange={(e) =>
                        setLeaveData({
                          ...leaveData,
                          position: e.target.value,
                          memberId: "",
                        })
                      }
                    >
                      <option value="">-- Choose Type --</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Staff">Staff (Normal/Admin/HR)</option>
                    </select>
                  </div>
                )}

                {/* 4. Member Name Selection */}
                <div className="form-group">
                  <label>Select Member Name</label>
                  <select
                    required
                    value={leaveData.memberId}
                    onChange={(e) =>
                      setLeaveData({ ...leaveData, memberId: e.target.value })
                    }
                  >
                    <option value="">-- Choose Member --</option>
                    {members
                      .filter((m) => {
                        const isSameCategory =
                          m.category === leaveData.category;
                        const isAvailable = m.isAvailable;

                        let matchesPosition = true;
                        if (leaveData.category === "Office") {
                          // Office සඳහා Supervisor ද නැද්ද යන්න පරීක්ෂා කරයි
                          matchesPosition =
                            leaveData.position === "Supervisor"
                              ? m.position === "Supervisor"
                              : m.position !== "Supervisor";
                        } else if (
                          techCategories.includes(leaveData.category)
                        ) {
                          matchesPosition = m.position === leaveData.position;
                        }

                        return (
                          isSameCategory &&
                          isAvailable &&
                          (leaveData.position ? matchesPosition : true)
                        );
                      })
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                </div>

                <button type="submit" className="save-btn leave-btn">
                  Update to On Leave
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- 4. SUCCESS POPUP --- */}
        {showSuccessModal && (
          <div className="success-overlay">
            <div className="success-modal">
              <div className="success-checkmark">
                <div className="check-icon"></div>
              </div>
              <h2>Successfully Updated!</h2>
              <p>Action completed successfully.</p>
              <button
                className="success-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
