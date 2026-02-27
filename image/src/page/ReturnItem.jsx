import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/addItem.css"; // AddItem CSS එකම පාවිච්චි කරන්න
import EventNavbar from "../compnent/EventNavbar";

const ReturnItem = () => {
  const { eventId, category } = useParams();
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);

  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States (AddItem එකේ වගේමයි)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const playSound = (type) => {
    const audio = new Audio(
      type === "success" ? "/sounds/success.mp3" : "/sounds/error.mp3",
    );
    audio.play().catch((e) => console.log("Audio play error"));
  };

  // --- 1. පවතින බඩු ලැයිස්තුව ගෙන්වා ගැනීම ---
  useEffect(() => {
    const fetchExistingItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5001/api/events/${eventId}`,
        );
        const data = await response.json();

        if (data && data.equipmentList) {
          const targetCategory = category ? category.toLowerCase().trim() : "";
          // තවම Return කර නැති බඩු පමණක් පෙන්වීමට
          const itemsFromDB = data.equipmentList.filter((item) => {
            const itemCat = item.category
              ? item.category.toLowerCase().trim()
              : "";
            return itemCat === targetCategory && !item.isReturned;
          });
          setScannedItems(itemsFromDB);
        }
      } catch (err) {
        setErrorMessage("Could not connect to server.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchExistingItems();
  }, [eventId, category]);

  // Error Modal එක වැහුවම ආපහු Input එකට Focus කරන්න
  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 10);
  };

  // --- 2. RETURN LOGIC (Handle Return) ---
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    try {
      const response = await fetch(
        `http://localhost:5001/api/events/${eventId}/return-item-get?barcodeID=${trimmedBarcode}&category=${category}`,
      );

      if (response.ok) {
        playSound("success");
        // ලිස්ට් එකෙන් අයින් කරන්න (Scan වුණා කියන එක)
        setScannedItems((prev) =>
          prev.filter((item) => item.barcodeID !== trimmedBarcode),
        );
        setBarcode("");
      } else {
        playSound("error");
        setErrorMessage("Item not found in the current list.");
        setShowErrorModal(true);
        setBarcode("");
      }
    } catch (err) {
      playSound("error");
      setErrorMessage("Server connection failed.");
      setShowErrorModal(true);
    }
  };

  // --- 3. FINISH PROCESS (Mark Missing Items) ---
  const handleFinish = async () => {
    if (scannedItems.length > 0) {
      try {
        await fetch(
          `http://localhost:5001/api/events/${eventId}/mark-missing`,
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
          {/* Title එක සහ Color එක Return එකට ගැලපෙන ලෙස */}
          <h1 className="page-title" style={{ color: "#f59e0b" }}>
            Return Items
          </h1>
          <p className="subtitle">
            Category:{" "}
            <span className="cat-highlight">{category?.toUpperCase()}</span>
          </p>

          <form className="barcode-form" onSubmit={handleReturnSubmit}>
            <div className="input-container">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode to return..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="add-btn"
                style={{ backgroundColor: "#f59e0b" }}
              >
                Find
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
                    <td colSpan="2" style={{ textAlign: "center" }}>
                      Loading items...
                    </td>
                  </tr>
                ) : scannedItems.length > 0 ? (
                  scannedItems.map((item, index) => (
                    <tr key={item.barcodeID || index}>
                      <td>
                        {index + 1}.{item.itemName}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="empty-row">
                    <td
                      colSpan="2"
                      style={{
                        textAlign: "center",
                        color: "green",
                        fontWeight: "bold",
                      }}
                    >
                      ✅ All items successfully returned!
                    </td>
                  </tr>
                )}
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

      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-checkmark">
              <div className="check-icon"></div>
            </div>
            <h2>Process Completed</h2>
            {scannedItems.length > 0 && (
              <p style={{ color: "#dc2626", fontWeight: "bold" }}>
                Warning: {scannedItems.length} items marked as missing!
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

export default ReturnItem;
