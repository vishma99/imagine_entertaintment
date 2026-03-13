import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/addItem.css";
import EventNavbar from "../compnent/EventNavbar";

const ReturnItem = () => {
  const { eventId, category } = useParams();
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  const tableEndRef = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [allEventItems, setAllEventItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const playSound = (type) => {
    const audio = new Audio(
      type === "success" ? "/sounds/success.mp3" : "/sounds/error.mp3",
    );
    audio.play().catch((e) => console.log("Audio play error"));
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://imagine-entertaintment.onrender.com/api/events/${eventId}`,
      );
      const data = await response.json();

      if (data && data.equipmentList) {
        setAllEventItems(data.equipmentList);

        const targetCategory = category ? category.toLowerCase().trim() : "";
        const filtered = data.equipmentList.filter((item) => {
          const itemCat = item.category
            ? item.category.toLowerCase().trim()
            : "";
          // Return නොවූ සහ Missing නොවුණු අයිතම පමණක් පෙන්වයි
          return itemCat === targetCategory && !item.isMissing;
        });
        setScannedItems(filtered);
      }
    } catch (err) {
      setErrorMessage("Could not connect to server.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchItems();
  }, [eventId, category]);

  useEffect(() => {
    tableEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scannedItems]);

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setTimeout(() => barcodeInputRef.current?.focus(), 10);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    try {
      // 1. පද්ධතියේ (Database) අයිතමය තිබේදැයි බැලීම
      const itemCheckResponse = await fetch(
        `https://imagine-entertaintment.onrender.com/api/items/${trimmedBarcode}`,
      );

      if (itemCheckResponse.status === 404) {
        playSound("error");
        setErrorMessage("This barcode does not exist in the system database!");
        setShowErrorModal(true);
        setBarcode("");
        return;
      }

      const itemData = await itemCheckResponse.json();

      // 2. අයිතමය මේ Event එකට අදාළදැයි බැලීම
      const itemInEvent = allEventItems.find(
        (item) => item.barcodeID === trimmedBarcode,
      );

      if (!itemInEvent) {
        playSound("error");
        setErrorMessage(
          `The item "${itemData.itemName}" is NOT assigned to this event!`,
        );
        setShowErrorModal(true);
        setBarcode("");
        return;
      }

      // 3. Return කිරීම
      const response = await fetch(
        `https://imagine-entertaintment.onrender.com/api/events/${eventId}/return-item-get?barcodeID=${trimmedBarcode}&category=${itemInEvent.category}`,
      );

      if (response.ok) {
        playSound("success");
        setScannedItems((prev) =>
          prev.filter((i) => i.barcodeID !== trimmedBarcode),
        );
        setAllEventItems((prev) =>
          prev.filter((i) => i.barcodeID !== trimmedBarcode),
        );
        setBarcode("");
      } else {
        playSound("error");
        setErrorMessage("Return failed. Item might be already returned.");
        setShowErrorModal(true);
        setBarcode("");
      }
    } catch (err) {
      playSound("error");
      setErrorMessage("Server connection failed.");
      setShowErrorModal(true);
    }
  };

  const handleFinish = async () => {
    if (scannedItems.length > 0) {
      try {
        await fetch(
          `https://imagine-entertaintment.onrender.com/api/events/${eventId}/mark-missing`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: scannedItems, category: category }),
          },
        );
      } catch (err) {
        console.error("Error marking missing items");
      }
    }
    setShowSuccessModal(true);
  };

  return (
    <>
      <EventNavbar />
      <main className="add-item-page">
        <div className="add-item-card">
          <h1 className="page-title" style={{ color: "#f59e0b" }}>
            Return Items
          </h1>
          <p className="subtitle">
            Current View:{" "}
            <span className="cat-highlight">{category?.toUpperCase()}</span>
          </p>

          <form className="barcode-form" onSubmit={handleReturnSubmit}>
            <div className="input-container">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan ANY barcode to return..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="add-btn"
                style={{ backgroundColor: "#f59e0b" }}
              >
                Find & Return
              </button>
            </div>
          </form>

          <div className="scanned-table-container">
            <table className="scanned-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={{ textAlign: "center" }}>Loading items...</td>
                  </tr>
                ) : scannedItems.length > 0 ? (
                  scannedItems.map((item, index) => (
                    <tr key={item.barcodeID || index}>
                      <td>
                        {index + 1}. {item.itemName}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row">
                    <td
                      style={{
                        textAlign: "center",
                        color: "green",
                        fontWeight: "bold",
                      }}
                    >
                      ✅ No more items to return in this category!
                    </td>
                  </tr>
                )}
                <div ref={tableEndRef} />
              </tbody>
            </table>
          </div>

          <div className="footer-actions">
            <button className="finish-btn" onClick={handleFinish}>
              Finish Process
            </button>
          </div>
        </div>
      </main>

      {/* --- SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-checkmark">
              <div className="check-icon"></div>
            </div>
            <h2>Process Completed</h2>
            {scannedItems.length > 0 && (
              <p style={{ color: "#dc2626", fontWeight: "bold" }}>
                Warning: {scannedItems.length} items missing!
              </p>
            )}
            <button
              className="success-btn"
              onClick={() => navigate("/pendingEvent")}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* --- ERROR MODAL (Pop-up එක) --- */}
      {showErrorModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="error-modal-box">
            <div
              className="error-icon"
              style={{ fontSize: "40px", marginBottom: "10px" }}
            >
              ⚠️
            </div>
            <h2>Attention!</h2>
            <p style={{ margin: "15px 0" }}>{errorMessage}</p>
            <button className="close-btn" onClick={handleErrorModalClose}>
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnItem;
