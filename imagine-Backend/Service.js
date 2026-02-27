import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import eventRoutes from "./routes/eventRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import userRouter from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/events", eventRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/user", userRouter);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("Connect error", err);
  });

app.get("/", (req, res) => {
  res.send("Imagine Entertainment API is Running in Import Format...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
