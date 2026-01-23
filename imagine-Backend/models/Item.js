import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    barcodeID: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    category: { type: String, required: true },
  },
  { collection: "barcode" }
);

export default mongoose.model("Item", itemSchema);
