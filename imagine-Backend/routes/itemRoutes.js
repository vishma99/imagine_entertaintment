import express from "express";
import Item from "../models/Item.js";

const router = express.Router();
router.get("/all", async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// POST: Add a new item
router.post("/add", async (req, res) => {
  try {
    const { barcodeID, itemName, category } = req.body;
    const existingItem = await Item.findOne({ barcodeID });

    if (existingItem) {
      // 400 වෙනුවට 200 යැවීමෙන් Console Error එක නැති වේ
      return res.status(200).json({
        success: false,
        message: "Barcode already exists!",
      });
    }

    const newItem = new Item({ barcodeID, itemName, category });
    await newItem.save();
    res
      .status(201)
      .json({ success: true, message: "Item added successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
