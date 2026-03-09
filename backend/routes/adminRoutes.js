// filepath: backend/routes/adminRoutes.js
import express from "express";
import User from "../models/user.js";

const router = express.Router();

// Get all users with plan information (admin only)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email plan planExpiration planStatus createdAt")
      .sort({ createdAt: -1 });

    // Check for expired plans
    const now = new Date();
    const updatedUsers = users.map(user => {
      if (user.planExpiration && new Date(user.planExpiration) < now && user.plan !== "free") {
        user.planStatus = "expired";
      }
      return user;
    });

    res.json(updatedUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user plan (admin only)
router.put("/user/:userId/plan", async (req, res) => {
  try {
    const { plan, planExpiration } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        plan,
        planExpiration: planExpiration ? new Date(planExpiration) : null,
        planStatus: "active",
      },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;