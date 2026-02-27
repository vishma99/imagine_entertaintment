import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/summary.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const Summary = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });

  // State for the Print Confirmation Modal
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

  // --- PDF GENERATION LOGIC ---
  const generatePDF = (event) => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation

    // Title
    doc.setFontSize(18);
    doc.text(`Event Summary Report: ${event.eventName}`, 14, 20);

    // Header Info
    doc.setFontSize(12);
    doc.text(`Company: ${event.companyName}`, 14, 30);
    doc.text(`Contract: ${event.contractNumber}`, 14, 37);
    doc.text(`Location: ${event.location}`, 14, 44);

    // Table Data
    const tableColumn = [
      "Category",
      "Status",
      "Setup Date/Time",
      "Rehearsal Date/Time",
      "Event Date/Time",
      "End Date/Time",
    ];
    const tableRows = [
      [
        "LED",
        getCategoryStatus(event, "led"),
        `${event.setupDate} ${event.setupTime}`,
        `${event.rehearsalDate} ${event.rehearsalTime}`,
        `${event.eventDate} ${event.eventTime}`,
        `${event.endDate} ${event.endTime}`,
      ],
      [
        "Light",
        getCategoryStatus(event, "light"),
        `${event.setupDate} ${event.setupTime}`,
        `${event.rehearsalDate} ${event.rehearsalTime}`,
        `${event.eventDate} ${event.eventTime}`,
        `${event.endDate} ${event.endTime}`,
      ],
      [
        "Sound",
        getCategoryStatus(event, "sound"),
        `${event.setupDate} ${event.setupTime}`,
        `${event.rehearsalDate} ${event.rehearsalTime}`,
        `${event.eventDate} ${event.eventTime}`,
        `${event.endDate} ${event.endTime}`,
      ],
      [
        "Stage",
        getCategoryStatus(event, "stage"),
        `${event.setupDate} ${event.setupTime}`,
        `${event.rehearsalDate} ${event.rehearsalTime}`,
        `${event.eventDate} ${event.eventTime}`,
        `${event.endDate} ${event.endTime}`,
      ],
    ];

    // FIX: Use autoTable(doc, ...) instead of doc.autoTable(...)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [125, 141, 161] }, // Your grey brand color

      styles: { fontSize: 9, cellPadding: 2 },
    });

    doc.save(`${event.eventName}_Summary.pdf`);
    setShowPrintModal(false);
  };

  const handleRowClick = (event) => {
    setEventToPrint(event);
    setShowPrintModal(true);
  };

  // ... (imports remain the same)

  return (
    <>
      <Navbar />
      <main className="summary-page">
        <h1 className="page-header">Event Summary Report</h1>

        <div className="summary-content-card">
          {/* Filter Bar remains same but styled via CSS */}
          <div className="filter-bar">
            <div className="filter-item">
              <label>Start Date :</label>
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
              <label>End Date :</label>
              <input
                type="date"
                className="filter-input"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
            <button className="filter-submit-btn">Filter</button>
          </div>

          {/* --- Updated Table Container --- */}
          <div className="table-container">
            <table className="events-table">
              <thead className="sticky-thead">
                <tr className="main-header">
                  <th rowSpan="2">Company Name</th>
                  <th rowSpan="2">Event Name</th>
                  <th rowSpan="2">Location</th>
                  <th rowSpan="2">Client Name</th>
                  <th rowSpan="2">Contract #</th>
                  <th colSpan="4">Date & Time</th>
                  <th colSpan="4">Categories</th>
                  <th rowSpan="2">Status</th>
                </tr>
                <tr className="sub-header">
                  <th>Setup</th>
                  <th>Rehearsal</th>
                  <th>Event</th>
                  <th>End</th>
                  <th>LED</th>
                  <th>Light</th>
                  <th>Sound</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="14" style={{ textAlign: "center" }}>
                      Loading Summary Data...
                    </td>
                  </tr>
                ) : (
                  events.map((row) => (
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
                      <td className="date-cell">
                        <div>{row.setupDate}</div>
                        <div className="time-sub">{row.setupTime}</div>
                      </td>
                      <td className="date-cell">
                        <div>{row.rehearsalDate}</div>
                        <div className="time-sub">{row.rehearsalTime}</div>
                      </td>
                      <td className="date-cell">
                        <div>{row.eventDate}</div>
                        <div className="time-sub">{row.eventTime}</div>
                      </td>
                      <td className="date-cell">
                        <div>{row.endDate}</div>
                        <div className="time-sub">{row.endTime}</div>
                      </td>

                      {["led", "light", "sound", "stage"].map((cat) => (
                        <td key={cat}>
                          <span
                            className={`status-badge ${getCategoryStatus(row, cat) === "Done" ? "status-done-bg" : "status-pending-bg"}`}
                          >
                            {getCategoryStatus(row, cat)}
                          </span>
                        </td>
                      ))}

                      <td className="status-cell">
                        <span
                          className={`status-badge overall-${row.status === "Completed" ? "done" : "progress"}`}
                        >
                          {row.status === "Completed"
                            ? "Event Done"
                            : "In Progress"}
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
      <Footer />
    </>
  );
};

export default Summary;
