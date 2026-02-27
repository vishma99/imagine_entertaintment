import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/addItem.css";
import EventNavbar from "../compnent/EventNavbar";

const AddItem = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [itemToProcess, setItemToProcess] = useState(null);
  const ADMIN_PASSWORD = "123";
  const { eventId, category } = useParams();
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [eventStatus, setEventStatus] = useState("");
  const [error, setError] = useState("");

  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const playSound = (type) => {
    const audio = new Audio(
      type === "success" ? "/sounds/success.mp3" : "/sounds/error.mp3",
    );
    audio.play().catch((e) => console.log("Audio play error"));
  };

  // --- 1. FETCH DATA & STATUS ---
  useEffect(() => {
    const fetchExistingItems = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/events/${eventId}`,
        );
        const data = await response.json();
        if (response.ok) {
          setEventStatus(data.status);
          if (data.equipmentList) {
            const filteredItems = data.equipmentList.filter(
              (item) => item.category.toLowerCase() === category.toLowerCase(),
            );
            setScannedItems(filteredItems);
          }
        }
      } catch (err) {
        console.error("Failed to load items:", err);
      }
    };
    if (eventId) fetchExistingItems();
  }, [eventId, category]);

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 10);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showErrorModal && event.key === "Enter") {
        event.preventDefault();
        handleErrorModalClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showErrorModal]);

  // --- 2. AUTO-SAVE LOGIC ---
  const autoSaveToDatabase = async (updatedList) => {
    try {
      await fetch(
        `http://localhost:5001/api/events/${eventId}/save-equipment`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updatedList, category: category }),
        },
      );
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  // --- 3. SUBMIT LOGIC ---
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (eventStatus === "Ongoing") return;
    setError("");
    if (!barcode.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:5001/api/items/${barcode.trim()}`,
      );
      if (response.status === 404) {
        setErrorMessage("Item not found in barcode database.");
        setShowErrorModal(true);
        setBarcode("");
        return;
      }
      const item = await response.json();
      if (response.ok) {
        if (item.category.toLowerCase() !== category.toLowerCase()) {
          playSound("error");
          setErrorMessage(
            `Category mismatch: Item is ${item.category.toUpperCase()}.`,
          );
          setShowErrorModal(true);
          setBarcode("");
          return;
        }
        if (scannedItems.find((i) => i.barcodeID === item.barcodeID)) {
          playSound("error");
          setErrorMessage(`Item already scanned: ${item.itemName}`);

          setShowErrorModal(true);
          setBarcode("");
          return;
        }
        playSound("success");
        const newItemsList = [...scannedItems, item];
        setScannedItems(newItemsList);
        setBarcode("");
        await autoSaveToDatabase(newItemsList);
      }
    } catch (err) {
      setErrorMessage("Server error. Please check your connection.");
      setShowErrorModal(true);
    }
  };

  const triggerDeleteModal = (item) => {
    if (eventStatus === "Ongoing" || eventStatus === "Return") return;
    setItemToProcess(item);
    setShowPasswordModal(true);
  };
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      setPasswordInput("");
      setPasswordError("");
      setShowDeleteModal(true); // Password හරි නම් Delete Confirm Modal එක පෙන්වන්න
    } else {
      setPasswordError("Invalid Admin Password!");
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/events/${eventId}/equipment/${itemToProcess.barcodeID}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        setScannedItems(
          scannedItems.filter((i) => i.barcodeID !== itemToProcess.barcodeID),
        );
        setShowDeleteModal(false);
        setItemToProcess(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isOngoing = eventStatus === "Ongoing";

  return (
    <>
      <EventNavbar />
      <main className="add-item-page">
        <div className="add-item-card">
          <h1 className="page-title">Add Item</h1>
          <p className="subtitle">
            Category:{" "}
            <span className="cat-highlight">{category?.toUpperCase()}</span>
          </p>

          <form className="barcode-form" onSubmit={handleBarcodeSubmit}>
            <div className="input-container">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={
                  isOngoing ? "Editing Disabled (Ongoing)" : "Enter Barcode..."
                }
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={isOngoing}
                autoFocus={!isOngoing}
              />
              <button
                type="submit"
                className="add-btn"
                disabled={isOngoing}
                style={{
                  backgroundColor: isOngoing ? "#90EE90" : "",
                  color: isOngoing ? "#ffffff" : "",
                  cursor: isOngoing ? "not-allowed" : "pointer",
                  border: "none",
                }}
              >
                {isOngoing ? "Ongoing" : "Add"}
              </button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>

          <div className="scanned-table-container">
            <table className="scanned-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {scannedItems.length > 0 ? (
                  scannedItems.map((item, index) => (
                    <tr key={item.barcodeID}>
                      <td>
                        {index + 1}.{item.itemName}
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          disabled={isOngoing}
                          onClick={() => triggerDeleteModal(item)}
                          style={{ opacity: isOngoing ? 0.5 : 1 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row">
                    <td colSpan="3">No items scanned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="footer-actions">
            <button
              className="finish-btn"
              onClick={() => setShowSuccessModal(true)}
            >
              Finish Scanning
            </button>
          </div>
        </div>
      </main>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-checkmark">
              <div className="check-icon"></div>
            </div>
            <h2>Session Finished!</h2>
            <button
              className="success-btn"
              onClick={() => navigate("/pendingEvent")}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div
            className="password-modal-box"
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <h2>Security Check</h2>
            <p>Please enter admin password to remove this item.</p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                style={{
                  padding: "10px",
                  width: "80%",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
              {passwordError && (
                <p style={{ color: "red", fontSize: "13px" }}>
                  {passwordError}
                </p>
              )}
              <div
                className="modal-actions"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  className="confirm-delete-btn"
                  style={{
                    background: "#ef4444",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    border: "none",
                  }}
                >
                  Verify
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError("");
                  }}
                  style={{
                    background: "#6b7280",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    border: "none",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h2>Are you sure?</h2>
            <p>
              Do you really want to remove <b>{itemToProcess?.itemName}</b>?
            </p>
            <div className="modal-actions">
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Yes, Remove
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="error-modal-box">
            <div className="error-icon">⚠️</div>
            <h2>Attention!</h2>
            <p>{errorMessage}</p>

            <button
              className="close-btn"
              onClick={handleErrorModalClose}
              autoFocus
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddItem;
