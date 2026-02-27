import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../css/summary.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const ItemSummary = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchItemData();
  }, []);

  const fetchItemData = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/inventory-summary",
      );
      const data = await response.json();
      setItems(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching item data:", error);
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // PDF Generation for Inventory
  const generateInventoryPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(18);
    doc.text("Inventory Status Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableColumn = [
      "Barcode",
      "Item Name",
      "Category",
      "Condition",
      "Location",
    ];
    const tableRows = filteredItems.map((item) => [
      item.barcode,
      item.itemName,
      item.category,
      item.isMissing ? "Missing" : "Available",
      item.currentLocation || "Warehouse",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [43, 84, 126] },
    });

    doc.save("Inventory_Summary.pdf");
  };

  return (
    <>
      <Navbar />
      <main className="summary-page">
        <h1 className="page-title1">Item Inventory Summary</h1>

        <div className="summary-content-card">
          <div className="filter-bar">
            <div className="filter-item">
              <label>Search Item:</label>
              <input
                type="text"
                placeholder="Search..."
                className="filter-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>Category:</label>
              <select
                className="filter-input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="LED">LED</option>
                <option value="Light">Light</option>
                <option value="Sound">Sound</option>
                <option value="Stage">Stage</option>
                <option value="Truss">Truss</option>
              </select>
            </div>
            <button
              className="filter-submit-btn"
              onClick={generateInventoryPDF}
            >
              Export PDF
            </button>
          </div>

          <div className="summary-table-container">
            <table className="summary-main-table">
              <thead>
                <tr className="table-header-dark">
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Number of Event</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      Loading Inventory Data...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.slice(0, 20).map(
                    (
                      item, // Performance සඳහා මුල් 20 පෙන්වයි
                    ) => (
                      <tr key={item._id}>
                        <td>{item.itemName}</td>
                        <td>{item.category}</td>
                        <td>
                          <span
                            className={
                              item.isOut ? "status-pending" : "status-done"
                            }
                          >
                            {item.isOut ? "Out (On Site)" : "In Stock"}
                          </span>
                        </td>
                        <td>{item.currentEventName || "Warehouse"}</td>
                        <td>{item.isMissing ? "❌ Missing" : "✅ Good"}</td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No items found.
                    </td>
                  </tr>
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

export default ItemSummary;
