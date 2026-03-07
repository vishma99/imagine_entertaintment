import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/summary.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const Summary = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    dateType: "eventDate",
  });
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [eventToPrint, setEventToPrint] = useState(null);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/events");
      const data = await response.json();
      setEvents(data);
      setFilteredEvents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      setLoading(false);
    }
  };

  const getCategoryStatus = (event, catName) => {
    const cat = catName.toLowerCase();
    if (!event.categories?.[cat]) return "-";
    const equipment = event.equipmentList || [];
    const catItemsRemaining = equipment.filter(
      (item) => item.category.toLowerCase() === cat,
    );
    const isInReturnPhase =
      event.status === "Return" || event.status === "Completed";
    const isFullyReturned = catItemsRemaining.length === 0;
    return isInReturnPhase && isFullyReturned ? "Done" : "Pending";
  };

  // --- 1. PDF එක සෑදීමේ පොදු ශ්‍රිතය (Shared Logic) ---
  const createPDFDocument = (event) => {
    const doc = new jsPDF("p", "mm", "a4");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 60, 114);
    doc.text("IMAGINE ENTERTAINMENT", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Event Summary & Inventory Report", 105, 22, { align: "center" });
    doc.line(14, 25, 196, 25);

    // Info Grid
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Event: ${event.eventName}`, 14, 32);
    doc.text(`Company: ${event.companyName}`, 14, 38);
    doc.text(`Contract: ${event.contractNumber}`, 14, 44);
    doc.text(`Location: ${event.location}`, 120, 32);
    doc.text(`Status: ${event.status}`, 120, 38);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 44);

    // Equipment Logic
    const itemData = (event.equipmentList || []).reduce((acc, curr) => {
      const key = `${curr.category}-${curr.itemName}`;
      if (!acc[key]) {
        acc[key] = {
          category: curr.category.toUpperCase(),
          itemName: curr.itemName,
          qty: 0,
          missing: 0,
        };
      }
      acc[key].qty += 1;
      if (curr.isMissing) acc[key].missing += 1;
      return acc;
    }, {});

    const equipmentRows = Object.values(itemData).map((item) => [
      item.category,
      item.itemName,
      item.qty,
      item.missing > 0 ? `${item.missing} (MISSING)` : "0",
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Category", "Item Name", "Total Out", "Missing Qty"]],
      body: equipmentRows,
      theme: "striped",
      headStyles: { fillColor: [30, 60, 114] },
      didDrawCell: (data) => {
        if (data.column.index === 3 && data.cell.text[0].includes("MISSING")) {
          doc.setTextColor(231, 76, 60); // Red for missing
        }
      },
    });

    // Category Status Table
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text("Overall Category Status:", 14, finalY);
    const summaryRows = ["LED", "Light", "Sound", "Stage", "Truss"]
      .filter((cat) => event.categories?.[cat.toLowerCase()])
      .map((cat) => [
        cat,
        getCategoryStatus(event, cat),
        event.setupDate,
        event.eventDate,
      ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Category", "Status", "Setup Date", "Event Date"]],
      body: summaryRows,
      theme: "grid",
      headStyles: { fillColor: [125, 141, 161] },
    });

    return doc;
  };

  // --- 2. Download PDF Function ---
  const generatePDF = (event) => {
    const doc = createPDFDocument(event);
    doc.save(`${event.eventName}_Summary.pdf`);
    setShowPrintModal(false);
  };

  // --- 3. Email PDF Function ---
  const sendPDFViaEmail = async (event) => {
    const email = prompt("Please enter the email address:");
    if (!email) return;

    const doc = createPDFDocument(event);
    const pdfBlob = doc.output("blob");

    const formData = new FormData();
    formData.append("pdf", pdfBlob, `${event.eventName}_Summary.pdf`);
    formData.append("email", email);
    formData.append("eventName", event.eventName);

    try {
      const response = await fetch(
        "http://localhost:5001/api/send-summary-email",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        alert("Email sent successfully!");
      } else {
        alert("Failed to send email.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error occurred while sending email.");
    }
  };

  const handleFilter = () => {
    const { startDate, endDate, dateType } = filters;
    if (!startDate || !endDate) {
      alert("Please select dates.");
      return;
    }
    const filtered = events.filter((event) => {
      const eventDateValue = event[dateType];
      if (!eventDateValue) return false;
      const dateToCheck = new Date(eventDateValue).setHours(0, 0, 0, 0);
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(0, 0, 0, 0);
      return dateToCheck >= start && dateToCheck <= end;
    });
    setFilteredEvents(filtered);
  };

  const resetFilter = () => {
    setFilters({ startDate: "", endDate: "", dateType: "eventDate" });
    setFilteredEvents(events);
  };

  return (
    <>
      <Navbar />
      <main className="summary-page">
        <h1 className="page-header">Event Summary Report</h1>
        <div className="summary-content-card">
          <div className="filter-bar">
            {/* Filter UI - Same as before */}
            <div className="filter-item">
              <label>Filter By:</label>
              <select
                className="filter-input"
                value={filters.dateType}
                onChange={(e) =>
                  setFilters({ ...filters, dateType: e.target.value })
                }
              >
                <option value="setupDate">Setup Date</option>
                <option value="rehearsalDate">Rehearsal Date</option>
                <option value="eventDate">Event Date</option>
                <option value="endDate">End Date</option>
              </select>
            </div>
            <div className="filter-item">
              <label>From:</label>
              <input
                type="date"
                className="filter-input"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
            <div className="filter-item">
              <label>To:</label>
              <input
                type="date"
                className="filter-input"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <button className="filter-submit-btn" onClick={handleFilter}>
              Filter
            </button>
            <button className="filter-reset-btn" onClick={resetFilter}>
              Reset
            </button>
          </div>

          <div className="table-container">
            <table className="events-table">
              <thead className="sticky-thead">
                <tr className="main-header">
                  <th>Company</th>
                  <th>Event Name</th>
                  <th>Location</th>
                  <th>Client</th>
                  <th>Contract #</th>
                  <th colSpan="4">Dates</th>
                  <th colSpan="4">Categories</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="14">Loading...</td>
                  </tr>
                ) : (
                  filteredEvents.map((row) => (
                    <tr
                      key={row._id}
                      onClick={() => handleRowClick(row)}
                      className="clickable-row"
                    >
                      <td>{row.companyName}</td>
                      <td>{row.eventName}</td>
                      <td>{row.location}</td>
                      <td>{row.clientName}</td>
                      <td>{row.contractNumber}</td>
                      <td className="date-cell">{row.setupDate}</td>
                      <td className="date-cell">{row.rehearsalDate}</td>
                      <td className="date-cell">{row.eventDate}</td>
                      <td className="date-cell">{row.endDate}</td>
                      {["led", "light", "sound", "stage"].map((cat) => (
                        <td key={cat}>
                          <span
                            className={`status-badge ${getCategoryStatus(row, cat) === "Done" ? "status-done-bg" : "status-pending-bg"}`}
                          >
                            {getCategoryStatus(row, cat)}
                          </span>
                        </td>
                      ))}
                      <td>
                        <span
                          className={`status-badge overall-${row.status === "Completed" ? "done" : "progress"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL FOR OPTIONS --- */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Select Action</h2>
            <p>
              Report for <strong>{eventToPrint?.eventName}</strong>
            </p>
            <div
              className="modal-actions"
              style={{ flexDirection: "column", gap: "10px" }}
            >
              <button
                className="update-btn"
                style={{ width: "100%" }}
                onClick={() => generatePDF(eventToPrint)}
              >
                Download PDF
              </button>
              <button
                className="update-btn"
                style={{ width: "100%", backgroundColor: "#10b981" }}
                onClick={() => sendPDFViaEmail(eventToPrint)}
              >
                Send via Email
              </button>
              <button
                className="close-btn"
                style={{ width: "100%" }}
                onClick={() => setShowPrintModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Summary;
