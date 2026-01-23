import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// --- 1. GET ALL EVENTS ---
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const newEvent = new Event(req.body); // req.body contains the formData from React
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("Creation Error:", error.message);
    res.status(400).json({ message: error.message });
  }
});
1;

// NEW/UPDATED GET ROUTE FOR RETURNING ITEMS
// This is used by ReturnItem.jsx to remove an item from the list
router.get("/:id/return-item-get", async (req, res) => {
  try {
    const eventId = req.params.id;
    const { barcodeID, category } = req.query;

    if (!barcodeID || !category) {
      return res.status(400).json({ message: "Missing barcode or category" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Filter out the specific item
    const originalLength = event.equipmentList.length;
    event.equipmentList = event.equipmentList.filter(
      (item) =>
        !(
          item.barcodeID === barcodeID &&
          item.category.toLowerCase() === category.toLowerCase()
        ),
    );

    // If no item was removed, it means it wasn't in the list
    if (event.equipmentList.length === originalLength) {
      return res
        .status(404)
        .json({ message: "Item not found in this event list" });
    }

    await event.save();
    res.status(200).json({ message: "Item returned successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 3. PUT: SAVE EQUIPMENT (Specific PUT - MUST BE ABOVE GENERIC PUT) ---
router.put("/:id/save-equipment", async (req, res) => {
  try {
    const { items, category } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const otherCategoryItems = event.equipmentList.filter(
      (item) => item.category.toLowerCase() !== category.toLowerCase(),
    );

    event.equipmentList = [...otherCategoryItems, ...items];
    await event.save();
    res.status(200).json({ message: "Equipment updated", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 4. GET: SINGLE EVENT (Generic) ---
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event" });
  }
});

// --- 5. PUT: UPDATE STATUS/DETAILS (Generic PUT - MUST BE LAST) ---
router.put("/:id", async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedEvent)
      return res.status(404).json({ message: "Event not found" });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- 6. DELETE: Remove item from equipmentList in AddItem page ---
router.delete("/:id/equipment/:barcodeID", async (req, res) => {
  try {
    const { id, barcodeID } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Filter out the item with the matching barcodeID
    event.equipmentList = event.equipmentList.filter(
      (item) => item.barcodeID !== barcodeID,
    );

    await event.save();
    res.status(200).json({
      message: "Item deleted successfully",
      equipmentList: event.equipmentList,
    });
  } catch (error) {
    console.error("Delete Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- 6. PUT: MARK ITEMS AS MISSING ---
// Called when the user clicks 'Finish' on the ReturnItem page with items still in the list
router.put("/:id/mark-missing", async (req, res) => {
  try {
    const { items, category } = req.body; // Items that were NOT scanned
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Update the isMissing flag for these specific items in the equipmentList
    event.equipmentList = event.equipmentList.map((item) => {
      // If the item barcode is in the 'missing' list and matches the category
      const isOneOfMissing = items.some((m) => m.barcodeID === item.barcodeID);

      if (
        isOneOfMissing &&
        item.category.toLowerCase() === category.toLowerCase()
      ) {
        return { ...item, isMissing: true };
      }
      return item;
    });

    // Mark the modified path for Mongoose if using mixed types,
    // though usually not needed for standard arrays
    event.markModified("equipmentList");

    await event.save();
    res.status(200).json({ message: "Items marked as missing", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
