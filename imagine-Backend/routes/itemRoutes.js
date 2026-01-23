import express from "express";
import Item from "../models/Item.js";

const router = express.Router();

// GET: Find a single item by its barcodeID
router.get("/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params; // Get barcode from URL
    console.log("Searching for Barcode:", barcode); // Log for debugging

    // Find the item in the 'barcode' collection
    const item = await Item.findOne({ barcodeID: barcode });

    if (!item) {
      return res.status(404).json({
        message: `Barcode ${barcode} not found in database.`,
      });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
