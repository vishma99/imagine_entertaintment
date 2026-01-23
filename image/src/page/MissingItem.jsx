import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/missingItem.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const MissingItem = () => {
  const navigate = useNavigate();
  const [missingItems, setMissingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMissingItems = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/events");
        const events = await response.json();

        // Extract only items marked as isMissing: true from all events
        const allMissing = [];
        events.forEach((event) => {
          if (event.equipmentList) {
            event.equipmentList.forEach((item) => {
              if (item.isMissing) {
                allMissing.push({
                  eventId: event._id,
                  eventName: event.eventName,
                  companyName: event.companyName,
                  itemName: item.itemName,
                  barcodeID: item.barcodeID,
                  category: item.category,
                  missingDate: new Date(event.updatedAt).toLocaleDateString(),
                });
              }
            });
          }
        });

        setMissingItems(allMissing);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching missing items:", error);
        setLoading(false);
      }
    };

    fetchMissingItems();
  }, []);

  const handleScanMissing = (eventId, category) => {
    // Navigate back to return page to try and scan it again
    navigate(`/returnitem/${eventId}/${category.toLowerCase()}`);
  };

  return (
    <>
      <Navbar />
      <main className="missing-container">
        <h1 className="missing-header-title">Missing Items Inventory</h1>

        <div className="missing-card">
          <table className="missing-table">
            <thead>
              <tr className="table-top-header">
                <th rowSpan="2">Event / Company</th>
                <th rowSpan="2">Item Name (Barcode)</th>
                <th rowSpan="2">Reported Date</th>
                <th colSpan="4">Action by Category</th>
              </tr>
              <tr className="table-sub-header">
                <th>LED</th>
                <th>Light</th>
                <th>Sound</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Loading missing items...
                  </td>
                </tr>
              ) : missingItems.length > 0 ? (
                missingItems.map((item, index) => (
                  <tr key={`${item.barcodeID}-${index}`}>
                    <td>
                      <strong>{item.eventName}</strong>
                      <br />
                      <small>{item.companyName}</small>
                    </td>
                    <td>
                      {item.itemName}
                      <br />
                      <code style={{ color: "#ec0404" }}>{item.barcodeID}</code>
                    </td>
                    <td className="date-display">{item.missingDate}</td>

                    {/* Only show the Scan button for the category the item belongs to */}
                    {["led", "light", "sound", "stage"].map((cat) => (
                      <td key={cat}>
                        {item.category.toLowerCase() === cat ? (
                          <button
                            className="scan-btn missing-red-btn"
                            onClick={() =>
                              handleScanMissing(item.eventId, item.category)
                            }
                          >
                            Missing
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "green",
                    }}
                  >
                    🎉 No missing items found! All equipment accounted for.
                  </td>
                </tr>
              )}

              {/* Maintain UI structure with empty rows if list is short */}
              {missingItems.length < 3 &&
                !loading &&
                [...Array(3 - missingItems.length)].map((_, i) => (
                  <tr key={`empty-${i}`} className="empty-row">
                    <td colSpan="7">&nbsp;</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MissingItem;
