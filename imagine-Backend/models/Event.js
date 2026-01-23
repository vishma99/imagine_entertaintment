import mongoose from "mongoose";

const eventSchem = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    contractNumber: {
      type: Number,
      required: true,
    },
    quotationNumber: {
      type: Number,
      required: true,
    },
    categories: {
      led: { type: Boolean, default: false },
      light: { type: Boolean, default: false },
      sound: { type: Boolean, default: false },
      stage: { type: Boolean, default: false },
    },
    equipmentList: [
      {
        barcodeID: String,
        itemName: String,
        category: String,
        isMissing: { type: Boolean, default: false },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    setupDate: { type: String },
    setupTime: { type: String },
    eventDate: { type: String },
    eventTime: { type: String },
    endDate: { type: String },
    endTime: { type: String },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Despatch", "Ongoing", "Return", "Completed"],
    },
  },
  {
    timestamps: true,
  },
);
const Event = mongoose.model("Event", eventSchem);
export default Event;
