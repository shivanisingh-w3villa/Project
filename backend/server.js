//server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";

import connectDB from "./config/db.js";
import "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();
connectDB();

const app = express();   // ✅ APP MUST BE CREATED BEFORE USE

app.use(cors());

app.use(express.json());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);  // ✅ AFTER app is declared

app.use("/uploads", express.static("uploads"));


app.listen(5000, () => {
  console.log("Server running on port 5000");
});