import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    category: {
      type: String,
      required: true,
      enum: [
        "LED",
        "Light",
        "Sound",
        "Stage",
        "Truss",

        "Office",
        "Driver",
        "Cleaning",
      ],
    },
    position: {
      type: String,

      required: false,
      enum: [
        "Section Head",
        "Operator",
        "Labor",
        "Other",
        "Admin",
        "HR",
        "Marketing",
        "Supervisor",
        "View",
        "Normal",
      ],
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Member = mongoose.model("Member", memberSchema);
export default Member;
