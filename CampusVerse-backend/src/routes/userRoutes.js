import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get user profile details by ID (including friends list)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select("-password")
      .populate("friends", "firstName lastName email course branch photo");
      
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
