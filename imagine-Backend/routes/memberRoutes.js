import express from "express";
import Member from "../models/Member.js";
import Event from "../models/Event.js";

const router = express.Router();

// GET all members
// GET all members with Status Logic
router.get("/", async (req, res) => {
  try {
    const members = await Member.find();

    const activeEvents = await Event.find({ status: { $ne: "Completed" } });

    const memberListWithStatus = members.map((member) => {
      const memberData = member.toObject();

      if (!memberData.isAvailable) {
        return { ...memberData, currentStatus: "On Leave" };
      }

      const isAssigned = activeEvents.some((event) => {
        if (!event.operators) return false;

        return Object.values(event.operators).some((categoryTeam) => {
          return Object.values(categoryTeam).some(
            (staffNames) =>
              Array.isArray(staffNames) && staffNames.includes(memberData.name),
          );
        });
      });

      return {
        ...memberData,
        currentStatus: isAssigned ? "On Event" : "Available",
      };
    });

    res.status(200).json(memberListWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new member
router.post("/", async (req, res) => {
  try {
    const { name, nic, category, position } = req.body;

    // NIC එක දැනටමත් තියෙනවාදැයි බැලීම
    const existingMember = await Member.findOne({ nic });
    if (existingMember) {
      return res
        .status(400)
        .json({ message: "Member with this NIC already exists" });
    }

    const newMember = new Member({
      name,
      nic,
      category,
      position: position,
      isAvailable: true,
    });

    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    // සාමාජිකයා සොයාගෙන ඔහුගේ isAvailable තත්ත්වය update කිරීම
    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { isAvailable: isAvailable },
      { new: true }, // යාවත්කාලීන වූ නව දත්තයන්ම (New Document) ආපසු ලබා ගැනීමට
    );

    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json({
      message: `Status updated successfully to ${isAvailable ? "Available" : "On Leave"}`,
      data: updatedMember,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
