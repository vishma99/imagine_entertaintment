import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/addItem.css";
import EventNavbar from "../compnent/EventNavbar";

const AddItem = () => {
  const { eventId, category } = useParams();
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [eventStatus, setEventStatus] = useState(""); // Captures status from DB
  const [error, setError] = useState("");

  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- 1. FETCH DATA & STATUS ---
  useEffect(() => {
    const fetchExistingItems = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/events/${eventId}`,
        );
        const data = await response.json();

        if (response.ok) {
          setEventStatus(data.status); // Get status (Pending, Ongoing, etc.)

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

  // --- 3. SUBMIT LOGIC (BLOCKED IF ONGOING) ---
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (eventStatus === "Ongoing") return; // Extra safety

    setError("");
    if (!barcode.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:5001/api/items/${barcode.trim()}`,
      );
      if (response.status === 404) {
        setError("Item not found in barcode database.");
        return;
      }
      const item = await response.json();

      if (response.ok) {
        if (item.category.toLowerCase() !== category.toLowerCase()) {
          setError(
            `Category mismatch: Item is ${item.category.toUpperCase()}.`,
          );
          return;
        }
        if (scannedItems.find((i) => i.barcodeID === item.barcodeID)) {
          setError("Item already exists.");
          return;
        }

        const newItemsList = [...scannedItems, item];
        setScannedItems(newItemsList);
        setBarcode("");
        await autoSaveToDatabase(newItemsList);
      }
    } catch (err) {
      setError("Server error.");
    }
  };

  const triggerDeleteModal = (barcodeID) => {
    if (eventStatus === "Ongoing") return; // Can't delete if ongoing
    setItemToDelete(barcodeID);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/events/${eventId}/equipment/${itemToDelete}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setScannedItems(
          scannedItems.filter((item) => item.barcodeID !== itemToDelete),
        );
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Determine if Ongoing
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
                type="text"
                placeholder={
                  isOngoing ? "Editing Disabled (Ongoing)" : "Enter Barcode..."
                }
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={isOngoing} // UNCLICKABLE INPUT
                autoFocus={!isOngoing}
              />

              <button
                type="submit"
                className="add-btn"
                disabled={isOngoing} // UNCLICKABLE BUTTON
                style={{
                  backgroundColor: isOngoing ? "#90EE90" : "", // LIGHT GREEN
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
                  <th>BarcodeId</th>
                  <th>Item Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {scannedItems.length > 0 ? (
                  scannedItems.map((item, index) => (
                    <tr key={item.barcodeID}>
                      <td>
                        {index + 1}. {item.barcodeID}
                      </td>
                      <td>{item.itemName}</td>
                      <td>
                        <button
                          className="delete-btn"
                          disabled={isOngoing}
                          onClick={() => triggerDeleteModal(item.barcodeID)}
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h2>Are you sure?</h2>
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
    </>
  );
};

export default AddItem;
