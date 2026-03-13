import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/addItem.css";
import EventNavbar from "../compnent/EventNavbar";

const ReturnItem = () => {
  const { eventId, category } = useParams();
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  const tableEndRef = useRef(null); // Scroll වීම සඳහා

  const [barcode, setBarcode] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [allEventItems, setAllEventItems] = useState([]); // මුළු Event එකේම බඩු තබා ගැනීමට
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

  // --- 1. සියලුම බඩු ලැයිස්තුව ගෙන්වා ගැනීම ---
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://imagine-entertaintment.onrender.com/api/events/${eventId}`,
      );
      const data = await response.json();

      if (data && data.equipmentList) {
        setAllEventItems(data.equipmentList); // සියලුම බඩු පසුව පාවිච්චියට තබා ගනී

        // දැනට තෝරාගෙන ඇති Category එකට අදාළ, Return නොකළ බඩු පමණක් Table එකේ පෙන්වයි
        const targetCategory = category ? category.toLowerCase().trim() : "";
        const filtered = data.equipmentList.filter((item) => {
          const itemCat = item.category
            ? item.category.toLowerCase().trim()
            : "";
          return itemCat === targetCategory && !item.isMissing; // මෙතන isMissing check එක අවශ්‍ය පරිදි යොදන්න
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

  // අලුත් item එකක් scan කළ විට හෝ ඉවත් කළ විට පහළට scroll කිරීම
  useEffect(() => {
    tableEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scannedItems]);

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setTimeout(() => barcodeInputRef.current?.focus(), 10);
  };

  // --- 2. CROSS-CATEGORY RETURN LOGIC ---
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    // මුලින්ම මුළු Event එකේම බඩු අතර මේ බාර්කෝඩ් එක තිබේදැයි බලයි
    const itemInEvent = allEventItems.find(
      (item) => item.barcodeID === trimmedBarcode,
    );

    if (!itemInEvent) {
      playSound("error");
      setErrorMessage("This item is not assigned to this event.");
      setShowErrorModal(true);
      setBarcode("");
      return;
    }

    try {
      // මෙහිදී භාණ්ඩයේම සැබෑ category එක backend එකට යවයි (itemInEvent.category)
      const response = await fetch(
        `https://imagine-entertaintment.onrender.com/api/events/${eventId}/return-item-get?barcodeID=${trimmedBarcode}&category=${itemInEvent.category}`,
      );

      if (response.ok) {
        playSound("success");

        // පෙන්වන Table එකෙන් අදාළ භාණ්ඩය ඉවත් කරයි
        setScannedItems((prev) =>
          prev.filter((item) => item.barcodeID !== trimmedBarcode),
        );

        // මුළු ලැයිස්තුවත් යාවත්කාලීන කරයි
        setAllEventItems((prev) =>
          prev.filter((item) => item.barcodeID !== trimmedBarcode),
        );

        setBarcode("");
      } else {
        playSound("error");
        setErrorMessage("Return failed. Item might be already returned.");
        setShowErrorModal(true);
        setBarcode("");
      }
    } catch (err) {
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

          {/* SCROLLABLE CONTAINER */}
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
                <div ref={tableEndRef} /> {/* Auto-scroll target */}
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

      {/* Success and Error Modals පවතින පරිදිම තබා ගන්න... */}
      {/* (Success Modal සහ Error Modal කේතය ඔබ කලින් එවූ පරිදිම මෙතනට එයි) */}
    </>
  );
};

export default ReturnItem;
