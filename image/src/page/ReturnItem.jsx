  import React, { useState, useEffect } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  import "../css/addItem.css";
  import EventNavbar from "../compnent/EventNavbar";

  const ReturnItem = () => {
    const { eventId, category } = useParams();
    const navigate = useNavigate();
    const [barcode, setBarcode] = useState("");
    const [scannedItems, setScannedItems] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
      const fetchExistingItems = async () => {
        if (!eventId || eventId === "undefined") {
          setLoading(false);
          return;
        }
        try {
          setLoading(true);
          const response = await fetch(
            `http://localhost:5001/api/events/${eventId}`,
          );
          const data = await response.json();

          if (data && data.equipmentList) {
            const targetCategory = category ? category.toLowerCase().trim() : "";
            const itemsFromDB = data.equipmentList.filter((item) => {
              const itemCat = item.category
                ? item.category.toLowerCase().trim()
                : "";
              // We only show items that ARE NOT yet returned
              return itemCat === targetCategory;
            });
            setScannedItems(itemsFromDB);
          }
        } catch (err) {
          setError("Could not connect to server.");
        } finally {
          setLoading(false);
        }
      };
      fetchExistingItems();
    }, [eventId, category]);

    const handleReturn = async (e) => {
      e.preventDefault();
      setError("");
      const trimmedBarcode = barcode.trim();
      if (!trimmedBarcode) return;

      try {
        const response = await fetch(
          `http://localhost:5001/api/events/${eventId}/return-item-get?barcodeID=${trimmedBarcode}&category=${category}`,
        );
        if (response.ok) {
          setScannedItems((prev) =>
            prev.filter((item) => item.barcodeID !== trimmedBarcode),
          );
          setBarcode("");
        } else {
          setError("Item not found in the current list.");
        }
      } catch (err) {
        setError("Server connection failed.");
      }
    };

    const handleFinish = async () => {
      // If there are items left in scannedItems, we mark them as missing in DB
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
            <h1 className="page-title" style={{ color: "#f59e0b" }}>
              Return Item List
            </h1>
            <p className="subtitle">
              Category:{" "}
              <span className="cat-highlight">{category?.toUpperCase()}</span>
            </p>

            <form className="barcode-form" onSubmit={handleReturn}>
              <div className="input-container">
                <input
                  type="text"
                  placeholder="Scan barcode to return..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="add-btn"
                  style={{ background: "#f59e0b" }}
                >
                  Find
                </button>
              </div>
              {error && (
                <p className="error-msg" style={{ color: "red" }}>
                  {error}
                </p>
              )}
            </form>

            <div className="scanned-table-container">
              <table className="scanned-table">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>BarcodeId</th>
                    <th style={{ width: "60%" }}>Item Name</th>
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
                      <tr key={item._id || index}>
                        <td>
                          {index + 1}. {item.barcodeID}
                        </td>
                        <td>{item.itemName}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-row">
                      <td
                        colSpan="2"
                        style={{ textAlign: "center", color: "green" }}
                      >
                        All items successfully returned!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="footer-actions">
              <button className="finish-btn" onClick={handleFinish}>
                Finish
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
                <p style={{ color: "red" }}>
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
      </>
    );
  };

  export default ReturnItem;
