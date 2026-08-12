import express from "express";
import User from "../models/User.js";
import { protect, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get user profile details by ID (including friends list)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select("-password")
      .populate("friends", "firstName lastName email course branch photo isVerified role");
      
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle student verification status — super_admin or college_admin only
router.put("/:userId/verify", protect, requireRole(["super_admin", "college_admin"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const userToVerify = await User.findById(userId);
    if (!userToVerify) {
      return res.status(404).json({ message: "User not found" });
    }

    // College admin can only verify users from their own college
    if (req.user.role === "college_admin" && userToVerify.college?.toString() !== req.user.college?.toString()) {
      return res.status(403).json({ message: "Access denied. You can only verify students from your own college." });
    }

    userToVerify.isVerified = !userToVerify.isVerified;
    await userToVerify.save();

    res.status(200).json({
      message: `User is now ${userToVerify.isVerified ? "verified" : "unverified"}`,
      isVerified: userToVerify.isVerified
    });
  } catch (error) {
    console.error("Error toggling verification:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a student user — super_admin or college_admin only
router.delete("/:userId", protect, requireRole(["super_admin", "college_admin"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // College admin can only delete users from their own college
    if (req.user.role === "college_admin" && userToDelete.college?.toString() !== req.user.college?.toString()) {
      return res.status(403).json({ message: "Access denied. You can only delete students from your own college." });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
