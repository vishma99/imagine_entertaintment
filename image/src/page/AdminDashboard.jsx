import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/adminDashboard.css";
import Navbar from "../compnent/Navbar";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    events: 0,
    members: 0,
    items: 0,
    ongoing: 0,
  });
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    nic: "",
    category: "",
    position: "",
  });
  const [newItem, setNewItem] = useState({
    barcodeID: "",
    itemName: "",
    category: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessModalIteam, setShowSuccessModalIteam] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const techCategories = ["LED", "Light", "Sound", "Stage", "Truss"];
  const otherCategories = ["Office", "Driver", "Cleaning"];
  const officePositions = [
    "Admin",
    "HR",
    "Marketing",
    "Supervisor",
    "View",
    "Normal",
  ];
  const techPositions = ["Section Head", "Operator", "Labor", "Other"];
  const itemCategories = ["LED", "Light", "Sound", "Stage", "Truss"];
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const confirmDelete = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };
  useEffect(() => {
    // 1. SECURITY CHECK
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (role !== "Admin") {
      alert("Access Denied! Admins only.");
      navigate("/");
      return;
    }

    // 2. FETCH DATA (Stats and Users)
    const fetchData = async () => {
      try {
        const resEvents = await fetch("http://localhost:5001/api/events");
        const events = await resEvents.json();

        const resMembers = await fetch("http://localhost:5001/api/members");
        const members = await resMembers.json();
        const resItems = await fetch("http://localhost:5001/api/items/all");
        const itemsList = await resItems.json();
        const resUsers = await fetch(
          "http://localhost:5001/api/user/all-users",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const usersList = await resUsers.json();
        const totalMissing = events.reduce((acc, event) => {
          const missingCount =
            event.equipmentList?.filter((item) => item.isMissing).length || 0;
          return acc + missingCount;
        }, 0);

        setStats({
          events: events.length,
          missingItems: totalMissing,
          members: members.length,
          ongoing: events.filter((e) => e.status === "Ongoing").length,
          items: itemsList.length || 0,
        });

        setUsers(usersList);
      } catch (err) {
        console.log("Error fetching data", err);
      }
    };

    fetchData();
  }, [navigate]);
  const proceedDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/user/delete-user/${userToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setUsers(users.filter((user) => user._id !== userToDelete.id));
        setShowDeleteModal(false);
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert("Error deleting user");
    }
  };
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
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      alert("Error adding member");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/items/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();

      // මෙහිදී data.success පරීක්ෂා කරන්න
      if (response.ok && data.success !== false) {
        setShowItemModal(false);
        setNewItem({ barcodeID: "", itemName: "", category: "" });
        setShowSuccessModalIteam(true);
      } else {
        // Barcode එක තිබේ නම් මෙතැනදී Modal එක පෙන්වයි, නමුත් Console එකේ රතු පාට නොවනු ඇත
        setErrorMessage(data.message || "Something went wrong.");
        setShowErrorModal(true);
      }
    } catch (err) {
      setErrorMessage("Server error. Please check your connection.");
      setShowErrorModal(true);
    }
  };

  return (
    <>
      <Navbar />
      <br />
      <br />
      <br />
      <br />
      <div className="admin-dashboard-container">
        <header className="dashboard-header">
          <h1>Admin Control Center</h1>
          <p>Manage your events, staff, and inventory from here.</p>
        </header>

        {/* --- Quick Stats Section --- */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon event-icon">📅</div>
            <div className="stat-info">
              <h3>Total Events</h3>
              <p>{stats.events}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon ongoing-icon">⚡</div>
            <div className="stat-info">
              <h3>Ongoing</h3>
              <p>{stats.ongoing}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon staff-icon">👥</div>
            <div className="stat-info">
              <h3>Staff Count</h3>
              <p>{stats.members}</p>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon missing-icon">⚠️</div>
            <div className="stat-info">
              <h3>Missing Items</h3>
              <p>{stats.missingItems}</p>
            </div>
          </div>
        </div>

        {/* --- User Management Table Section --- */}
        <div className="user-management-section">
          <h2>Registered System Users</h2>
          <div className="table-responsive">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`role-pill ${user.role.toLowerCase().replace(" ", "-")}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-user-btn"
                        onClick={() => confirmDelete(user._id, user.name)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Action Cards --- */}
        {/* --- Action Cards --- */}
        <div className="action-grid">
          {/* User Management */}
          <div className="action-card">
            <h3>User Management</h3>
            <p>
              Register new users or update system access roles (Admin, HR,
              Marketing).
            </p>
            <div className="action-buttons-group">
              <button className="action-btn">
                <Link to="/register" className="linke">
                  Manage Users
                </Link>
              </button>
            </div>
          </div>

          {/* Staff Directory */}
          <div className="action-card">
            <h3>Staff Directory</h3>
            <p>Manage technicians, drivers, and cleaning staff categories.</p>
            <div className="action-buttons-group">
              <button className="action-btn">
                <Link to="/member" className="linke">
                  View Directory
                </Link>
              </button>
              <button
                className="action-btn secondary-btn"
                onClick={() => setShowMemberModal(true)}
              >
                Add New Member
              </button>
            </div>
          </div>

          {/* Inventory Control */}
          <div className="action-card">
            <h3>Inventory Control</h3>
            <p>Monitor equipment status, missing items, and barcode updates.</p>
            <div className="action-buttons-group">
              <button className="action-btn">
                <Link to="/itemSummary" className="linke">
                  View Inventory
                </Link>
              </button>

              <button
                className="action-btn secondary-btn"
                onClick={() => setShowItemModal(true)}
              >
                Add New Item
              </button>
            </div>
          </div>
        </div>

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
                    onChange={(e) =>
                      setNewMember({ ...newMember, nic: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    required
                    onChange={(e) => {
                      const selectedCat = e.target.value;
                      let defaultPos = "";
                      if (selectedCat === "Driver") {
                        defaultPos = "View";
                      } else if (selectedCat === "Cleaning") {
                        defaultPos = "Normal";
                      } else if (selectedCat === "Supervisor") {
                        defaultPos = "Supervisor";
                      }
                      setNewMember({
                        ...newMember,
                        category: selectedCat,
                        position: defaultPos,
                      });
                    }}
                  >
                    <option value="">Select Category</option>
                    {[...techCategories, ...otherCategories].map((cat) => (
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

        {showItemModal && (
          <div className="modal-overlay">
            <div className="admin-modal">
              <div className="modal-header">
                <h2>Add New Inventory Item</h2>
                <button
                  className="close-x"
                  onClick={() => setShowItemModal(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleAddItem}>
                <div className="form-group">
                  <label>Barcode ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Scan Barcode ID"
                    value={newItem.barcodeID}
                    onChange={(e) =>
                      setNewItem({ ...newItem, barcodeID: e.target.value })
                    }
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LED Panel P3.9"
                    onChange={(e) =>
                      setNewItem({ ...newItem, itemName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    required
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    {itemCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="save-btn">
                  Save Item
                </button>
              </form>
            </div>
          </div>
        )}
        {showSuccessModal && (
          <div className="success-overlay">
            <div className="success-modal">
              <div className="success-checkmark">
                <div className="check-icon"></div>
              </div>
              <h2>Successfully Added!</h2>
              <p>New staff member has been added successfully.</p>
              <button
                className="success-btn"
                onClick={() => window.location.reload()}
              >
                OK
              </button>
            </div>
          </div>
        )}
        {showSuccessModalIteam && (
          <div className="success-overlay">
            <div className="success-modal">
              <div className="success-checkmark">
                <div className="check-icon"></div>
              </div>
              <h2>Successfully Added!</h2>
              <p>New iteam has been added successfully.</p>
              <button
                className="success-btn"
                onClick={() => window.location.reload()}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="modal-overlay delete-confirm-blur">
            <div className="delete-confirm-card">
              <div className="warning-icon">⚠️</div>
              <h2>Are you sure?</h2>
              <p>
                Do you really want to delete{" "}
                <strong>{userToDelete?.name}</strong>? This action cannot be
                undone.
              </p>
              <div className="delete-modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-delete-btn"
                  onClick={proceedDeleteUser}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {showErrorModal && (
          <div className="modal-overlay">
            <div className="error-modal-box">
              <div className="error-icon">⚠️</div>
              <h2>Error!</h2>
              <p>{errorMessage}</p>
              <button
                className="close-btn"
                onClick={() => setShowErrorModal(false)}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
