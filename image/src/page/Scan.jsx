import React from "react";
import "../css/scan.css";
import Navbar from "../compnent/Navbar";
import Footer from "../compnent/Footer";

const Scan = () => {
  // Logic for the scan button would go here
  const handleScanAction = () => {
    console.log("Scanner activated...");
  };

  return (
    <>
      <Navbar />
      <main className="scan-main-container">
        <h1 className="scan-header">Scan</h1>

        <div className="scan-card">
          {/* Viewfinder area - this is where the camera feed would go */}
          <div className="viewfinder-wrapper">
            <div className="viewfinder-frame">
              {/* Corner accents to match UI design */}
              <div className="corner tr"></div>
              <div className="corner tl"></div>
              <div className="corner br"></div>
              <div className="corner bl"></div>

              {/* Optional: Animated scanning line */}
              <div className="scanning-line"></div>
            </div>
          </div>

          <div className="scan-control">
            <button className="scan-submit-btn" onClick={handleScanAction}>
              Scan
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Scan;
